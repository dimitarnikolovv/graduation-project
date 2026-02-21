import { and, asc, desc, eq, getTableColumns, SQL, sql } from 'drizzle-orm';
import { db } from '../db';
import { studentLessons, type StudentLessonInsert } from '../db/schema/studentLessons';
import { lessons } from '../db/schema/lessons';
import { classGrades, subjects } from '../db/schema/subjects';
import { videos } from '../db/schema/videos';
import { files } from '../db/schema/files';
import { lessonGroups } from '../db/schema/lessonGroups';

/**
 * Enrolls a student in a lesson or updates last accessed time if already enrolled
 */
export async function enrollStudentInLesson(userId: string, lessonId: string) {
	const existing = await db.query.studentLessons.findFirst({
		where: and(eq(studentLessons.userId, userId), eq(studentLessons.lessonId, lessonId))
	});

	if (existing) {
		// Update last accessed time
		await db
			.update(studentLessons)
			.set({ lastAccessedAt: new Date() })
			.where(and(eq(studentLessons.userId, userId), eq(studentLessons.lessonId, lessonId)));
		return existing;
	}

	// Create new enrollment
	const [newEnrollment] = await db
		.insert(studentLessons)
		.values({
			userId,
			lessonId,
			startedAt: new Date(),
			lastAccessedAt: new Date(),
			progress: 0,
			videoProgress: 0
		})
		.returning();

	return newEnrollment;
}

/**
 * Updates the progress for a student's lesson
 */
export async function updateStudentLessonProgress(
	userId: string,
	lessonId: string,
	progress: number,
	videoProgress?: number
) {
	const updateData: Partial<StudentLessonInsert> = {
		progress,
		lastAccessedAt: new Date()
	};

	if (videoProgress !== undefined) {
		updateData.videoProgress = videoProgress;
	}

	// Mark as completed if progress is 100%
	if (progress >= 100) {
		updateData.completedAt = new Date();
	}

	await db
		.update(studentLessons)
		.set(updateData)
		.where(and(eq(studentLessons.userId, userId), eq(studentLessons.lessonId, lessonId)));
}

/**
 * Gets a student's progress for a specific lesson
 */
export async function getStudentLessonProgress(userId: string, lessonId: string) {
	return await db.query.studentLessons.findFirst({
		where: and(eq(studentLessons.userId, userId), eq(studentLessons.lessonId, lessonId))
	});
}

type FetchStudentLessonsParams = {
	userId: string;
	page?: number;
	limit?: number;
	searchParams: URLSearchParams;
};

/**
 * Fetches all lessons a student is enrolled in with full lesson details
 */
export async function fetchStudentLessons({
	userId,
	page = 1,
	limit = 20,
	searchParams
}: FetchStudentLessonsParams) {
	const query = [eq(studentLessons.userId, userId)];

	const subjectId = searchParams.get('subjectId');
	const gradeId = searchParams.get('classGradeId');
	const completed = searchParams.get('completed');

	if (subjectId) {
		query.push(eq(lessons.subjectId, parseInt(subjectId)));
	}

	if (gradeId) {
		query.push(eq(lessons.classGradeId, parseInt(gradeId)));
	}

	if (completed === 'true') {
		query.push(sql`${studentLessons.completedAt} IS NOT NULL`);
	} else if (completed === 'false') {
		query.push(sql`${studentLessons.completedAt} IS NULL`);
	}

	const filterableColumns = ['startedAt', 'lastAccessedAt', 'progress'] as const;

	const orderByAscArray = searchParams
		? filterableColumns.filter((filter) => searchParams.getAll('asc').includes(filter))
		: [];

	const orderByDescArray = searchParams
		? filterableColumns.filter((filter) => searchParams.getAll('desc').includes(filter))
		: [];

	const orderBy = [...orderByAscArray, ...orderByDescArray]
		.map((column) => {
			if (orderByAscArray.includes(column)) {
				return asc(studentLessons[column]);
			} else if (orderByDescArray.includes(column)) {
				return desc(studentLessons[column]);
			}
			return undefined;
		})
		.filter(Boolean) as SQL[];

	const results = await db
		.select({
			...getTableColumns(studentLessons),
			lesson: {
				// all lesson columns EXCEPT content
				...(() => {
					const { content: _content, ...rest } = getTableColumns(lessons);
					return rest;
				})()
			},

			subject: getTableColumns(subjects),
			classGrade: getTableColumns(classGrades),
			video: getTableColumns(videos),
			posterFile: getTableColumns(files),
			lessonGroup: getTableColumns(lessonGroups)
		})
		.from(studentLessons)
		.innerJoin(lessons, eq(studentLessons.lessonId, lessons.id))
		.innerJoin(subjects, eq(lessons.subjectId, subjects.id))
		.innerJoin(classGrades, eq(lessons.classGradeId, classGrades.id))
		.leftJoin(videos, eq(lessons.videoId, videos.id))
		.leftJoin(files, eq(videos.posterFileId, files.id))
		.leftJoin(lessonGroups, eq(lessons.groupId, lessonGroups.id))
		.limit(limit)
		.offset((page - 1) * limit)
		.orderBy(...(orderBy && orderBy.length ? orderBy : [desc(studentLessons.lastAccessedAt)]))
		.where(and(...query));

	const totalItems = await db
		.select({ count: sql<number>`count(*)` })
		.from(studentLessons)
		.innerJoin(lessons, eq(studentLessons.lessonId, lessons.id))
		.where(and(...query))
		.then((res) => Number(res[0]?.count || 0));

	const totalPages = Math.ceil(totalItems / limit);

	return {
		results,
		totalItems,
		totalPages,
		currentPage: page
	};
}

export type FetchStudentLessonsResult = Awaited<ReturnType<typeof fetchStudentLessons>>;

/**
 * Gets statistics about a student's lesson progress
 */
export async function getStudentLessonStats(userId: string) {
	const [stats] = await db
		.select({
			totalLessons: sql<number>`count(*)`,
			completedLessons: sql<number>`count(*) FILTER (WHERE ${studentLessons.completedAt} IS NOT NULL)`,
			inProgressLessons: sql<number>`count(*) FILTER (WHERE ${studentLessons.completedAt} IS NULL AND ${studentLessons.progress} > 0)`,
			notStartedLessons: sql<number>`count(*) FILTER (WHERE ${studentLessons.progress} = 0)`,
			averageProgress: sql<number>`AVG(${studentLessons.progress})`
		})
		.from(studentLessons)
		.where(eq(studentLessons.userId, userId));

	return {
		totalLessons: Number(stats.totalLessons || 0),
		completedLessons: Number(stats.completedLessons || 0),
		inProgressLessons: Number(stats.inProgressLessons || 0),
		notStartedLessons: Number(stats.notStartedLessons || 0),
		averageProgress: Number(stats.averageProgress || 0)
	};
}

export type StudentLessonStats = Awaited<ReturnType<typeof getStudentLessonStats>>;

/**
 * Gets recently accessed lessons for a student
 */
export async function getRecentlyAccessedLessons(userId: string, limit = 5) {
	const results = await db.query.studentLessons.findMany({
		where: eq(studentLessons.userId, userId),
		with: {
			lesson: {
				columns: {
					id: true,
					title: true,
					resume: true
				},
				with: {
					subject: true,
					classGrade: true,
					video: {
						with: {
							posterFile: true
						}
					}
				}
			}
		},
		orderBy: desc(studentLessons.lastAccessedAt),
		limit
	});

	return results;
}

export type RecentlyAccessedLessons = Awaited<ReturnType<typeof getRecentlyAccessedLessons>>;

/**
 * Gets the progress of lessons grouped by subject and grade for a student
 */
export async function getProgressForStudent(userId: string) {
	type ResultType = {
		totalLessons: number;
		completedLessons: number;
		averageProgress: number;
		data: {
			subjectId: number;
			subjectName: string;
			gradeId: number;
			gradeName: string;
			totalLessons: number;
			completedLessons: number;
			averageProgress: number;
		}[];
	};

	const result = await db.execute<ResultType>(sql`
		WITH lesson_stats AS (
			SELECT
				l."subject_id" AS "subjectId",
				s."name" AS "subjectName",
				l."class_grade_id" AS "gradeId",
				cg."name" AS "gradeName",
				COUNT(*) AS "totalLessons",
				COUNT(sl."completed_at") AS "completedLessons",
				AVG(sl."progress") AS "averageProgress"
			FROM
				"student_lessons" sl
			JOIN
				"lessons" l ON sl."lesson_id" = l.id
			JOIN
				"subjects" s ON l."subject_id" = s.id
			JOIN
				"class_grades" cg ON l."class_grade_id" = cg.id
			WHERE
				sl."user_id" = ${userId}
			GROUP BY
				l."subject_id", s."name", l."class_grade_id", cg."name"
		)
		SELECT
			SUM("totalLessons") AS "totalLessons",
			SUM("completedLessons") AS "completedLessons",
			AVG("averageProgress") AS "averageProgress",
			ARRAY_AGG(
				JSON_BUILD_OBJECT(
					'subjectId', "subjectId",
					'subjectName', "subjectName",
					'gradeId', "gradeId",
					'gradeName', "gradeName",
					'totalLessons', "totalLessons",
					'completedLessons', "completedLessons",
					'averageProgress', "averageProgress"
				)
			) AS data
		FROM
			lesson_stats;
	`);

	const row = result[0];

	return {
		totalLessons: Number(row.totalLessons || 0),
		completedLessons: Number(row.completedLessons || 0),
		averageProgress: Number(row.averageProgress || 0),
		data: row.data || []
	};
}

export type ProgressForStudent = Awaited<ReturnType<typeof getProgressForStudent>>;
