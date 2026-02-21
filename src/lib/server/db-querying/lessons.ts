import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { lessons, type Lesson } from '../db/schema/lessons';
import type { ClassGrade } from '../db/schema/subjects';
import { camelizeKeys } from '$lib/utils/general';
import type { Video } from '../db/schema/videos';
import type { UploadedFile } from '../db/schema/files';

/** Generates a query array based on the provided search parameters.
 * This function constructs an array of conditions to be used in a **drizzle orm** query.
 *
 * @param searchParams - The URLSearchParams object containing the search parameters.
 * @returns An array of conditions for the database query or undefined if no conditions are found.
 */
function generateQueryFromParams(searchParams: URLSearchParams) {
	const startDate = searchParams.get('startDate')?.trim();
	const endDate = searchParams.get('endDate')?.trim();
	const title = searchParams.get('title')?.trim();
	const id = searchParams.get('id')?.trim();
	const isPaid = searchParams.get('isPaid')?.trim();
	const authorId = searchParams.get('authorId')?.trim();

	const subjectIds = searchParams
		.getAll('subjectIDs')
		.filter((id) => id.trim() !== '')
		.map(Number);
	const classGradeIds = searchParams
		.getAll('classIDs')
		.filter((id) => id.trim() !== '')
		.map(Number);

	const query = [];

	if (startDate) query.push(gte(lessons.createdAt, new Date(startDate)));
	if (endDate && endDate !== startDate) query.push(lte(lessons.createdAt, new Date(endDate)));
	if (startDate && endDate && startDate === endDate)
		query.push(
			lte(lessons.createdAt, new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)))
		);
	if (id) query.push(eq(lessons.id, id));
	if (title) query.push(ilike(lessons.title, `%${title}%`));
	if (authorId) query.push(eq(lessons.authorId, authorId));
	if (isPaid) query.push(eq(lessons.isPaid, isPaid === 'true'));

	if (subjectIds.length > 0) query.push(inArray(lessons.subjectId, subjectIds));
	if (classGradeIds.length > 0) query.push(inArray(lessons.classGradeId, classGradeIds));

	return query.length > 0 ? and(...query) : undefined;
}

type FetchExpandedLessonsParams = {
	page: number;
	limit: number;
	searchParams?: URLSearchParams;
	orderBy?: 'createdAt' | 'order';
	orderDirection?: 'asc' | 'desc';
};

/** Fetches a paginated list of lessons with expanded relations based on the provided parameters.
 *
 * @param params - The parameters for fetching lessons, including pagination, search filters, and sorting options.
 * @returns An object containing the results, total items count, and total pages count.
 */
export async function fetchExpandedLessons({
	page,
	limit,
	searchParams,
	orderBy = 'createdAt',
	orderDirection = 'desc'
}: FetchExpandedLessonsParams) {
	const query = generateQueryFromParams(searchParams ?? new URLSearchParams());

	const results = await db.query.lessons.findMany({
		columns: {
			content: false
		},
		with: {
			author: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					role: true
				}
			},
			lastEditedBy: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					role: true
				}
			},
			subject: true,
			classGrade: true,
			video: {
				with: {
					posterFile: true,
					chaptersFile: true
				}
			},
			test: {
				columns: {
					id: true,
					title: true,
					isPaid: true
				}
			},
			group: {
				columns: {
					id: true,
					name: true
				}
			}
		},
		orderBy: orderDirection === 'asc' ? asc(lessons[orderBy]) : desc(lessons[orderBy]),
		limit,
		offset: (page - 1) * limit,
		where: query
	});

	const totalItems = await db.$count(lessons, query);

	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchExpandedLessonsResult = Awaited<ReturnType<typeof fetchExpandedLessons>>;

/** Fetches a single lesson by its ID with expanded relations.
 *
 * @param lessonId - The ID of the lesson to fetch.
 * @returns The lesson object with expanded relations if found, otherwise undefined.
 */
export async function fetchExpandedLesson(lessonId: string) {
	const result = await db.query.lessons.findFirst({
		with: {
			author: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					role: true
				}
			},
			lastEditedBy: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					role: true
				}
			},
			subject: true,
			classGrade: true,
			video: {
				with: {
					posterFile: true,
					chaptersFile: true
				}
			},
			test: {
				columns: {
					id: true,
					title: true,
					isPaid: true
				}
			},
			group: {
				columns: {
					id: true,
					name: true
				}
			}
		},

		where: eq(lessons.id, lessonId)
	});

	return result;
}

export type FetchExpandedLessonResult = Awaited<ReturnType<typeof fetchExpandedLesson>>;

type SearchForLessonParams = {
	searchTerm: string;
	page?: number;
	limit?: number;
};

export async function searchForLesson(params: SearchForLessonParams) {
	const { searchTerm, page = 1, limit = 10 } = params;

	const query = or(
		ilike(lessons.title, `%${searchTerm}%`),
		eq(lessons.id, searchTerm),
		ilike(lessons.resume, `%${searchTerm}%`)
	);

	const results = await db.query.lessons.findMany({
		columns: {
			id: true,
			title: true
		},
		with: {
			classGrade: true,
			subject: true
		},

		where: query,
		limit: limit,
		offset: (page - 1) * limit,
		orderBy: desc(lessons.createdAt)
	});

	const totalItems = await db.$count(lessons, query);

	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type SearchForLessonResult = Awaited<ReturnType<typeof searchForLesson>>;

type VideoWithPoster = Pick<Video, 'id' | 'posterFileId'> & {
	posterFile: Pick<UploadedFile, 'id' | 'fileKey'> | null;
};

export type CompactLesson = Omit<Lesson, 'content'> & { video: VideoWithPoster };

type Row = {
	lesson: CompactLesson;
	grade: ClassGrade;
	gradeId: number;
	gradeNumber: number;
};

/**
 * Fetches the first N lessons grouped by class grade for a given subject slug.
 * Each lesson includes its associated video with optional poster file.
 *
 * @param subject_slug - The slug of the subject to filter lessons by.
 * @param n - The maximum number of lessons to fetch per class grade (default is 10).
 * @returns An array of objects, each containing a class grade and its associated lessons.
 */
export async function getFirstNLessonsGroupedByClassForSubject(subject_slug: string, n = 10) {
	const rows = await db.execute<Row>(sql`
    WITH ranked AS (
      SELECT
        -- lesson JSON: remove "content" and add nested "video" (with optional posterFile)
        (
          to_jsonb(l) - 'content'
        ) || jsonb_build_object(
          'video',
          CASE
            WHEN v.id IS NULL THEN NULL
            ELSE jsonb_build_object(
              'id', v.id,
              'posterFileId', v.poster_file_id,
              'posterFile',
                CASE
                  WHEN f.id IS NULL THEN NULL
                  ELSE jsonb_build_object('id', f.id, 'fileKey', f.file_key)
                END
            )
          END
        ) AS lesson,

        to_jsonb(cg) AS grade,
        cg.id        AS "gradeId",
        cg.grade_number AS "gradeNumber",
        l.created_at,
        ROW_NUMBER() OVER (
          PARTITION BY l.class_grade_id
		  ORDER BY l.order ASC
        ) AS rn
      FROM lessons       AS l
      JOIN subjects      AS s  ON l.subject_id = s.id
      JOIN class_grades  AS cg ON l.class_grade_id = cg.id
      LEFT JOIN videos   AS v  ON l.video_id = v.id
      LEFT JOIN files    AS f  ON v.poster_file_id = f.id
      WHERE s.slug = ${subject_slug}
    )
    SELECT lesson, grade, "gradeId", "gradeNumber"
		FROM ranked
		WHERE rn <= ${n}
    ORDER BY "gradeNumber" ASC
  `);

	// Group -> { grade, lessons[] }
	const byGrade = new Map<number, { grade: ClassGrade; lessons: CompactLesson[] }>();

	for (const r of rows) {
		const lesson = camelizeKeys<CompactLesson>(r.lesson);
		const grade = camelizeKeys<ClassGrade>(r.grade);

		const entry = byGrade.get(r.gradeId);
		if (entry) entry.lessons.push(lesson);
		else byGrade.set(r.gradeId, { grade, lessons: [lesson] });
	}

	const results = Array.from(byGrade.values()).sort(
		(a, b) => a.grade.gradeNumber - b.grade.gradeNumber
	);

	return results;
}

type countOfLessonsOptions = {
	countOnlyWithGroup?: boolean;
};

/**
 * Fetches the count of published lessons in each class grade for a given subject ID.
 * The results are ordered by the class grade ID in ascending order.
 *
 * @param subjectId - The ID of the subject to filter lessons by.
 * @returns An array of objects, each containing a class grade ID and the corresponding count of lessons.
 */
export async function countOfPublishedLessonsInGradeBySubject(
	subjectId: number,
	options?: countOfLessonsOptions
) {
	type LessonCountForGrades = {
		grade_id: number;
		count_of_lessons: number;
	}[];

	const countOnlyWithGroup = options?.countOnlyWithGroup ?? false;

	const countOfLessonsByGrades = (await db.execute(sql`
		SELECT
			cg.id AS grade_id,
			COALESCE(COUNT(l.id), 0)::int AS count_of_lessons
		FROM class_grades AS cg
		LEFT JOIN lessons AS l
			ON l.class_grade_id = cg.id
			AND l.subject_id = ${subjectId}
			AND l.published_status = 'published'
			${countOnlyWithGroup ? sql`AND l.group_id IS NOT NULL` : sql``}
		GROUP BY cg.id
		ORDER BY cg.id
  `)) as LessonCountForGrades;

	return countOfLessonsByGrades;
}

export type CountOfLessonsInGradeBySubjectResult = Awaited<
	ReturnType<typeof countOfPublishedLessonsInGradeBySubject>
>;

/**
 * Fetches the count of published lessons in each subject.
 * The results are ordered by the subject ID in ascending order.
 *
 * @returns An array of objects, each containing a subject ID and the corresponding count of lessons.
 */
export async function countOfPublishedLessonsInSubjects(options?: countOfLessonsOptions) {
	type LessonCountForSubjects = {
		subject_id: number;
		count_of_lessons: number;
	}[];

	const countOnlyWithGroup = options?.countOnlyWithGroup ?? false;

	const countOfLessonsBySubjects = (await db.execute(sql`
		SELECT
			s.id AS subject_id,
			COALESCE(COUNT(l.id), 0)::int AS count_of_lessons
		FROM subjects AS s
		LEFT JOIN lessons AS l
			ON l.subject_id = s.id
			AND l.published_status = 'published'
			${countOnlyWithGroup ? sql`AND l.group_id IS NOT NULL` : sql``}
		GROUP BY s.id
		ORDER BY s.id
  `)) as LessonCountForSubjects;

	return countOfLessonsBySubjects;
}

export type CountOfLessonsInSubjectsResult = Awaited<
	ReturnType<typeof countOfPublishedLessonsInSubjects>
>;

/**
 * Increases the view count of a lesson by 1.
 * @param lessonId - The ID of the lesson to increase the view count for.
 */
export async function increaseLessonViewCount(lessonId: string) {
	await db
		.update(lessons)
		.set({ viewCount: sql`${lessons.viewCount} + 1` })
		.where(eq(lessons.id, lessonId));
}
