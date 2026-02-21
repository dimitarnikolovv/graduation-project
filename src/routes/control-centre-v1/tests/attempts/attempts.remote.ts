/**
 * Attempts Remote Functions
 *
 * Server-side remote functions for grading test attempts.
 */

import { command, getRequestEvent } from '$app/server';
import { PRIVATE_SMTP_SENDER } from '$env/static/private';
import { PUBLIC_HOST } from '$env/static/public';
import { db } from '$lib/server/db';
import { testAnswers, testAttempts } from '$lib/server/db/schema/tests';
import { sendEmail } from '$lib/server/server-utils/emails';
import { AttemptStatusEnum, RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateAnswerScoreSchema = z.object({
	answerId: z.string(),
	score: z.number().min(0)
});

const markAsGradedSchema = z.object({
	attemptId: z.string()
});

const deleteAttemptSchema = z.object({
	attemptId: z.string()
});

// ============================================================================
// REMOTE FUNCTIONS
// ============================================================================

/**
 * Updates the score for a single answer.
 * Only accessible by admins and teachers with appropriate permissions.
 *
 * @param answerId - The ID of the answer to update
 * @param score - The new score to award
 */
export const updateAnswerScoreRemote = command(
	updateAnswerScoreSchema,
	async ({ answerId, score }) => {
		const { locals } = getRequestEvent();

		// Verify user is admin or teacher
		if (
			!locals.user ||
			![RolesEnum.admin, RolesEnum.teacher].includes(locals.user.role as RolesEnum)
		) {
			error(403, 'Нямате права за оценяване.');
		}

		// Verify permission
		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
			error(403, 'Нямате права за оценяване на тестове.');
		}

		// Fetch the answer to verify it exists and get the question for validation
		const answer = await db.query.testAnswers.findFirst({
			where: eq(testAnswers.id, answerId),
			with: {
				question: true,
				attempt: true
			}
		});

		if (!answer) {
			error(404, 'Отговорът не беше намерен.');
		}

		// Validate score doesn't exceed max points
		if (score > answer.question.points) {
			error(400, `Точките не могат да надвишават максималния брой (${answer.question.points}).`);
		}

		// Update the answer score
		await db.update(testAnswers).set({ awardedScore: score }).where(eq(testAnswers.id, answerId));

		// Recalculate total score for the attempt
		const attemptAnswers = await db.query.testAnswers.findMany({
			where: eq(testAnswers.attemptId, answer.attemptId)
		});

		const totalScore = attemptAnswers.reduce((sum, a) => {
			// Use the new score for the updated answer
			if (a.id === answerId) return sum + score;
			return sum + (a.awardedScore ?? 0);
		}, 0);

		// Update attempt total score
		await db.update(testAttempts).set({ totalScore }).where(eq(testAttempts.id, answer.attemptId));

		return { totalScore };
	}
);

/**
 * Marks an attempt as fully graded.
 * Updates the status and sets the gradedAt timestamp.
 *
 * @param attemptId - The ID of the attempt to mark as graded
 */
export const markAttemptAsGradedRemote = command(markAsGradedSchema, async ({ attemptId }) => {
	const { locals } = getRequestEvent();

	// Verify user is admin or teacher
	if (
		!locals.user ||
		![RolesEnum.admin, RolesEnum.teacher].includes(locals.user.role as RolesEnum)
	) {
		error(403, 'Нямате права за оценяване.');
	}

	// Verify permission
	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
		error(403, 'Нямате права за оценяване на тестове.');
	}

	// Fetch the attempt
	const attempt = await db.query.testAttempts.findFirst({
		where: eq(testAttempts.id, attemptId),
		with: {
			user: true
		}
	});

	if (!attempt) {
		error(404, 'Опитът не беше намерен.');
	}

	// Update attempt status
	await db
		.update(testAttempts)
		.set({
			status: AttemptStatusEnum.Graded,
			gradedAt: new Date()
		})
		.where(eq(testAttempts.id, attemptId));

	// Send email to student
	await sendEmail({
		to: attempt.user.email,
		from: `BRAAND <${PRIVATE_SMTP_SENDER}>`,
		subject: 'Опитът ви е оценен',
		html: `
            <p>Здравейте ${attempt.user.firstName} ${attempt.user.lastName},</p>
            <br />
            <p>Опитът ви е оценен с <strong>${attempt.totalScore}</strong> точки.</p>
            <p>Можете да видите резултатите си тук: <a href="${PUBLIC_HOST}/account/my-tests/${attemptId}">${PUBLIC_HOST}/account/my-tests/${attemptId}</a>.</p>
            <br />
            <p>Поздрави,</p>
            <br />
            <p>Екипът на <a href="https://braand.com">braand.com</a></p>
        `
	});

	return { success: true };
});

/**
 * Deletes a test attempt.
 * Only accessible by admins with DeleteTests permission.
 *
 * @param attemptId - The ID of the attempt to delete
 */
export const deleteAttemptRemote = command(deleteAttemptSchema, async ({ attemptId }) => {
	const { locals } = getRequestEvent();

	// Verify user is admin only (stricter permission for deletion)
	if (!locals.user || locals.user.role !== RolesEnum.admin) {
		error(403, 'Само администратори могат да изтриват опити.');
	}

	// Verify permission
	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteTests)) {
		error(403, 'Нямате права за изтриване на опити.');
	}

	// Fetch the attempt to verify it exists
	const attempt = await db.query.testAttempts.findFirst({
		where: eq(testAttempts.id, attemptId)
	});

	if (!attempt) {
		error(404, 'Опитът не беше намерен.');
	}

	// Delete the attempt (answers will be cascade deleted due to foreign key constraint)
	await db.delete(testAttempts).where(eq(testAttempts.id, attemptId));

	return { success: true };
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UpdateAnswerScoreResponse = Awaited<ReturnType<typeof updateAnswerScoreRemote>>;
export type MarkAttemptAsGradedResponse = Awaited<ReturnType<typeof markAttemptAsGradedRemote>>;
export type DeleteAttemptResponse = Awaited<ReturnType<typeof deleteAttemptRemote>>;
