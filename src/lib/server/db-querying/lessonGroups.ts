import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { lessonGroups } from '../db/schema/lessonGroups';
import { db } from '../db';
import { lessons } from '../db/schema/lessons';
import { PublishedStatusEnum } from '$lib/types/enums';

// /** Generates a query array based on the provided search parameters.
//  * This function constructs an array of conditions to be used in a **drizzle orm** query.
//  *
//  * @param searchParams - The URLSearchParams object containing the search parameters.
//  * @returns An array of conditions for the database query or undefined if no conditions are found.
//  */
// function generateQueryFromParams(searchParams: URLSearchParams) {
// 	const name = searchParams.get('name')?.trim();
// 	const id = searchParams.get('id')?.trim();
// 	const subjectIds = searchParams
// 		.getAll('subjectIDs')
// 		.filter((id) => id.trim() !== '')
// 		.map(Number);
// 	const classGradeIds = searchParams
// 		.getAll('classIDs')
// 		.filter((id) => id.trim() !== '')
// 		.map(Number);

// 	const query = [];

// 	if (id) query.push(eq(lessonGroups.id, parseInt(id)));
// 	if (name) query.push(or(ilike(lessonGroups.name, `%${name}%`)));

// 	if (subjectIds.length > 0) query.push(inArray(lessonGroups.subjectId, subjectIds));
// 	if (classGradeIds.length > 0) query.push(inArray(lessonGroups.classGradeId, classGradeIds));

// 	return query.length > 0 ? and(...query) : undefined;
// }

type FetchPaginatedLessonGroupsProps = {
	page: number;
	limit: number;
	searchParams?: URLSearchParams;
};

/**
 * Fetch paginated lesson groups with the count of associated lessons.
 * @param page - The page number (1-based).
 * @param limit - The number of items per page.
 * @param searchParams - Optional URLSearchParams for filtering.
 * @returns An object containing the results, total items, and total pages.
 */
export async function fetchPaginatedLessonGroups({
	page,
	limit
	// searchParams
}: FetchPaginatedLessonGroupsProps) {
	const returnedLessonGroups = await db.query.lessonGroups.findMany({
		with: {
			classGrade: true,
			subject: true
		},
		limit,
		offset: (page - 1) * limit,
		orderBy: [desc(lessonGroups.order)]
	});

	const totalItems = await db.$count(lessonGroups);

	const totalPages = Math.ceil(totalItems / limit);

	return {
		results: returnedLessonGroups,
		totalItems,
		totalPages
	};
}

export type PaginatedLessonGroups = Awaited<ReturnType<typeof fetchPaginatedLessonGroups>>;

export async function fetchExpandedLessonGroup(groupId: number) {
	const lesson = await db.query.lessonGroups.findFirst({
		where: (lg, { eq }) => eq(lg.id, groupId),
		with: {
			lessons: {
				columns: {
					id: true
				}
			},
			classGrade: true,
			subject: true
		}
	});

	return lesson;
}

export type ExpandedLessonGroup = Awaited<ReturnType<typeof fetchExpandedLessonGroup>>;

/**
 * Fetches lesson groups with lessons to display for a given subject ID and class grade ID.
 * The lessons are ordered by their order field in ascending order.
 * Only the title, order, and id fields of each lesson are returned.
 *
 * @param subjectId - The ID of the subject to filter lessons by.
 * @param classGradeId - The ID of the class grade to filter lessons by.
 * @returns An object containing the lesson groups with their respective lessons,
 * total lessons count that are associated with a group, and total groups count.
 */
export async function getLessonGroupsToDisplayByGradeAndSubject(
	subjectId: number,
	classGradeId: number
) {
	const results = await db.query.lessonGroups.findMany({
		where: and(eq(lessonGroups.subjectId, subjectId), eq(lessonGroups.classGradeId, classGradeId)),
		columns: {
			name: true,
			order: true,
			id: true
		},
		with: {
			lessons: {
				columns: {
					title: true,
					order: true,
					id: true
				},
				orderBy: asc(lessons.order)
			}
		},
		orderBy: asc(lessonGroups.order)
	});

	// Count only lessons that are associated with a group
	const totalLessons = await db.$count(
		lessons,
		and(
			eq(lessons.subjectId, subjectId),
			eq(lessons.classGradeId, classGradeId),
			isNotNull(lessons.groupId)
		)
	);

	const totalGroups = await db.$count(
		lessonGroups,
		and(eq(lessonGroups.subjectId, subjectId), eq(lessonGroups.classGradeId, classGradeId))
	);

	return { results, totalLessons, totalGroups };
}

export type GetLessonGroupsToDisplayByGradeAndSubjectResult = Awaited<
	ReturnType<typeof getLessonGroupsToDisplayByGradeAndSubject>
>;

type FetchAllExpandedLessonGroupsParams = {
	classGradeId: number;
	subjectId: number;
};

/**
 * Fetches all expanded lesson groups with their associated published lessons and relations for a specific class grade and subject.
 *
 * @param classGradeId - The ID of the class grade to filter lesson groups.
 * @param subjectId - The ID of the subject to filter lesson groups.
 * @returns An array of lesson groups with their associated lessons and relations.
 */
export async function fetchAllExpandedLessonGroups({
	classGradeId,
	subjectId
}: FetchAllExpandedLessonGroupsParams) {
	const results = await db.query.lessonGroups.findMany({
		with: {
			lessons: {
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
							isPaid: true,
							publishedStatus: true
						}
					},
					group: {
						columns: {
							id: true,
							name: true
						}
					}
				},
				orderBy: [asc(lessons.order)],
				where: (lessons, { eq }) => eq(lessons.publishedStatus, PublishedStatusEnum.published)
			}
		},
		orderBy: [asc(lessonGroups.order)],
		where: and(eq(lessonGroups.classGradeId, classGradeId), eq(lessonGroups.subjectId, subjectId))
	});

	return results;
}

export type FetchAllExpandedLessonGroupsResult = Awaited<
	ReturnType<typeof fetchAllExpandedLessonGroups>
>;
