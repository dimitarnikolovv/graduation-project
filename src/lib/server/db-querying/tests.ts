import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { testQuestions, tests } from '../db/schema/tests';
import { PublishedStatusEnum } from '$lib/types/enums';

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

	if (startDate) query.push(gte(tests.createdAt, new Date(startDate)));
	if (endDate && endDate !== startDate) query.push(lte(tests.createdAt, new Date(endDate)));
	if (startDate && endDate && startDate === endDate)
		query.push(
			lte(tests.createdAt, new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)))
		);
	if (id) query.push(eq(tests.id, id));
	if (title) query.push(or(ilike(tests.title, `%${title}%`)));
	if (authorId) query.push(eq(tests.authorId, authorId));
	if (isPaid) query.push(eq(tests.isPaid, isPaid === 'true'));

	if (subjectIds.length > 0) query.push(inArray(tests.subjectId, subjectIds));
	if (classGradeIds.length > 0) query.push(inArray(tests.classGradeId, classGradeIds));

	return query.length > 0 ? and(...query) : undefined;
}

export type FetchExpandedTestsParams = {
	page: number;
	limit: number;
	searchParams?: URLSearchParams;
	orderBy?: 'createdAt' | 'subjectId' | 'classGradeId';
	orderDirection?: 'asc' | 'desc';
};

export async function fetchExpandedTests({
	page,
	limit,
	searchParams,
	orderBy = 'createdAt',
	orderDirection = 'desc'
}: FetchExpandedTestsParams) {
	const query = generateQueryFromParams(searchParams ?? new URLSearchParams());

	const results = await db.query.tests.findMany({
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
			classGrade: true
		},
		extras: {
			questionsCount:
				sql<number>`(SELECT COUNT(*) FROM test_questions WHERE test_questions.test_id = ${tests.id})`.as(
					'questionsCount'
				)
		},
		orderBy: orderDirection === 'asc' ? asc(tests[orderBy]) : desc(tests[orderBy]),
		limit,
		offset: (page - 1) * limit,
		where: query
	});

	const totalItems = await db.$count(tests, query);

	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchExpandedTestsResult = Awaited<ReturnType<typeof fetchExpandedTests>>;

export async function fetchExpandedTest(testId: string) {
	const result = await db.query.tests.findFirst({
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
			questions: {
				orderBy: (t, { asc }) => [asc(t.order)]
			},
			subject: true,
			classGrade: true
		},

		extras: {
			questionsCount:
				sql<number>`(SELECT COUNT(*) FROM test_questions WHERE test_questions.test_id = tests.id)`.as(
					'questionsCount'
				)
		},

		where: eq(tests.id, testId)
	});

	return result;
}

export type FetchExpandedTestResult = Awaited<ReturnType<typeof fetchExpandedTest>>;

export async function fetchTestById(testId: string) {
	const result = await db.query.tests.findFirst({
		where: eq(tests.id, testId)
	});

	return result;
}

export type FetchTestByIdResult = Awaited<ReturnType<typeof fetchTestById>>;

export async function fetchPublishedTestById(testId: string) {
	const result = await db.query.tests.findFirst({
		where: and(eq(tests.id, testId), eq(tests.publishedStatus, PublishedStatusEnum.published))
	});

	return result;
}

export type FetchPublishedTestByIdResult = Awaited<ReturnType<typeof fetchPublishedTestById>>;

export type FetchPublishedTestsParams = {
	page: number;
	limit: number;
	isPaid?: boolean;
	isFeatured?: boolean;
	subjectIds?: number[];
	classGradeIds?: number[];
};

/**
 * Fetches published tests for public display.
 * Only returns tests with publishedStatus = 'published'.
 * Can filter by isPaid, isFeatured, subject, and class grade.
 *
 * Order: Featured first (by featuredOrder), then paid, then free, then by creation date.
 */
export async function fetchPublishedTests({
	page,
	limit,
	isPaid,
	isFeatured,
	subjectIds,
	classGradeIds
}: FetchPublishedTestsParams) {
	const conditions = [eq(tests.publishedStatus, PublishedStatusEnum.published)];

	if (isPaid !== undefined) {
		conditions.push(eq(tests.isPaid, isPaid));
	}

	if (isFeatured !== undefined) {
		conditions.push(eq(tests.isFeatured, isFeatured));
	}

	if (subjectIds && subjectIds.length > 0) {
		conditions.push(inArray(tests.subjectId, subjectIds));
	}

	if (classGradeIds && classGradeIds.length > 0) {
		conditions.push(inArray(tests.classGradeId, classGradeIds));
	}

	const query = and(...conditions);

	const results = await db.query.tests.findMany({
		with: {
			subject: true,
			classGrade: true
		},
		extras: {
			questionsCount:
				sql<number>`(SELECT COUNT(*) FROM test_questions WHERE test_questions.test_id = ${tests.id})`.as(
					'questionsCount'
				)
		},
		// Order: featured first (by featuredOrder desc), then paid tests, then free tests, then by creation date
		orderBy: [
			desc(tests.isFeatured),
			desc(tests.featuredOrder),
			desc(tests.isPaid),
			desc(tests.createdAt)
		],
		limit,
		offset: (page - 1) * limit,
		where: query
	});

	const totalItems = await db.$count(tests, query);
	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchPublishedTestsResult = Awaited<ReturnType<typeof fetchPublishedTests>>;

/**
 * Counts published tests by grade for a given subject.
 */
export async function countOfPublishedTestsInGradeBySubject(subjectId: number) {
	const result = await db
		.select({
			grade_id: tests.classGradeId,
			count_of_tests: sql<number>`count(*)::int`.as('count_of_tests')
		})
		.from(tests)
		.where(
			and(eq(tests.subjectId, subjectId), eq(tests.publishedStatus, PublishedStatusEnum.published))
		)
		.groupBy(tests.classGradeId);

	return result;
}

export type CountOfPublishedTestsInGradeBySubjectResult = Awaited<
	ReturnType<typeof countOfPublishedTestsInGradeBySubject>
>;

/**
 * Counts published tests by subject.
 */
export async function countOfPublishedTestsInSubjects() {
	const result = await db
		.select({
			subject_id: tests.subjectId,
			count_of_tests: sql<number>`count(*)::int`.as('count_of_tests')
		})
		.from(tests)
		.where(eq(tests.publishedStatus, PublishedStatusEnum.published))
		.groupBy(tests.subjectId);

	return result;
}

export type CountOfPublishedTestsInSubjectsResult = Awaited<
	ReturnType<typeof countOfPublishedTestsInSubjects>
>;

/**
 * Fetches featured published tests for a specific subject and grade.
 * These are shown at the top, ordered by featuredOrder.
 */
export async function fetchFeaturedTests(subjectId: number, classGradeId: number) {
	const results = await db.query.tests.findMany({
		with: {
			subject: true,
			classGrade: true
		},
		extras: {
			questionsCount:
				sql<number>`(SELECT COUNT(*) FROM test_questions WHERE test_questions.test_id = ${tests.id})`.as(
					'questionsCount'
				)
		},
		where: and(
			eq(tests.publishedStatus, PublishedStatusEnum.published),
			eq(tests.subjectId, subjectId),
			eq(tests.classGradeId, classGradeId),
			eq(tests.isFeatured, true)
		),
		orderBy: [desc(tests.featuredOrder), desc(tests.createdAt)]
	});

	return results;
}

export type FetchFeaturedTestsResult = Awaited<ReturnType<typeof fetchFeaturedTests>>;

/**
 * Fetches paid (non-featured) published tests for a specific subject and grade with pagination.
 */
export async function fetchPaidTests(
	subjectId: number,
	classGradeId: number,
	page: number,
	limit: number
) {
	const whereClause = and(
		eq(tests.publishedStatus, PublishedStatusEnum.published),
		eq(tests.subjectId, subjectId),
		eq(tests.classGradeId, classGradeId),
		eq(tests.isFeatured, false),
		eq(tests.isPaid, true)
	);

	const results = await db.query.tests.findMany({
		with: {
			subject: true,
			classGrade: true
		},
		extras: {
			questionsCount:
				sql<number>`(SELECT COUNT(*) FROM test_questions WHERE test_questions.test_id = ${tests.id})`.as(
					'questionsCount'
				)
		},
		where: whereClause,
		orderBy: [desc(tests.createdAt)],
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(tests, whereClause);
	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchPaidTestsResult = Awaited<ReturnType<typeof fetchPaidTests>>;

/**
 * Fetches free (non-featured) published tests for a specific subject and grade with pagination.
 */
export async function fetchFreeTests(
	subjectId: number,
	classGradeId: number,
	page: number,
	limit: number
) {
	const whereClause = and(
		eq(tests.publishedStatus, PublishedStatusEnum.published),
		eq(tests.subjectId, subjectId),
		eq(tests.classGradeId, classGradeId),
		eq(tests.isFeatured, false),
		eq(tests.isPaid, false)
	);

	const results = await db.query.tests.findMany({
		with: {
			subject: true,
			classGrade: true
		},
		extras: {
			questionsCount:
				sql<number>`(SELECT COUNT(*) FROM test_questions WHERE test_questions.test_id = ${tests.id})`.as(
					'questionsCount'
				)
		},
		where: whereClause,
		orderBy: [desc(tests.createdAt)],
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(tests, whereClause);
	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchFreeTestsResult = Awaited<ReturnType<typeof fetchFreeTests>>;

export type FetchPaginatedTestQuestionsParams = {
	testId: string;
	page: number;
	limit: number;
};

export async function fetchPaginatedTestQuestions(params: FetchPaginatedTestQuestionsParams) {
	const { testId, page, limit } = params;

	const results = await db.query.testQuestions.findMany({
		where: eq(testQuestions.testId, testId),
		orderBy: asc(testQuestions.order),
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(testQuestions, eq(testQuestions.testId, testId));

	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchPaginatedTestQuestionsResult = Awaited<
	ReturnType<typeof fetchPaginatedTestQuestions>
>;

/**
 * Fetches all questions for a given test (no pagination).
 * Used for results page and review page where we need all questions.
 *
 * @param testId - The ID of the test
 * @returns Array of all questions for the test, ordered by their order field
 */
export async function fetchAllTestQuestions(testId: string) {
	const results = await db.query.testQuestions.findMany({
		where: eq(testQuestions.testId, testId),
		orderBy: asc(testQuestions.order)
	});

	return results;
}

export type FetchAllTestQuestionsResult = Awaited<ReturnType<typeof fetchAllTestQuestions>>;
