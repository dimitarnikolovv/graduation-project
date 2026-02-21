/**
 * Attempts Database Querying Functions
 *
 * Functions for fetching and managing test attempts for admin/teacher grading.
 */

import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lte, or } from 'drizzle-orm';
import { db } from '../db';
import { testAnswers, testAttempts, testQuestions } from '../db/schema/tests';
import { users } from '../db/schema/auth';
import { AttemptStatusEnum } from '$lib/types/enums';

// ============================================================================
// TYPES
// ============================================================================

export type FetchAttemptsParams = {
	page: number;
	limit: number;
	status: 'pending' | 'graded';
	searchParams?: URLSearchParams;
};

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetches paginated attempts based on their grading status.
 *
 * @param params - Query parameters including pagination and status filter
 * @returns Paginated list of attempts with user and test information
 */
export async function fetchPaginatedAttempts({
	page,
	limit,
	status,
	searchParams
}: FetchAttemptsParams) {
	// Build the base where clause based on status
	const statusCondition =
		status === 'pending'
			? and(
					isNotNull(testAttempts.submittedAt),
					or(
						eq(testAttempts.status, AttemptStatusEnum.Submitted),
						// Also include Started if submitted (edge case)
						and(
							eq(testAttempts.status, AttemptStatusEnum.Started),
							isNotNull(testAttempts.submittedAt)
						)
					)
				)
			: eq(testAttempts.status, AttemptStatusEnum.Graded);

	// Parse additional filters from searchParams
	const filters = [];
	if (searchParams) {
		const testId = searchParams.get('testId');
		const userId = searchParams.get('userId');
		const startDate = searchParams.get('startDate')?.trim();
		const endDate = searchParams.get('endDate')?.trim();

		if (testId) filters.push(eq(testAttempts.testId, testId));
		if (userId) filters.push(eq(testAttempts.userId, userId));

		// Date range filter on submittedAt
		if (startDate) {
			filters.push(gte(testAttempts.submittedAt, new Date(startDate)));
		}
		if (endDate) {
			filters.push(lte(testAttempts.submittedAt, new Date(endDate)));
		}
	}

	const whereClause = filters.length > 0 ? and(statusCondition, ...filters) : statusCondition;

	// Build user search condition (if provided)
	const userSearch = searchParams?.get('userSearch')?.trim();
	const userSearchCondition = userSearch
		? or(
				ilike(users.email, `%${userSearch}%`),
				ilike(users.firstName, `%${userSearch}%`),
				ilike(users.lastName, `%${userSearch}%`)
			)
		: undefined;

	// If user search is provided, we need to join with users table
	if (userSearchCondition) {
		// Use a subquery approach to filter by user
		const matchingUserIds = await db
			.select({ id: users.id })
			.from(users)
			.where(userSearchCondition);

		const userIds = matchingUserIds.map((u) => u.id);

		if (userIds.length === 0) {
			// No matching users, return empty results
			return { results: [], totalItems: 0, totalPages: 0 };
		}

		// Add user filter
		const finalWhereClause = and(whereClause, inArray(testAttempts.userId, userIds));

		// Fetch attempts with related data
		const results = await db.query.testAttempts.findMany({
			where: finalWhereClause,
			with: {
				user: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				},
				test: {
					columns: {
						id: true,
						title: true,
						maxScore: true
					}
				}
			},
			orderBy: status === 'pending' ? asc(testAttempts.submittedAt) : desc(testAttempts.gradedAt),
			limit,
			offset: (page - 1) * limit
		});

		// Get total count
		const totalItems = await db.$count(testAttempts, finalWhereClause);
		const totalPages = Math.ceil(totalItems / limit);

		return { results, totalItems, totalPages };
	}

	// Fetch attempts with related data (no user search)
	const results = await db.query.testAttempts.findMany({
		where: whereClause,
		with: {
			user: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					email: true
				}
			},
			test: {
				columns: {
					id: true,
					title: true,
					maxScore: true
				}
			}
		},
		orderBy: status === 'pending' ? asc(testAttempts.submittedAt) : desc(testAttempts.gradedAt),
		limit,
		offset: (page - 1) * limit
	});

	// Get total count
	const totalItems = await db.$count(testAttempts, whereClause);
	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchPaginatedAttemptsResult = Awaited<ReturnType<typeof fetchPaginatedAttempts>>;

export async function countAttemptsByStatus(status: 'pending' | 'graded'): Promise<number> {
	const statusCondition =
		status === 'pending'
			? and(
					isNotNull(testAttempts.submittedAt),
					or(
						eq(testAttempts.status, AttemptStatusEnum.Submitted),
						// Also include Started if submitted (edge case)
						and(
							eq(testAttempts.status, AttemptStatusEnum.Started),
							isNotNull(testAttempts.submittedAt)
						)
					)
				)
			: eq(testAttempts.status, AttemptStatusEnum.Graded);

	const count = await db.$count(testAttempts, statusCondition);
	return count;
}

/**
 * Fetches a single attempt with all details for grading.
 *
 * @param attemptId - The ID of the attempt to fetch
 * @returns The attempt with all answers and question details
 */
export async function fetchAttemptForGrading(attemptId: string) {
	const attempt = await db.query.testAttempts.findFirst({
		where: eq(testAttempts.id, attemptId),
		with: {
			user: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					email: true
				}
			},
			test: true,
			answers: {
				with: {
					question: true
				}
			}
		}
	});

	if (!attempt) return null;

	// Fetch all questions for the test (including unanswered ones)
	const allQuestions = await db.query.testQuestions.findMany({
		where: eq(testQuestions.testId, attempt.testId),
		orderBy: asc(testQuestions.order)
	});

	return {
		...attempt,
		allQuestions
	};
}

export type FetchAttemptForGradingResult = Awaited<ReturnType<typeof fetchAttemptForGrading>>;

/**
 * Updates the score for a single answer.
 *
 * @param answerId - The ID of the answer to update
 * @param score - The new score to award
 */
export async function updateAnswerScore(answerId: string, score: number) {
	await db.update(testAnswers).set({ awardedScore: score }).where(eq(testAnswers.id, answerId));
}

/**
 * Recalculates and updates the total score for an attempt.
 *
 * @param attemptId - The ID of the attempt to update
 * @returns The new total score
 */
export async function recalculateAttemptScore(attemptId: string) {
	// Get all answers for this attempt
	const attemptAnswers = await db.query.testAnswers.findMany({
		where: eq(testAnswers.attemptId, attemptId)
	});

	// Calculate total score
	const totalScore = attemptAnswers.reduce((sum, answer) => sum + (answer.awardedScore ?? 0), 0);

	// Update attempt
	await db.update(testAttempts).set({ totalScore }).where(eq(testAttempts.id, attemptId));

	return totalScore;
}

/**
 * Marks an attempt as fully graded.
 *
 * @param attemptId - The ID of the attempt to mark as graded
 */
export async function markAttemptAsGraded(attemptId: string) {
	await db
		.update(testAttempts)
		.set({
			status: AttemptStatusEnum.Graded,
			gradedAt: new Date()
		})
		.where(eq(testAttempts.id, attemptId));
}

// ============================================================================
// USER-FACING QUERY FUNCTIONS
// ============================================================================

export type FetchUserAttemptsParams = {
	userId: string;
	page: number;
	limit: number;
};

/**
 * Fetches paginated attempts for a specific user (for their profile page).
 *
 * @param params - Query parameters including userId and pagination
 * @returns Paginated list of the user's attempts with test information
 */
export async function fetchUserAttempts({ userId, page, limit }: FetchUserAttemptsParams) {
	const whereClause = eq(testAttempts.userId, userId);

	const results = await db.query.testAttempts.findMany({
		where: whereClause,
		with: {
			test: {
				columns: {
					id: true,
					title: true,
					maxScore: true
				},
				with: {
					subject: {
						columns: {
							id: true,
							name: true
						}
					},
					classGrade: {
						columns: {
							id: true,
							name: true
						}
					}
				}
			}
		},
		orderBy: desc(testAttempts.startedAt),
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(testAttempts, whereClause);
	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type FetchUserAttemptsResult = Awaited<ReturnType<typeof fetchUserAttempts>>;

/**
 * Fetches a single attempt for the user to view their results.
 * Verifies that the attempt belongs to the requesting user.
 *
 * @param attemptId - The ID of the attempt to fetch
 * @param userId - The ID of the user requesting the attempt
 * @returns The attempt with all answers and question details, or null if not found/not authorized
 */
export async function fetchUserAttemptResults(attemptId: string, userId: string) {
	const attempt = await db.query.testAttempts.findFirst({
		where: and(eq(testAttempts.id, attemptId), eq(testAttempts.userId, userId)),
		with: {
			test: true,
			answers: {
				with: {
					question: true
				}
			}
		}
	});

	if (!attempt) return null;

	// Fetch all questions for the test (including unanswered ones)
	const allQuestions = await db.query.testQuestions.findMany({
		where: eq(testQuestions.testId, attempt.testId),
		orderBy: asc(testQuestions.order)
	});

	return {
		...attempt,
		allQuestions
	};
}

export type FetchUserAttemptResultsResult = Awaited<ReturnType<typeof fetchUserAttemptResults>>;
