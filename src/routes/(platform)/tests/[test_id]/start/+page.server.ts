import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { AttemptStatusEnum } from '$lib/types/enums';
import { testQuestions } from '$lib/server/db/schema/tests';
import { eq, sql } from 'drizzle-orm';
import { getTestAvailability } from '$lib/utils/tests';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const currentUser = locals.user;

	const { foundTest } = await parent();

	if (!currentUser) {
		redirect(302, '/login');
	}

	// Get test availability status
	const testAvailability = getTestAvailability(foundTest);

	// Get the count of questions for this test
	const [questionsCountResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(testQuestions)
		.where(eq(testQuestions.testId, foundTest.id));

	const questionsCount = Number(questionsCountResult?.count ?? 0);

	// Check if the user has an active (in-progress) attempt
	const activeAttempt = await db.query.testAttempts.findFirst({
		where: (table, { and, eq, isNull }) =>
			and(
				eq(table.testId, foundTest.id),
				eq(table.userId, currentUser.id),
				isNull(table.submittedAt),
				eq(table.status, AttemptStatusEnum.Started)
			)
	});

	// Get all previous attempts for this user and test (for history display)
	const previousAttempts = await db.query.testAttempts.findMany({
		where: (table, { and, eq }) =>
			and(eq(table.testId, foundTest.id), eq(table.userId, currentUser.id)),
		orderBy: (table, { desc }) => [desc(table.attemptNumber)],
		columns: {
			id: true,
			attemptNumber: true,
			status: true,
			startedAt: true,
			submittedAt: true,
			totalScore: true
		}
	});

	// Calculate next attempt number
	const lastAttempt = previousAttempts[0];
	const nextAttemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

	// Check if user can start a new attempt (both attempts limit AND availability)
	const hasAttemptsRemaining =
		foundTest.allowedAttempts === 0 || nextAttemptNumber <= foundTest.allowedAttempts;
	const canStartNewAttempt = hasAttemptsRemaining && testAvailability.canTakeTest;

	// Check if user can continue an active attempt (only if test is currently available)
	const canContinueAttempt = !!activeAttempt && testAvailability.canTakeTest;

	return {
		test: foundTest,
		questionsCount,
		activeAttempt,
		previousAttempts,
		nextAttemptNumber,
		canStartNewAttempt,
		canContinueAttempt,
		hasAttemptsRemaining,
		testAvailability
	};
};
