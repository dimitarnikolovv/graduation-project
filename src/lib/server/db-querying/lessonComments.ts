import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { lessonComments } from '../db/schema/lessonComments';
import type { Lesson } from '../db/schema/lessons';

/** Generates a query array based on the provided search parameters.
 * This function constructs an array of conditions to be used in a **drizzle orm** query.
 *
 * @param searchParams - The URLSearchParams object containing the search parameters.
 * @returns An array of conditions for the database query or undefined if no conditions are found.
 */
function generateQueryFromParams(searchParams: URLSearchParams) {
	const startDate = searchParams.get('startDate')?.trim();
	const endDate = searchParams.get('endDate')?.trim();
	const id = searchParams.get('id')?.trim();
	const lessonId = searchParams.get('lessonId')?.trim();
	const authorId = searchParams.get('authorId')?.trim();

	const query = [];

	if (startDate) query.push(gte(lessonComments.createdAt, new Date(startDate)));
	if (endDate && endDate !== startDate)
		query.push(lte(lessonComments.createdAt, new Date(endDate)));
	if (startDate && endDate && startDate === endDate)
		query.push(
			lte(
				lessonComments.createdAt,
				new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))
			)
		);
	if (id) query.push(eq(lessonComments.id, id));
	if (authorId) query.push(eq(lessonComments.authorId, authorId));
	if (lessonId) query.push(eq(lessonComments.lessonId, lessonId));

	return query.length > 0 ? and(...query) : undefined;
}

type FetchExpandedCommentsParams = {
	page: number;
	limit: number;
	searchParams?: URLSearchParams;
	orderBy?: 'createdAt' | 'lessonId';
	orderDirection?: 'asc' | 'desc';
};

/** Fetches a paginated list of lessons with expanded relations based on the provided parameters.
 *
 * @param params - The parameters for fetching lessons, including pagination, search filters, and sorting options.
 * @returns An object containing the results, total items count, and total pages count.
 */
export async function fetchExpandedComments({
	page,
	limit,
	searchParams,
	orderBy = 'createdAt',
	orderDirection = 'desc'
}: FetchExpandedCommentsParams) {
	const query = generateQueryFromParams(searchParams ?? new URLSearchParams());

	const results = await db.query.lessonComments.findMany({
		with: {
			author: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					role: true
				}
			},
			lesson: {
				columns: {
					id: true,
					title: true,
					subjectId: true,
					classGradeId: true
				},
				with: {
					subject: true,
					classGrade: true
				}
			}
		},
		orderBy:
			orderDirection === 'asc' ? asc(lessonComments[orderBy]) : desc(lessonComments[orderBy]),
		limit,
		offset: (page - 1) * limit,
		where: query
	});

	const totalItems = await db.$count(lessonComments, query);

	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchExpandedCommentsResult = Awaited<ReturnType<typeof fetchExpandedComments>>;

/**
 * Counts the number of comments for a specific lesson.
 * @param lessonId - The ID of the lesson to count comments for.
 * @returns The total number of comments for the lesson.
 */
export async function countLessonComments(lessonId: Lesson['id']) {
	const count = await db.$count(lessonComments, eq(lessonComments.lessonId, lessonId));
	return count;
}

/**
 * Fetches comments for a specific lesson.
 * @param lessonId - The ID of the lesson to fetch comments for.
 * @param pagination - An object containing pagination options: `limit` and `page`.
 * @returns An object containing the comments and pagination info.
 */
export async function fetchLessonComments(
	lessonId: Lesson['id'],
	{ limit = 20, page = 1 }: { limit?: number; page?: number } = {}
) {
	const comments = await db.query.lessonComments.findMany({
		where: eq(lessonComments.lessonId, lessonId),
		with: {
			author: {
				columns: {
					firstName: true,
					lastName: true,
					id: true,
					role: true
				}
			}
		},
		orderBy: [desc(lessonComments.createdAt)],
		limit: limit,
		offset: (page - 1) * limit
	});

	const totalItems = await countLessonComments(lessonId);

	const totalPages = Math.ceil(totalItems / limit);

	return { comments, totalItems, totalPages, page, limit };
}
