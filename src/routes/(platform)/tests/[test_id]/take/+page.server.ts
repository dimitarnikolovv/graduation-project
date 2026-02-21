import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { AttemptStatusEnum } from '$lib/types/enums';
import { testAttempts, type TestAnswer } from '$lib/server/db/schema/tests';
import { fetchPaginatedTestQuestions } from '$lib/server/db-querying/tests';
import { and } from 'drizzle-orm';
import { getTestAvailability } from '$lib/utils/tests';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const currentUser = locals.user;

	if (!currentUser) {
		redirect(302, '/login');
	}

	const { foundTest } = await parent();

	// Check test availability before allowing access
	const testAvailability = getTestAvailability(foundTest);

	if (!testAvailability.canTakeTest) {
		// Redirect back to start page - it will show appropriate message
		redirect(302, `/tests/${foundTest.id}/start`);
	}

	// Pagination setup for questions
	const limit = foundTest.questionsPerPage;
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	// Fetch paginated questions for the test
	const questionsData = await fetchPaginatedTestQuestions({
		testId: foundTest.id,
		page,
		limit
	});

	const { results: questions, totalItems, totalPages } = questionsData;

	const allQuestionIds = await db.query.testQuestions.findMany({
		where: (table, { eq }) => eq(table.testId, foundTest.id),
		columns: {
			id: true,
			order: true
		},
		orderBy: (table, { asc }) => [asc(table.order)]
	});

	// Check if the user has a started test attempt
	const activeAttempt = await db.query.testAttempts.findFirst({
		where: (table, { and, eq, isNull }) =>
			and(
				eq(table.testId, foundTest.id),
				eq(table.userId, currentUser.id),
				isNull(table.submittedAt),
				eq(table.status, AttemptStatusEnum.Started)
			),
		with: {
			answers: true
		}
	});

	/**
	 * Map questions to their answers for easier access in the frontend
	 * ```ts
	 * questionAnswersMap: Map<questionId, TestAnswer[]>
	 * ```
	 */
	const questionAnswersMap = new Map<string, TestAnswer[]>();

	// If there is no active attempt, return it
	if (activeAttempt) {
		// Populate the questionAnswersMap with the attempt's answers
		for (const answer of activeAttempt.answers) {
			if (!questionAnswersMap.has(answer.questionId)) {
				questionAnswersMap.set(answer.questionId, []);
			}
			questionAnswersMap.get(answer.questionId)?.push(answer);
		}

		return {
			test: foundTest,
			attempt: activeAttempt,
			answerMap: questionAnswersMap,
			allQuestionIds,
			questions,
			totalItems,
			totalPages,
			page,
			limit
		};
	}

	// Otherwise, create a new attempt

	// Check the highest attempt number for this user and test
	const lastAttempt = await db.query.testAttempts.findFirst({
		where: (table, { eq }) => and(eq(table.testId, foundTest.id), eq(table.userId, currentUser.id)),
		orderBy: (table, { desc }) => [desc(table.attemptNumber)]
	});

	let nextAttemptNumber = 1;

	if (lastAttempt) {
		nextAttemptNumber = lastAttempt.attemptNumber + 1;
	}

	// Check if the user has exceeded the allowed number of attempts
	// If allowedAttempts is 0, it means unlimited attempts are allowed
	if (nextAttemptNumber > foundTest.allowedAttempts && foundTest.allowedAttempts !== 0) {
		error(
			403,
			'Не можете да започнете нов опит, тъй като сте достигнали максималния брой опити за този тест.'
		);
	}

	const [newAttempt] = await db
		.insert(testAttempts)
		.values({
			testId: foundTest.id,
			userId: currentUser.id,
			attemptNumber: nextAttemptNumber
		})
		.returning();

	if (!newAttempt) {
		error(500, 'Грешка при създаването на нов опит за тест.');
	}

	return {
		test: foundTest,
		attempt: newAttempt,
		answerMap: questionAnswersMap,
		allQuestionIds,
		questions,
		totalItems,
		totalPages,
		page,
		limit
	};
};
