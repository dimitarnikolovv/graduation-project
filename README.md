# Архитектура и потоци на платформата

Този документ описва подробно четирите основни потока в проекта: видео съдържание, тестове, покупки/достъп и права/разрешения. За всяка част е посочен точният файл, от който е извлечена информацията, заедно с релативното му разположение в проекта.

---

## Съдържание

1. [Поток при видео съдържание](#1-поток-при-видео-съдържание)
2. [Поток при тестовете](#2-поток-при-тестовете)
3. [Поток при покупка / достъп](#3-поток-при-покупка--достъп)
4. [Поток при права и достъп](#4-поток-при-права-и-достъп)

---

## 1. Поток при видео съдържание

### 1.1. Локална обработка на видеото (FFmpeg скрипт)

Преди качване видеото се обработва **локално** чрез shell скрипт, който генерира HLS (HTTP Live Streaming) сегменти и плейлисти.

**Файл:** `ffmpeg-create-hls.sh` (в основната (root) папка)

Скриптът приема входен видео файл и поддържа два режима:

- **Multi-resolution (по подразбиране)** - генерира три резолюции: 1080p, 720p, 480p
- **Single resolution (`--single`)** - запазва оригиналната резолюция

```bash
# Употреба:
./ffmpeg-create-hls.sh path/to/video.mp4 [--single] [--no-thumbs]
```

Изходната структура на папката е:

```
<name>-hls/
  ├── master.m3u8                 # Главен плейлист
  ├── output_0/playlist.m3u8      # 1080p плейлист + .ts сегменти
  ├── output_1/playlist.m3u8      # 720p плейлист + .ts сегменти
  ├── output_2/playlist.m3u8      # 480p плейлист + .ts сегменти
  ├── thumbnails.vtt              # VTT файл за thumbnail sprites (по избор)
  └── thumbnails/                 # Thumbnail изображения (по избор)
      ├── thumb_000.jpg
      ├── thumb_001.jpg
      └── ...
```

Thumbnail-ите се генерират с fps=1/10 (на всеки 10 секунди) и мащаб 160px ширина. VTT файлът създава времеви mapping към всеки thumbnail.

**Файл:** `ffmpeg-create-hls.sh`, редове 74–98

```bash
ffmpeg -i "$INPUT" -vf "fps=1/10,scale=160:-1" -q:v 5 -start_number 0 "$THUMBS_DIR/thumb_%03d.jpg"
```

---

### 1.2. Кой качва видеото?

Видеото се качва **единствено от администратори** (`RolesEnum.admin`). Проверката за роля се извършва в API endpoint-a за инициализиране на качването:

**Файл:** `src/routes/api/hls/init-upload/+server.ts`, редове 65–67

```typescript
if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
    return json({ error: 'Unauthorized' }, { status: 401 });
}
```

Функцията `checkIfUserAndRole` идва от:

**Файл:** `src/lib/server/auth.ts`, редове 104–111

```typescript
export function checkIfUserAndRole(locals: App.Locals, role: RolesEnum[] | RolesEnum) {
    if (!locals.user || !locals.user.role) return false;

    if (Array.isArray(role)) {
        return role.includes(locals.user.role) ? true : false;
    }

    return locals.user.role === role ? true : false;
}
```

Същата проверка (`RolesEnum.admin`) се прилага и при отмяна на качването:

**Файл:** `src/routes/api/hls/cancel-upload/+server.ts`, редове 6–8

```typescript
if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
    return json({ error: 'Unauthorized' }, { status: 401 });
}
```

Интерфейсът за качване на видеа е достъпен в контролния център:

**Файл:** `src/routes/control-centre-v1/videos/upload/+page.svelte`

---

### 1.3. Процес на качване (клиентска страна)

Целият процес на качване минава през три стъпки, управлявани от клиентската функция `uploadHLSViaPresigned`:

**Файл:** `src/lib/s3.ts`

Константата за папката в S3:

```typescript
export const HLS_UPLOAD_FOLDER = 'videos/hls' as const;
```

**Стъпка 1: Инициализация (`/api/hls/init-upload`)**

Клиентът изпраща метаданни за master плейлиста. Сървърът създава запис в таблицата `videos` в базата данни и връща `videoId` и `pathToUpload`.

Валидационна схема:

**Файл:** `src/routes/api/hls/init-upload/schema.ts`

```typescript
export const hlsInitUploadSchema = z.object({
    size: z.number().min(0),
    displayName: z.string(),
    type: z.string(),
    webkitRelativePath: z.string(),
    hasThumbnails: z.boolean().optional(),
    vttFileRelativePath: z.string().optional()
});
```

Сървърната логика:

**Файл:** `src/routes/api/hls/init-upload/+server.ts`, функция `initUpload`, редове 11–59

Пътят в S3 се формира като: `videos/hls/<videoId>/<relativeFilePath>`

```typescript
const pathToUpload = `${HLS_UPLOAD_FOLDER}/${videoId}`;
const fileKey = `${pathToUpload}/${relativePath}`;
```

При инициализацията в базата се записва:

```typescript
await db.insert(videos).values({
    fileKey,            // пълен път до master.m3u8 в S3
    id: videoId,        // генериран уникален ID
    originalName,       // име на изходната папка
    displayName,        // потребителско име (напр. "Въведение в алгебрата")
    contentType: type,  // "application/vnd.apple.mpegurl"
    size,               // размер в байтове
    thumbnailsKey: vttFileKey, // път до VTT файла за thumbnails (ако има)
    status: VideoStatusEnum.processing, // статус: "processing"
    uploadedById: userId // ID на администратора, който качва
});
```

**Стъпка 2: Генериране на Presigned URLs (`/api/hls/presign`)**

За всеки файл от HLS папката сървърът генерира presigned URL за директно качване към S3.

**Файл:** `src/routes/api/hls/presign/+server.ts`

```typescript
const command = new PutObjectCommand({
    Bucket: PRIVATE_S3_BUCKET_NAME,
    Key: key,
    ContentType: type || 'application/octet-stream'
});

const url = await getSignedUrl(s3, command, {
    expiresIn: 60 * 60 * 5 // 5 часа валидност
});
```

Клиентът качва всеки файл поотделно директно в S3 чрез тези presigned URLs, като следи прогреса чрез `UploadProgress` store.

**Стъпка 3: Финализиране (`/api/hls/complete-upload`)**

След успешно качване на всички файлове, клиентът извиква API-то за завършване, което маркира видеото като `uploaded`:

**Файл:** `src/routes/api/hls/complete-upload/+server.ts`

```typescript
const [video] = await db
    .update(videos)
    .set({
        status: VideoStatusEnum.uploaded
    })
    .where(eq(videos.id, videoId))
    .returning();
```

---

### 1.4. Какво точно се записва в базата данни (Drizzle схема `videos`)

**Файл:** `src/lib/server/db/schema/videos.ts`

```typescript
export const videos = pgTable('videos', {
    id: text('id').primaryKey(),
    fileKey: text('file_key').notNull().unique(),        // пълен път в S3, напр. "videos/hls/<id>/master.m3u8"
    originalName: text('original_name').notNull(),       // оригинално име на папката
    contentType: text('content_type').notNull(),         // MIME type
    size: bigint('size', { mode: 'number' }).notNull(),  // размер в байтове
    displayName: text('display_name').notNull(),         // потребителско име
    thumbnailsKey: text('thumbnails_key'),               // път до .vtt файла за thumbnails (опционално)
    status: videoStatusEnum('status'),                   // pending | uploaded | processing | failed
    subjectId: integer('subject_id'),                    // предмет (опционално)
    classGradeId: integer('class_grade_id'),             // клас (опционално)
    uploadedById: text('uploaded_by_id'),                // кой е качил видеото
    posterFileId: text('poster_file_id'),                // постер изображение (от таблица files)
    chaptersFileId: text('chapters_file_id'),            // файл с глави/chapters (от таблица files)
    createdAt, updatedAt, deletedAt                      // timestamps
});
```

Възможните статуси на видеото:

**Файл:** `src/lib/types/enums.ts`, `VideoStatusEnum`

```typescript
export enum VideoStatusEnum {
    pending = 'pending',       // Изчаква се
    uploaded = 'uploaded',     // Качено успешно
    processing = 'processing', // Обработва се (по време на качване)
    failed = 'failed'          // Неуспешно
}
```

Видеото има релации към:

- `posterFile` - файл с постер изображение (от таблица `files`)
- `chaptersFile` - VTT файл с глави (от таблица `files`)
- `subject` - предмет
- `classGrade` - клас
- `lesson` - уроци, които използват това видео

Таблицата `files` е обща за файлове (постери, глави и други):

**Файл:** `src/lib/server/db/schema/files.ts`

```typescript
export const files = pgTable('files', {
    id: text('id').primaryKey(),
    fileKey: text('file_key').notNull().unique(),
    originalName: text('original_name').notNull(),
    contentType: text('content_type').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    displayName: text('display_name').notNull(),
    uploadedById: text('uploaded_by_id'),
    createdAt, updatedAt, deletedAt
});
```

---

### 1.5. Видеото свързва ли се директно към урок при качване?

**Не.** Видеото се качва независимо и първоначално съществува само в таблица `videos`. Връзката с урок се създава **по-късно**, когато администратор/учител създаде или редактира урок и подбере видео от вече качените.

Урокът задължително изисква `videoId`:

**Файл:** `src/lib/server/db/schema/lessons.ts`, ред 22

```typescript
videoId: text('video_id')
    .references(() => videos.id, { onDelete: 'restrict' })
    .notNull(), // Video ID
```

Забележете `onDelete: 'restrict'` - видео, което е свързано с урок, **не може да бъде изтрито**.

Избор на видео при създаване на урок се прави чрез специален компонент:

**Файл:** `src/routes/control-centre-v1/lessons/VideoSelectComponent/VideoSelect.svelte`

---

### 1.6. Стрийминг на видео

Видеоклиповете се стриймват чрез специален API endpoint, който пренаписва `.m3u8` плейлистите, като заменя пътищата до `.ts` сегментите с presigned S3 URLs, а вътрешните `.m3u8` файлове - с линкове обратно към API-то:

**Файл:** `src/routes/api/hls/stream/[videoId]/[...fileKey]/+server.ts`

```typescript
// .ts файлове -> presigned URL за стрийминг
if (line.endsWith('.ts')) {
    const tsKey = `${basePath}/${line}`;
    const signed = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: PRIVATE_S3_BUCKET_NAME,
        Key: tsKey
    }), { expiresIn: CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS });
    return signed;
}

// .m3u8 файлове -> пренасочване обратно към API-то
if (line.endsWith('.m3u8')) {
    const innerKey = `${basePath}/${line}`;
    return new URL(`${PUBLIC_HOST}/api/hls/stream/${videoId}/${innerKey}`).toString();
}
```

Преди стрийминг се проверява дали видеото съществува в базата:

```typescript
const video = await db.query.videos.findFirst({
    where: eq(videos.id, videoId)
});

if (!video) {
    throw error(404, 'Video not found');
}
```

---

### 1.7. Отмяна на качване

При отмяна на качване:

1. **Клиент:** Прекъсва мрежови заявки чрез `AbortController`
2. **Сървър:** Изтрива всички вече качени обекти от S3 и записа от базата

**Файл:** `src/lib/s3.ts`, функция `cancelHLSUpload`

```typescript
export async function cancelHLSUpload({ videoId, uploadProgress }) {
    const ctrl = uploadControllers.get(videoId);
    if (ctrl) {
        ctrl.abort('user-cancelled');
        uploadControllers.delete(videoId);
    }
    await fetch('/api/hls/cancel-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
    });
    uploadProgress.update((p) => ({ ...p, status: 'canceled' }));
}
```

**Файл:** `src/lib/server/server-utils/files.ts`, функция `deleteUploadedVideo`

```typescript
// Изтрива всички S3 обекти в директорията videos/hls/<videoId>/
const listRes = await s3.send(new ListObjectsV2Command({
    Bucket: PRIVATE_S3_BUCKET_NAME,
    Prefix: `${HLS_UPLOAD_FOLDER}/${foundVideo.id}/`
}));
const keys = (listRes.Contents || []).map((obj) => ({ Key: obj.Key! }));
if (keys.length > 0) {
    await s3.send(new DeleteObjectsCommand({
        Bucket: PRIVATE_S3_BUCKET_NAME,
        Delete: { Objects: keys }
    }));
}
// + изтрива постер и chapters файл ако има такива
// + изтрива записа от таблицата videos
```

---

### 1.8. S3 конфигурация

**Файл:** `src/lib/server/s3.ts`

Клиентът е `S3Client` от AWS SDK, конфигуриран с `forcePathStyle: true` (за съвместимост с MinIO/R2), с KeepAlive HTTP агент.

```typescript
const s3 = new S3Client({
    endpoint: PRIVATE_S3_ENDPOINT,
    forcePathStyle: true,
    region: PRIVATE_S3_REGION,
    credentials: {
        accessKeyId: PRIVATE_S3_ACCESS_KEY,
        secretAccessKey: PRIVATE_S3_SECRET_KEY
    }
});
```

---

## 2. Поток при тестовете

### 2.1. Структура на тест (Drizzle схема)

**Файл:** `src/lib/server/db/schema/tests.ts`

Тестът е основната единица и съдържа:

```typescript
export const tests = pgTable('tests', {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: text('author_id'),               // автор (администратор/учител)
    lastEditedById: text('last_edited_by_id'),  // последно редактирал
    title: text('title').notNull(),
    allowedAttempts: integer('allowed_attempts').default(0), // 0 = неограничен брой опити
    description: text('description').notNull(),
    timeLimitSec: integer('time_limit_sec').default(0),     // 0 = без лимит
    opensAt: timestamp('opens_at'),            // кога се отваря (null = веднага)
    closesAt: timestamp('closes_at'),          // кога се затваря (null = никога)
    questionsPerPage: integer('questions_per_page').default(3),
    maxScore: real('max_score').default(0),     // изчислено поле
    subjectId: integer('subject_id').notNull(), // предмет
    classGradeId: integer('class_grade_id').notNull(), // клас
    isPaid: boolean('is_paid').default(false),  // платен ли е
    isFeatured: boolean('is_featured').default(false),
    featuredOrder: integer('featured_order').default(0),
    priceInCents: integer('price_in_cents').default(0), // цена в стотинки
    publishedStatus: publishedStatusEnum('published_status') // published | hidden | draft
});
```

**Constraints в базата данни:**

```typescript
check('ensure_price_if_paid', sql`isPaid = false OR priceInCents > 0`)
check('ensure_opens_before_closes', sql`opensAt IS NULL OR closesAt IS NULL OR opensAt < closesAt`)
```

### 2.2. Тестът към урок ли е вързан?

**Да, но опционално.** Урокът може да има свързан тест:

**Файл:** `src/lib/server/db/schema/lessons.ts`, ред 36

```typescript
testId: uuid('test_id').references(() => tests.id, { onDelete: 'set null' }),
```

Тестът е **самостоятелна единица** - може да съществува и без урок. Типичният сценарий е:

- Тестът се създава отделно в контролния център (`src/routes/control-centre-v1/tests/create/`)
- При създаване/редактиране на урок, администраторът опционално избира тест чрез `TestSelectComponent`:

**Файл:** `src/routes/control-centre-v1/lessons/TestSelectComponent/TestSelect.svelte`

---

### 2.3. Типове въпроси

Има **4 типа** въпроси:

**Файл:** `src/lib/types/enums.ts`, `QuestionTypeEnum`

```typescript
export enum QuestionTypeEnum {
    SingleChoice = 'SingleChoice',      // Един верен отговор
    MultipleChoice = 'MultipleChoice',  // Няколко верни отговора
    Text = 'Text',                      // Свободен текст
    FileUpload = 'FileUpload'           // Прикачен файл
}
```

Всеки въпрос се записва в таблица `test_questions`:

**Файл:** `src/lib/server/db/schema/tests.ts`, таблица `testQuestions`

```typescript
export const testQuestions = pgTable('test_questions', {
    id: uuid('id').defaultRandom().primaryKey(),
    testId: uuid('test_id').notNull(),          // към кой тест принадлежи
    order: integer('order').default(0),         // ред на показване
    type: questionType('type').notNull(),        // SingleChoice | MultipleChoice | Text | FileUpload
    stem: text('stem').notNull(),               // текстът на въпроса
    points: real('points').default(1.0),        // максимален брой точки
    config: jsonb('config').notNull()            // JSON конфигурация (различна по тип)
});
```

**Конфигурацията варира по тип:**

**Файл:** `src/lib/types/tests.ts`

```typescript
// За SingleChoice / MultipleChoice:
export type ChoiceConfig = {
    options: QuestionOption[];  // [{ id: number, text: string }]
    correct: number[];         // масив от верни option ID-та
};

// За Text:
export type TextConfig = {
    maxLength: number;
    sampleAnswer: string;
};

// За FileUpload:
export type FileUploadConfig = {
    allowedTypes: string[];    // напр. ['image/*', 'application/pdf']
    maxFileSizeMB: number;
    maxFiles: number;
    instructions?: string;
};
```

---

### 2.4. Как протича опит (attempt) на тест

Всеки опит на ученик се записва в таблица `test_attempts`:

**Файл:** `src/lib/server/db/schema/tests.ts`, таблица `testAttempts`

```typescript
export const testAttempts = pgTable('test_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    testId: uuid('test_id').notNull(),
    userId: text('user_id').notNull(),
    attemptNumber: integer('attempt_number').notNull(), // 1, 2, 3...
    status: attemptStatus('status'),     // Started | Submitted | Graded
    startedAt: timestamp('started_at').defaultNow().notNull(),
    submittedAt: timestamp('submitted_at'),
    gradedAt: timestamp('graded_at'),
    totalScore: real('total_score').default(0),
    reviewerObservations: text('reviewer_observations') // коментари от учител при ръчно оценяване
});
```

Статусите на опит:

**Файл:** `src/lib/types/enums.ts`, `AttemptStatusEnum`

```typescript
export enum AttemptStatusEnum {
    Started = 'Started',     // Започнат - ученикът още работи
    Submitted = 'Submitted', // Предаден - очаква ръчно оценяване
    Graded = 'Graded'        // Оценен - всички точки са определени
}
```

---

### 2.5. Отговори на ученици

Всеки отделен отговор се записва в таблица `test_answers`:

**Файл:** `src/lib/server/db/schema/tests.ts`, таблица `testAnswers`

```typescript
export const testAnswers = pgTable('test_answers', {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id').notNull(),
    questionId: uuid('question_id').notNull(),
    response: jsonb('response'),            // JSON payload на отговора
    awardedScore: real('awarded_score').default(0), // точки за този отговор
    answeredAt: timestamp('answered_at')     // кога е отговорил
});
```

Типове отговори:

**Файл:** `src/lib/types/tests.ts`

```typescript
export type ChoiceAnswerResponse = { selected: string[] };
export type TextAnswerResponse = { text: string };
export type FileUploadAnswerResponse = { fileIds: string[] };
```

---

### 2.6. Резултатът пази ли се, или само се изчислява на момента?

**Резултатът се пази в базата данни.** При предаване на тест, функцията `gradeAndSubmitTestAttempt` автоматично оценява choice-въпросите и записва точките:

**Файл:** `src/lib/server/server-utils/tests.ts`, функция `gradeAndSubmitTestAttempt`

Логиката е:

1. **SingleChoice / MultipleChoice** - оценяват се **автоматично**:

```typescript
const awardedScore = gradeChoiceQuestion(
    question.type,
    question.config,
    selectedIds,
    question.points
);

// Резултатът се записва за всеки отделен отговор
await db.update(testAnswers).set({ awardedScore }).where(eq(testAnswers.id, answer.id));

totalScore += awardedScore;
```

1. **Text / FileUpload** - изискват **ръчно оценяване** от учител:

```typescript
if (question.type === QuestionTypeEnum.Text || question.type === QuestionTypeEnum.FileUpload) {
    hasManualGradingQuestions = true;
    continue; // awardedScore остава 0 до ръчно оценяване
}
```

1. **Финален статус:**

```typescript
const finalStatus = hasManualGradingQuestions
    ? AttemptStatusEnum.Submitted   // Очаква ръчно оценяване
    : AttemptStatusEnum.Graded;     // Напълно автоматично оценен

await db.update(testAttempts).set({
    status: finalStatus,
    submittedAt: now,
    gradedAt: hasManualGradingQuestions ? null : now,
    totalScore
}).where(eq(testAttempts.id, attemptId));
```

Грейдинг алгоритъм за choice въпроси:

**Файл:** `src/lib/utils/tests.ts`, функция `gradeChoiceQuestion`

```typescript
// SingleChoice: пълен брой точки ако е избран правилният отговор
// MultipleChoice: пълен брой точки САМО ако ВСИЧКИ верни отговори са избрани
//   (без излишни, без пропуснати)
```

Ръчното оценяване се извършва от учител:

**Файл:** `src/routes/control-centre-v1/tests/attempts/[attemptId]/grade/+page.svelte`

---

### 2.7. Автоматично предаване на изтекли тестове (Cron Job)

Системата има cron job, който на всяка минута проверява за неприключени опити, чийто времеви лимит е изтекъл:

**Файл:** `src/lib/server/cron/submitExpiredTests.ts`

Два вида проверки:

1. **По времеви лимит на теста** - ако `startedAt + timeLimitSec < NOW()`
2. **По дата за затваряне** - ако `NOW() > tests.closesAt`

```typescript
// Всеки опит, чийто времеви лимит е изтекъл:
sql`${testAttempts.startedAt} + INTERVAL '1 second' * ${tests.timeLimitSec} < NOW()`

// + всеки опит, чийто тест се е затворил:
sql`NOW() > ${tests.closesAt} AND ${tests.closesAt} IS NOT NULL`
```

За всеки такъв опит се извиква `gradeAndSubmitTestAttempt`, за да се оцени и предаде автоматично.

---

### 2.8. Мобилно качване на файлове за FileUpload въпроси

За FileUpload въпроси има механизъм за мобилно качване чрез QR код:

**Файл:** `src/lib/server/db/schema/uploadTokens.ts`

```typescript
export const uploadTokens = pgTable('upload_tokens', {
    id: text('id').primaryKey(),            // Кратък токен (8 символа)
    attemptId: uuid('attempt_id').notNull(),
    questionId: uuid('question_id').notNull(),
    userId: text('user_id').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});
```

Компонент за мобилно качване:

**Файл:** `src/routes/(platform)/tests/[test_id]/take/_components/MobileUploadModal.svelte`

---

### 2.9. Достъп до тест

Достъпността на тест се определя от:

**Файл:** `src/lib/utils/tests.ts`, функция `getTestAvailability`

```typescript
export type TestAvailabilityStatus = 'available' | 'not_yet_open' | 'closed' | 'always_available';
```

- Ако няма `opensAt` и `closesAt` -> `always_available`
- Ако `opensAt` е в бъдещето -> `not_yet_open`
- Ако `closesAt` е изминал -> `closed`
- В противен случай -> `available`

---

## 3. Поток при покупка / достъп

### 3.1. Какво се купува?

В платформата могат да се купуват **две неща**:

1. **Платени тестове** (`isPaid: true` в таблица `tests`)
2. **Платени събития** (таблица `paid_events`)

Уроците (`lessons`) имат `isPaid` поле, но достъпът до тях се управлява чрез `studentLessons` junction таблица - **не се купуват директно**, а се записват автоматично когато ученикът достъпи урок.

**Урокът няма собствен процес на покупка** - платените уроци се отключват чрез друг механизъм (записване).

---

### 3.2. Модел за платени тестове

**Файл:** `src/lib/server/db/schema/paidTestEntries.ts`

```typescript
export const paidTestEntries = pgTable('paid_test_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),                          // кой купува
    testId: uuid('test_id').notNull(),                          // какво се купува
    paidAt: timestamp('paid_at'),                               // кога е платено (null = неплатено)
    externalCheckoutSessionId: text('external_checkout_session_id'), // ID от Paypercut
    externalCustomerId: text('external_customer_id'),           // Customer ID от Paypercut
    transactionId: text('transaction_id'),                      // връзка с вътрешен запис на транзакция
    paymentMethod: paymentMethodEnum('payment_method')          // метод на плащане
});
```

Важно: `paidAt` е NULL докато плащането не е потвърдено. Уникален индекс гарантира, че **само един платен запис** съществува за комбинацията потребител-тест (когато `paidAt IS NOT NULL`).

---

### 3.3. Модел за платени събития

**Файл:** `src/lib/server/db/schema/paidEventEntries.ts`

```typescript
export const paidEventEntries = pgTable('paid_event_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    atendeeEmail: text('atendee_email').notNull(),
    phone: text('phone').notNull(),
    paidAt: timestamp('paid_at'),
    externalCheckoutSessionId: text('external_checkout_session_id'),
    externalCustomerId: text('external_customer_id'),
    transactionId: text('transaction_id'),
    paymentMethod: paymentMethodEnum('payment_method')
});
```

---

### 3.4. Модел за безплатни събития

**Файл:** `src/lib/server/db/schema/publicEventEntries.ts`

```typescript
export const publicEventEntries = pgTable('public_event_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull(),
    atendeeEmail: text('atendee_email').notNull(),
    atendeeName: text('atendee_name').notNull()
});
```

---

### 3.5. Процес на покупка (пример: платен тест)

Целият flow при покупка на тест:

**Файл:** `src/routes/(platform)/tests/purchase/[test_id]/+page.server.ts`

**Стъпка 1:** Проверка на достъп

```typescript
// Ако тестът е безплатен - пренасочване директно към start
if (!foundTest.isPaid) {
    redirect(302, `/tests/${foundTest.id}/start`);
}

// Ако вече е закупен - пренасочване директно към start
const isUserAllowedToTakeTest = await checkIfUserHasAccessToTest({
    userId: locals.user.id,
    testId: foundTest.id
});
if (isUserAllowedToTakeTest) {
    redirect(302, `/tests/${foundTest.id}/start`);
}
```

**Стъпка 2:** Създаване на entry и checkout сесия

```typescript
// Изтриване на евентуално неплатено предишно entry
await db.delete(paidTestEntries).where(
    and(
        eq(paidTestEntries.testId, foundTest.id),
        eq(paidTestEntries.userId, user.id),
        isNull(paidTestEntries.paidAt)
    )
);

// Създаване на ново entry
const { entry } = await createPaidTestEntry({
    userId: user.id,
    testId: foundTest.id
});

// Създаване на Paypercut checkout сесия
const checkoutData = await createCheckoutSession({
    body: {
        metadata: {
            pays_for: 'paid_test_entry',
            entry_id: entry.id
        },
        currency: 'EUR',
        mode: 'payment',
        success_url: `${event.url.origin}/tests/purchase/${foundTest.id}/success/${entry.id}`,
        cancel_url: `${event.url.origin}/tests/purchase/${foundTest.id}`,
        line_items: [{
            quantity: 1,
            price_data: {
                currency: 'EUR',
                product_data: { name: foundTest.title },
                type: 'one_time',
                unit_amount: foundTest.priceInCents
            }
        }],
        amount: foundTest.priceInCents
    },
    options: {
        idempotencyKey: `test:${foundTest.id}:entry:${entry.id}`
    }
});
```

**Стъпка 3:** Запис на externalCheckoutSessionId

```typescript
await db.update(paidTestEntries).set({
    externalCheckoutSessionId: checkoutData.id,
    externalCustomerId: checkoutData.customer
}).where(eq(paidTestEntries.id, entry.id));
```

**Стъпка 4:** Пренасочване към Paypercut checkout страница

---

### 3.6. Webhook от Paypercut

**Файл:** `src/routes/api/webhooks/paypercut/+server.ts`

Когато плащането е успешно, Paypercut изпраща webhook:

```typescript
export const POST: RequestHandler = async (event) => {
    const body = await event.request.json();
    const eventType: string = body.type;

    if (eventType === 'checkout_session.completed' && body.data.object.payment_status === 'paid') {
        await handleCheckoutComplete({ sessionId: body.id });
    }
};
```

Функцията `handleCheckoutComplete` обработва webhook-а:

**Файл:** `src/lib/server/server-utils/checkout.ts`, функция `handleCheckoutComplete`

1. Изтегля детайли за checkout сесията от Paypercut API
2. Изтегля детайли за плащането (последно плащане)
3. Извлича `metadata` от checkout сесията, за да определи **какво е платено**
4. В зависимост от `metadata.pays_for`:
   - `'paid_event_entry'` -> обновява `paidEventEntries` записа с `paidAt` и създава транзакция
   - `'paid_test_entry'` -> обновява `paidTestEntries` записа с `paidAt` и създава транзакция

```typescript
const metadata: CheckoutMetadata = checkoutData.metadata;

if (metadata.pays_for === 'paid_event_entry') {
    await handlePaidEventEntrySuccessfulPayment({ entryId, amountInCents, ... });
}

if (metadata.pays_for === 'paid_test_entry') {
    await handlePaidTestEntrySuccessfulPayment({ entryId, amountInCents, ... });
}
```

Типът на metadata:

```typescript
type CheckoutMetadata =
    | { pays_for: 'paid_event_entry' | 'paid_test_entry'; entry_id?: string; }
    | { pays_for: 'payment_link'; payment_id?: string; };
```

---

### 3.7. Транзакции

Всяко успешно плащане създава запис в таблица `transactions`:

**Файл:** `src/lib/server/db/schema/transactions.ts`

```typescript
export const transactions = pgTable('transactions', {
    id: text('id').primaryKey(),           // генериран ID: "tr_<random>.<timestamp_base36>"
    orderId: serial('order_id').unique(),   // автоматичен пореден номер
    externalId: text('external_id').unique(), // ID от Paypercut (за дедупликация)
    amountInCents: integer('amount_in_cents').notNull(),
    reason: text('reason').notNull(),       // описание
    last4: varchar('last4', { length: 4 }), // последни 4 символа на картата
    cardType: varchar('card_type'),         // тип карта
    paymentMethod: paymentMethodEnum('payment_method'),
    email: varchar('email').notNull(),
    phone: varchar('phone'),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull()
});
```

Създаването на транзакция е **идемпотентно** - ако `externalId` вече съществува, се връща съществуващият запис:

**Файл:** `src/lib/server/server-utils/transactions.ts`, функция `createTransactionRecord`

```typescript
if (externalId) {
    const existingTransaction = await dbInstance.query.transactions.findFirst({
        where: eq(transactions.externalId, externalId)
    });
    if (existingTransaction) {
        return existingTransaction; // дедупликация при повторен webhook
    }
}
```

---

### 3.8. Как системата дава достъп след успешно плащане

Достъпът се определя чрез **наличието на платен entry запис** (с `paidAt IS NOT NULL`).

Функцията `checkIfUserHasAccessToTest`:

**Файл:** `src/lib/server/server-utils/tests.ts`, редове 18–40

```typescript
export async function checkIfUserHasAccessToTest(params): Promise<boolean> {
    const { userId, testId } = params;

    const foundTest = await db.query.tests.findFirst({
        where: (table, { eq }) => eq(table.id, testId),
        columns: { id: true, isPaid: true }
    });

    if (!foundTest) return false;

    // Безплатен тест - всички имат достъп
    if (!foundTest.isPaid) return true;

    // Търси платен entry за този потребител
    const foundPaidEntry = await db.query.paidTestEntries.findFirst({
        where: (table, { and, eq, isNotNull }) =>
            and(
                eq(table.userId, userId),
                eq(table.testId, testId),
                isNotNull(table.paidAt)  // Ключово условие!
            )
    });

    if (foundPaidEntry) return true;

    return false;
}
```

---

### 3.9. Имейл след успешно плащане

След успешно плащане системата изпраща имейл потвърждение чрез cron queue (BullMQ + Redis):

**Файл:** `src/lib/server/server-utils/tests.ts`, функция `updatePaidTestEntryAsPaid`

```typescript
const options = {
    from: `BRAAND <${PRIVATE_SMTP_SENDER}>`,
    to: foundUser.email,
    subject: 'Записване за тест',
    html: body  // HTML имейл с информация за теста
};

await addEmailJob(options);
```

---

### 3.10. Модел за уроци и достъп на ученици

**Файл:** `src/lib/server/db/schema/studentLessons.ts`

Записването на ученик за урок е чрез junction таблица:

```typescript
export const studentLessons = pgTable('student_lessons', {
    userId: text('user_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    progress: real('progress').default(0),         // процент завършеност (0-100)
    videoProgress: real('video_progress').default(0) // прогрес на видеото в секунди
}, (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] })
]);
```

---

## 4. Поток при права и достъп

### 4.1. Роли в системата

**Файл:** `src/lib/types/enums.ts`, `RolesEnum`

```typescript
export enum RolesEnum {
    admin = 'admin',       // Администратор - пълен контрол
    teacher = 'teacher',   // Учител - управление на съдържание
    student = 'student',   // Ученик - консумира съдържание
    parent = 'parent'      // Родител
}
```

Ролята се съхранява директно в таблицата `users`:

**Файл:** `src/lib/server/db/schema/auth.ts`

```typescript
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    googleId: text('google_id').unique(),
    firstName: varchar('first_name', { length: 180 }).notNull(),
    lastName: varchar('last_name', { length: 180 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role'),  // admin | teacher | student | parent
    refreshToken: text('refresh_token'),
    createdAt, updatedAt, deletedAt
});
```

---

### 4.2. Разделение по маршрути (Route Guards)

**Файл:** `src/hooks.server.ts`

Маршрутите се защитават чрез hooks:

```typescript
// Контролният център е достъпен само за admin и teacher
if (event.url.pathname.startsWith('/control-centre')) {
    requiredRole = [RolesEnum.admin, RolesEnum.teacher];
}

// Акаунт страниците - само за student и parent
if (event.url.pathname.startsWith('/account')) {
    requiredRole = [RolesEnum.student, RolesEnum.parent];
}

// Auth guard:
if (!checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher])
    && event.url.pathname.startsWith('/control-centre')) {
    return redirect(302, '/');
}

if (!checkIfUser(locals) && event.url.pathname.startsWith('/account')) {
    return redirect(302, '/login');
}
```

---

### 4.3. Гранулирани права (Permission система)

Правата на администраторите/учителите са **на ниво action** и се записват в таблица `user_permissions`:

**Файл:** `src/lib/server/db/schema/userPermissions.ts`

```typescript
export const userPermissions = pgTable('user_permissions', {
    id: serial('id').primaryKey(),
    permissions: json('permissions').$type<PermissionsObject>().notNull().default(
        // По подразбиране всички права са false
        Object.values(UserPermissionsEnum).reduce((acc, key) => {
            acc[key] = false;
            return acc;
        }, {} as PermissionsObject)
    ),
    userId: text('user_id').notNull()
});
```

Типът на permissions:

**Файл:** `src/lib/types/permissions.ts`

```typescript
export type PermissionsObject = {
    [permission in UserPermissionsEnum]: boolean;
};
```

---

### 4.4. Пълен списък с гранулирани права

**Файл:** `src/lib/types/enums.ts`, `UserPermissionsEnum`

```typescript
export enum UserPermissionsEnum {
    // ВИДЕА
    ViewVideos = 'ViewVideos',
    UploadVideos = 'UploadVideos',
    EditVideos = 'EditVideos',
    DeleteVideos = 'DeleteVideos',

    // ФАЙЛОВЕ
    UploadFiles = 'UploadFiles',
    DeleteFiles = 'DeleteFiles',

    // ПРЕДМЕТИ
    ViewSubjects = 'ViewSubjects',
    CreateSubjects = 'CreateSubjects',
    EditSubjects = 'EditSubjects',
    DeleteSubjects = 'DeleteSubjects',

    // КЛАСОВЕ
    ViewClassGrades = 'ViewClassGrades',
    CreateClassGrades = 'CreateClassGrades',
    EditClassGrades = 'EditClassGrades',
    DeleteClassGrades = 'DeleteClassGrades',

    // ГРУПИ УРОЦИ
    ViewLessonGroups = 'ViewLessonGroups',
    CreateLessonGroups = 'CreateLessonGroups',
    EditLessonGroups = 'EditLessonGroups',
    DeleteLessonGroups = 'DeleteLessonGroups',

    // ТЕСТОВЕ
    ViewTests = 'ViewTests',
    CreateTests = 'CreateTests',
    EditTests = 'EditTests',
    DeleteTests = 'DeleteTests',

    // УРОЦИ
    ViewLessons = 'ViewLessons',
    CreateLessons = 'CreateLessons',
    EditLessons = 'EditLessons',
    DeleteLessons = 'DeleteLessons',

    // СЪБИТИЯ
    ViewEvents = 'ViewEvents',
    CreateEvents = 'CreateEvents',
    EditEvents = 'EditEvents',
    DeleteEvents = 'DeleteEvents',

    // КОМЕНТАРИ
    ViewComments = 'ViewComments',
    ModerateComments = 'ModerateComments',

    // ПЛАЩАНИЯ
    ViewTransactions = 'ViewTransactions',
    ViewRefunds = 'ViewRefunds',
    CreateRefunds = 'CreateRefunds',

    // ПОТРЕБИТЕЛИ И АДМИНИСТРАТОРИ
    ViewUsers = 'ViewUsers',
    CreateUsers = 'CreateUsers',
    EditUsers = 'EditUsers',
    DeleteUsers = 'DeleteUsers',
    ViewAdmins = 'ViewAdmins',
    CreateAdmins = 'CreateAdmins',
    EditAdmins = 'EditAdmins',
    DeleteAdmins = 'DeleteAdmins'
}
```

---

### 4.5. Проверка на права

Клиентска проверка:

**Файл:** `src/lib/utils/access-control.ts`

```typescript
export function checkIfUserHasPermission(
    userPermissions: PermissionsObject | undefined | null,
    targetPermission: UserPermissionsEnum | UserPermissionsEnum[]
): boolean {
    if (!userPermissions || !Object.keys(userPermissions).length) {
        return false;
    }

    if (Array.isArray(targetPermission)) {
        // ВСИЧКИ права от масива трябва да са true
        return targetPermission.every((permission) => userPermissions[permission] === true);
    }

    return userPermissions[targetPermission] === true;
}
```

---

### 4.6. Зареждане на права в hooks

При всяко заявление за admin/teacher, правата се зареждат и се записват в `event.locals`:

**Файл:** `src/hooks.server.ts`, редове 82–100

```typescript
if (user?.role === RolesEnum.admin || user?.role === RolesEnum.teacher) {
    const existingPermissions = await db.query.userPermissions.findFirst({
        where: eq(userPermissions.userId, user.id)
    });

    if (existingPermissions) {
        // Синхронизира с новите права, ако бъдат добавени нови
        const updatedPermissions = await ensureUpToDatePermissions(existingPermissions);
        event.locals.userPermissions = updatedPermissions.permissions;
    } else {
        // Ако няма - създава нови (всички false)
        const createdPermissions = await createPermissionsForUser(user.id);
        event.locals.userPermissions = createdPermissions.permissions;
    }
}
```

---

### 4.7. Автоматична миграция на нови права

Когато се добавят нови permission-и в `UserPermissionsEnum`, функцията `ensureUpToDatePermissions` автоматично допълва липсващите с `false`:

**Файл:** `src/lib/server/server-utils/access-control.ts`, функция `ensureUpToDatePermissions`

```typescript
export async function ensureUpToDatePermissions(permissions: UserPermission) {
    const newPermissionsObject = Object.values(UserPermissionsEnum).reduce((acc, key) => {
        acc[key] = permissions.permissions[key] ?? false; // ново право -> false
        return acc;
    }, {} as PermissionsObject);

    if (JSON.stringify(newPermissionsObject) === JSON.stringify(permissions.permissions)) {
        return permissions; // няма промяна
    }

    // Обновяване в базата
    const [updatedPermissions] = await db
        .update(userPermissions)
        .set({ permissions: { ...newPermissionsObject } })
        .where(eq(userPermissions.userId, permissions.userId))
        .returning();

    return updatedPermissions;
}
```

---

### 4.8. Администратор по подразбиране

При стартиране на сървъра автоматично се създава default admin, ако е конфигуриран:

**Файл:** `src/lib/server/server-utils/default-admin.ts`

```typescript
export async function createDefaultAdminUser() {
    // Контролира се от env: PRIVATE_CREATE_DEFAULT_ADMIN, PRIVATE_DEFAULT_ADMIN_EMAIL, PRIVATE_DEFAULT_ADMIN_PASSWORD
    
    // 1. Ако admin-ът вече съществува - само обновява правата му (всички на true)
    // 2. Ако не съществува - създава нов потребител с role: admin
    // 3. Задава ВСИЧКИ права на true
}
```

```typescript
const allPermissions = Object.values(UserPermissionsEnum).reduce((acc, perm) => {
    acc[perm] = true;
    return acc;
}, {} as Record<UserPermissionsEnum, boolean>);
```

Извиква се при стартиране от `hooks.server.ts`:

**Файл:** `src/hooks.server.ts`, ред 23

```typescript
createDefaultAdminUser();
```

---

### 4.9. Достъп на обучаеми до съдържание

Ученикът (student) достъпва съдържание по следната логика:

| Тип съдържание | Безплатно | Платено |
|---|---|---|
| **Урок** | Достъпен директно | `isPaid: true` - Достъпен чрез `studentLessons` |
| **Тест** | Достъпен директно (всеки) | Изисква `paidTestEntries` с `paidAt IS NOT NULL` |
| **Събитие (платено)** | - | Изисква `paidEventEntries` с `paidAt IS NOT NULL` |
| **Събитие (публично)** | Изисква регистрация (`publicEventEntries`) | - |

Проверка за достъп до тест:

**Файл:** `src/lib/server/server-utils/tests.ts`, функция `checkIfUserHasAccessToTest`

```typescript
if (!foundTest.isPaid) return true;  // Безплатен -> всички имат достъп

const foundPaidEntry = await db.query.paidTestEntries.findFirst({
    where: (table, { and, eq, isNotNull }) =>
        and(eq(table.userId, userId), eq(table.testId, testId), isNotNull(table.paidAt))
});
return !!foundPaidEntry;
```

---

## Допълнителни модели

### Предмети и класове

**Файл:** `src/lib/server/db/schema/subjects.ts`

```typescript
export const subjects = pgTable('subjects', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    colorFrom: text('color_from'),
    colorTo: text('color_to')
});

export const classGrades = pgTable('class_grades', {
    id: serial('id').primaryKey(),
    gradeNumber: integer('grade_number').notNull().unique(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique()
});
```

### Групи уроци (Lesson Groups / Chapters)

**Файл:** `src/lib/server/db/schema/lessonGroups.ts`

```typescript
export const lessonGroups = pgTable('lesson_groups', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    order: integer('order').default(1),
    classGradeId: integer('class_grade_id').notNull(),
    subjectId: integer('subject_id').notNull()
});
```

### Timestamps (общ helper)

**Файл:** `src/lib/server/db/column-helpers.ts`

```typescript
export const timestamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at')  // soft delete
};
```

### Статуси на публикуване

**Файл:** `src/lib/types/enums.ts`, `PublishedStatusEnum`

```typescript
export enum PublishedStatusEnum {
    published = 'published', // Публикуван - видим за всички
    hidden = 'hidden',       // Скрит - съществува, но не се показва
    draft = 'draft'          // Чернова - в процес на изготвяне
}
```

Използва се от: `tests.publishedStatus`, `lessons.publishedStatus`

---

## Обобщение на технологичния стек

| Компонент | Технология |
|---|---|
| Frontend framework | SvelteKit |
| Database | PostgreSQL (чрез Drizzle ORM) |
| Object Storage | S3-compatible (MinIO / Cloudflare R2) |
| Payment Provider | Paypercut |
| Email Queue | BullMQ + Redis |
| Video Processing | FFmpeg (локално) |
| Video Streaming | HLS с presigned S3 URLs |
| Authentication | Custom session-based (SHA-256 + cookie) |
| Password Hashing | Argon2 |

## Функционално демо на проекта в production среда може да бъде намерено на:

<https://bc-grad.webdevlimited.eu>

Администратицен потребител: <admin@tu-example.eu>

Парола: 12345678d
