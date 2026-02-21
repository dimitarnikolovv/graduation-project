// When changed change the enum and type in src/lib/server/db/schema/auth.ts
export enum RolesEnum {
	admin = 'admin',
	teacher = 'teacher',
	student = 'student',
	parent = 'parent'
}

export function displayRole(role: RolesEnum) {
	switch (role) {
		case RolesEnum.admin:
			return 'Администратор';
		case RolesEnum.teacher:
			return 'Учител';
		case RolesEnum.student:
			return 'Ученик';
		case RolesEnum.parent:
			return 'Родител';
	}
}

// when changed change the enum and type in src/lib/server/db/schema/logs.ts
export enum ActionsEnum {
	create = 'create',
	update = 'update',
	delete = 'delete',
	massDelete = 'massDelete',
	emailSent = 'emailSent',
	softDelete = 'softDelete'
}

export enum TimePeriod {
	Last24Hours = 'Last24Hours',
	Today = 'Today',
	Yesterday = 'Yesterday',
	Last7Days = 'Last7Days',
	ThisWeek = 'ThisWeek',
	LastWeek = 'LastWeek',
	ThisMonth = 'ThisMonth',
	LastMonth = 'LastMonth',
	Last3Months = 'Last3Months',
	Last6Months = 'Last6Months',
	Last9Months = 'Last9Months',
	ThisYear = 'ThisYear',
	LastYear = 'LastYear'
}

export function displayTimePeriod(timePeriod: TimePeriod | string) {
	switch (timePeriod) {
		case TimePeriod.Last24Hours:
			return 'Последните 24 часа';
		case TimePeriod.Today:
			return 'Днес';
		case TimePeriod.Yesterday:
			return 'Вчера';
		case TimePeriod.Last7Days:
			return 'Последните 7 дни';
		case TimePeriod.ThisWeek:
			return 'Тази седмица';
		case TimePeriod.LastWeek:
			return 'Миналата седмица';
		case TimePeriod.ThisMonth:
			return 'Този месец';
		case TimePeriod.LastMonth:
			return 'Миналият месец';
		case TimePeriod.Last3Months:
			return 'Последните 3 месеца';
		case TimePeriod.Last6Months:
			return 'Последните 6 месеца';
		case TimePeriod.Last9Months:
			return 'Последните 9 месеца';
		case TimePeriod.ThisYear:
			return 'Тази година';
		case TimePeriod.LastYear:
			return 'Миналата година';
		default:
			return timePeriod;
	}
}

export enum Months {
	January = 'January',
	February = 'February',
	March = 'March',
	April = 'April',
	May = 'May',
	June = 'June',
	July = 'July',
	August = 'August',
	September = 'September',
	October = 'October',
	November = 'November',
	December = 'December'
}

export function displayMonth(month: Months) {
	switch (month) {
		case Months.January:
			return 'Януари';
		case Months.February:
			return 'Февруари';
		case Months.March:
			return 'Март';
		case Months.April:
			return 'Април';
		case Months.May:
			return 'Май';
		case Months.June:
			return 'Юни';
		case Months.July:
			return 'Юли';
		case Months.August:
			return 'Август';
		case Months.September:
			return 'Септември';
		case Months.October:
			return 'Октомври';
		case Months.November:
			return 'Ноември';
		case Months.December:
			return 'Декември';
	}
}

export enum DaysOfWeek {
	Monday = 'Monday',
	Tuesday = 'Tuesday',
	Wednesday = 'Wednesday',
	Thursday = 'Thursday',
	Friday = 'Friday',
	Saturday = 'Saturday',
	Sunday = 'Sunday'
}

export function displayDayOfWeek(day: DaysOfWeek) {
	switch (day) {
		case DaysOfWeek.Monday:
			return 'Понеделник';
		case DaysOfWeek.Tuesday:
			return 'Вторник';
		case DaysOfWeek.Wednesday:
			return 'Сряда';
		case DaysOfWeek.Thursday:
			return 'Четвъртък';
		case DaysOfWeek.Friday:
			return 'Петък';
		case DaysOfWeek.Saturday:
			return 'Събота';
		case DaysOfWeek.Sunday:
			return 'Неделя';
	}
}

export enum DurationUnitEnum {
	hours = 'hours',
	days = 'days',
	months = 'months'
}

export function displayDuration(unit: DurationUnitEnum) {
	switch (unit) {
		case DurationUnitEnum.hours:
			return 'часа';
		case DurationUnitEnum.days:
			return 'дни';
		case DurationUnitEnum.months:
			return 'месеца';
	}
}

export enum PromoCodeTypeEnum {
	percentage = 'percentage',
	amount = 'amount'
}

export function displayPromoCodeType(type: PromoCodeTypeEnum) {
	switch (type) {
		case PromoCodeTypeEnum.percentage:
			return 'Процент';
		case PromoCodeTypeEnum.amount:
			return 'Стойност';
	}
}

export enum QuestionTypeEnum {
	SingleChoice = 'SingleChoice',
	MultipleChoice = 'MultipleChoice',
	Text = 'Text',
	FileUpload = 'FileUpload'
}

export function displayQuestionType(type: QuestionTypeEnum) {
	switch (type) {
		case QuestionTypeEnum.SingleChoice:
			return 'Един верен';
		case QuestionTypeEnum.MultipleChoice:
			return 'Няколко верни';
		case QuestionTypeEnum.Text:
			return 'Свободен текст';
		case QuestionTypeEnum.FileUpload:
			return 'Прикачен файл';
	}
}

export enum AttemptStatusEnum {
	Started = 'Started',
	Submitted = 'Submitted',
	Graded = 'Graded'
}

export function displayAttemptStatus(status: AttemptStatusEnum) {
	switch (status) {
		case AttemptStatusEnum.Started:
			return 'Започнат';
		case AttemptStatusEnum.Submitted:
			return 'Предаден';
		case AttemptStatusEnum.Graded:
			return 'Оценен';
	}
}

export enum VideoStatusEnum {
	pending = 'pending',
	uploaded = 'uploaded',
	processing = 'processing',
	failed = 'failed'
}

export function displayVideoStatus(status: VideoStatusEnum) {
	switch (status) {
		case VideoStatusEnum.pending:
			return 'Изчаква се';
		case VideoStatusEnum.uploaded:
			return 'Качено';
		case VideoStatusEnum.processing:
			return 'Обработва се';
		case VideoStatusEnum.failed:
			return 'Неуспешно';
	}
}

export enum PublishedStatusEnum {
	published = 'published',
	hidden = 'hidden',
	draft = 'draft'
}

export function displayPublishedStatus(status: PublishedStatusEnum) {
	switch (status) {
		case PublishedStatusEnum.published:
			return 'Публикуван';
		case PublishedStatusEnum.hidden:
			return 'Скрит';
		case PublishedStatusEnum.draft:
			return 'Чернова';
	}
}

export enum UserPermissionsEnum {
	ViewVideos = 'ViewVideos',
	UploadVideos = 'UploadVideos',
	EditVideos = 'EditVideos',
	DeleteVideos = 'DeleteVideos',

	UploadFiles = 'UploadFiles',
	DeleteFiles = 'DeleteFiles',

	ViewSubjects = 'ViewSubjects',
	CreateSubjects = 'CreateSubjects',
	EditSubjects = 'EditSubjects',
	DeleteSubjects = 'DeleteSubjects',

	ViewClassGrades = 'ViewClassGrades',
	CreateClassGrades = 'CreateClassGrades',
	EditClassGrades = 'EditClassGrades',
	DeleteClassGrades = 'DeleteClassGrades',

	ViewLessonGroups = 'ViewLessonGroups',
	CreateLessonGroups = 'CreateLessonGroups',
	EditLessonGroups = 'EditLessonGroups',
	DeleteLessonGroups = 'DeleteLessonGroups',

	ViewTests = 'ViewTests',
	CreateTests = 'CreateTests',
	EditTests = 'EditTests',
	DeleteTests = 'DeleteTests',

	ViewLessons = 'ViewLessons',
	CreateLessons = 'CreateLessons',
	EditLessons = 'EditLessons',
	DeleteLessons = 'DeleteLessons',

	ViewEvents = 'ViewEvents',
	CreateEvents = 'CreateEvents',
	EditEvents = 'EditEvents',
	DeleteEvents = 'DeleteEvents',

	ViewComments = 'ViewComments',
	ModerateComments = 'ModerateComments',

	// PAYMENTS
	ViewTransactions = 'ViewTransactions',

	ViewRefunds = 'ViewRefunds',
	CreateRefunds = 'CreateRefunds',

	// USERS AND ADMINS

	ViewUsers = 'ViewUsers',
	CreateUsers = 'CreateUsers',
	EditUsers = 'EditUsers',
	DeleteUsers = 'DeleteUsers',

	ViewAdmins = 'ViewAdmins',
	CreateAdmins = 'CreateAdmins',
	EditAdmins = 'EditAdmins',
	DeleteAdmins = 'DeleteAdmins'
}

export function getUserPermissionToDisplay(permission: UserPermissionsEnum) {
	switch (permission) {
		case UserPermissionsEnum.ViewVideos:
			return 'Преглед на видеа';
		case UserPermissionsEnum.UploadVideos:
			return 'Качване на видеа';
		case UserPermissionsEnum.EditVideos:
			return 'Редактиране на видеа';
		case UserPermissionsEnum.DeleteVideos:
			return 'Изтриване на видеа';

		case UserPermissionsEnum.UploadFiles:
			return 'Качване на файлове';
		case UserPermissionsEnum.DeleteFiles:
			return 'Изтриване на файлове';

		case UserPermissionsEnum.ViewSubjects:
			return 'Преглед на предмети';
		case UserPermissionsEnum.CreateSubjects:
			return 'Създаване на предмети';
		case UserPermissionsEnum.EditSubjects:
			return 'Редактиране на предмети';
		case UserPermissionsEnum.DeleteSubjects:
			return 'Изтриване на предмети';

		case UserPermissionsEnum.ViewClassGrades:
			return 'Преглед на класове';
		case UserPermissionsEnum.CreateClassGrades:
			return 'Създаване на класове';
		case UserPermissionsEnum.EditClassGrades:
			return 'Редактиране на класове';
		case UserPermissionsEnum.DeleteClassGrades:
			return 'Изтриване на класове';

		case UserPermissionsEnum.ViewLessonGroups:
			return 'Преглед на раздели с уроци';
		case UserPermissionsEnum.CreateLessonGroups:
			return 'Създаване на раздели с уроци';
		case UserPermissionsEnum.EditLessonGroups:
			return 'Редактиране на раздели с уроци';
		case UserPermissionsEnum.DeleteLessonGroups:
			return 'Изтриване на раздели с уроци';

		case UserPermissionsEnum.ViewTests:
			return 'Преглед на тестове';
		case UserPermissionsEnum.CreateTests:
			return 'Създаване на тестове';
		case UserPermissionsEnum.EditTests:
			return 'Редактиране на тестове';
		case UserPermissionsEnum.DeleteTests:
			return 'Изтриване на тестове';

		case UserPermissionsEnum.ViewLessons:
			return 'Преглед на уроци';
		case UserPermissionsEnum.CreateLessons:
			return 'Създаване на уроци';
		case UserPermissionsEnum.EditLessons:
			return 'Редактиране на уроци';
		case UserPermissionsEnum.DeleteLessons:
			return 'Изтриване на уроци';

		case UserPermissionsEnum.ViewUsers:
			return 'Преглед на потребители';
		case UserPermissionsEnum.CreateUsers:
			return 'Създаване на потребители';
		case UserPermissionsEnum.EditUsers:
			return 'Редактиране на потребители';
		case UserPermissionsEnum.DeleteUsers:
			return 'Изтриване на потребители';

		case UserPermissionsEnum.ViewEvents:
			return 'Преглед на събития';
		case UserPermissionsEnum.CreateEvents:
			return 'Създаване на събития';
		case UserPermissionsEnum.EditEvents:
			return 'Редактиране на събития';
		case UserPermissionsEnum.DeleteEvents:
			return 'Изтриване на събития';

		case UserPermissionsEnum.ViewComments:
			return 'Преглед на коментари';
		case UserPermissionsEnum.ModerateComments:
			return 'Модериране на коментари';

		case UserPermissionsEnum.ViewTransactions:
			return 'Преглед на транзакции';

		case UserPermissionsEnum.ViewRefunds:
			return 'Преглед на възстановени плащания';
		case UserPermissionsEnum.CreateRefunds:
			return 'Възстановяване на плащания';

		case UserPermissionsEnum.ViewAdmins:
			return 'Преглед на администратори';
		case UserPermissionsEnum.CreateAdmins:
			return 'Създаване на администратори';
		case UserPermissionsEnum.EditAdmins:
			return 'Редактиране на администратори';
		case UserPermissionsEnum.DeleteAdmins:
			return 'Изтриване на администратори';
	}
}

export enum EventAttributeDataType {
	link = 'link',
	text = 'text',
	number = 'number',
	boolean = 'boolean',
	date = 'date'
}

export function displayEventAttributeDataType(dataType: EventAttributeDataType) {
	switch (dataType) {
		case EventAttributeDataType.link:
			return 'Линк';
		case EventAttributeDataType.text:
			return 'Текст';
		case EventAttributeDataType.number:
			return 'Число';
		case EventAttributeDataType.boolean:
			return 'Булев';
		case EventAttributeDataType.date:
			return 'Дата';
	}
}

export enum PaymentMethodEnum {
	card = 'card',
	bankTransfer = 'bankTransfer',
	cash = 'cash',
	free = 'free'
}

export function displayPaymentMethod(method: PaymentMethodEnum) {
	switch (method) {
		case PaymentMethodEnum.card:
			return 'Карта';
		case PaymentMethodEnum.bankTransfer:
			return 'Банков превод';
		case PaymentMethodEnum.cash:
			return 'В брой';
		case PaymentMethodEnum.free:
			return 'Безплатно';
	}
}

export enum TransactionsReportFilters {
	createdAt = 'createdAt',
	amountInCents = 'amountInCents',
	cardType = 'cardType',
	email = 'email'
}

export function displayTransactionsReportFilter(filter: TransactionsReportFilters) {
	switch (filter) {
		case TransactionsReportFilters.createdAt:
			return 'Дата на създаване';
		case TransactionsReportFilters.amountInCents:
			return 'Общо';
		case TransactionsReportFilters.cardType:
			return 'Тип карта';
		case TransactionsReportFilters.email:
			return 'Имейл';
	}
}

export enum RefundsReportFilters {
	createdAt = 'createdAt',
	amountInCents = 'amountInCents',
	cardType = 'cardType',
	transactionId = 'transactionId'
}

export function displayRefundsReportFilter(filter: RefundsReportFilters) {
	switch (filter) {
		case RefundsReportFilters.createdAt:
			return 'Дата на създаване';
		case RefundsReportFilters.amountInCents:
			return 'Сума';
		case RefundsReportFilters.cardType:
			return 'Тип карта';
		case RefundsReportFilters.transactionId:
			return 'ID на транзакция';
	}
}

export enum RefundTypeEnum {
	full = 'full',
	partial = 'partial'
}

export function displayRefundType(type: RefundTypeEnum) {
	switch (type) {
		case RefundTypeEnum.full:
			return 'Пълно';
		case RefundTypeEnum.partial:
			return 'Частично';
	}
}

export enum RefundReasonEnum {
	duplicate = 'duplicate',
	fraudulent = 'fraudulent',
	requested_by_customer = 'requested_by_customer'
}

export function displayRefundReason(reason: RefundReasonEnum) {
	switch (reason) {
		case RefundReasonEnum.duplicate:
			return 'Дублирана транзакция';
		case RefundReasonEnum.fraudulent:
			return 'Съмнение за измама';
		case RefundReasonEnum.requested_by_customer:
			return 'По искане на клиента';
	}
}
