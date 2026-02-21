/**
 * Test Remote Functions
 *
 * Server-side remote functions for the test-taking flow.
 * These functions are called from the client using SvelteKit's remote function mechanism.
 *
 * Functions:
 * - saveAnswerRemote: Saves/updates a student's answer for a question
 * - submitAttemptRemote: Marks an attempt as submitted and grades choice questions
 * - deleteTestFileRemote: Delete an uploaded file
 * - getUploadedFilesRemote: Get list of uploaded files for a question
 * - generateUploadTokenRemote: Generate a token for mobile upload
 *
 * Note: File uploads use /api/test-upload endpoint (API endpoint is more suitable
 * for programmatic file uploads like drag-and-drop).
 */

import { command, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { testAnswers, tests } from '$lib/server/db/schema/tests';
import { files } from '$lib/server/db/schema/files';
import { uploadTokens } from '$lib/server/db/schema/uploadTokens';
import { gradeAndSubmitTestAttempt } from '$lib/server/server-utils/tests';
import { deleteUploadedFile } from '$lib/server/server-utils/files';
import { AttemptStatusEnum } from '$lib/types/enums';
import type { AnswerResponse, FileUploadAnswerResponse } from '$lib/types/tests';
import { getTestAvailability } from '$lib/utils/tests';
import { generateShortToken } from '$lib/utils/general';
import { error } from '@sveltejs/kit';
import { eq, inArray, and } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating answer response payload.
 * An answer can be one of:
 * - selected: Array of option IDs (for choice questions)
 * - text: String content (for text questions)
 * - fileIds: Array of file IDs (for file upload questions)
 */
const answerResponseSchema = z.object({
	selected: z.array(z.union([z.string(), z.number()])).optional(),
	text: z.string().max(5000).optional(),
	fileIds: z.array(z.string()).optional()
});

/**
 * Schema for the saveAnswerRemote function parameters.
 */
const saveAnswerSchema = z.object({
	/** ID of the current attempt */
	attemptId: z.string(),
	/** ID of the question being answered */
	questionId: z.string(),
	/** The answer response (selected options or text) */
	response: answerResponseSchema
});

/**
 * Schema for the submitAttemptRemote function parameters.
 */
const submitAttemptSchema = z.object({
	/** ID of the attempt to submit */
	attemptId: z.string()
});

// ============================================================================
// REMOTE FUNCTIONS
// ============================================================================

/**
 * Saves or updates a student's answer for a specific question.
 *
 * This function uses an upsert operation (insert with onConflict update)
 * to ensure that answers are never lost, even if the user refreshes the page
 * or encounters network issues.
 *
 * Security:
 * - Requires authenticated user
 * - Validates that the user owns the attempt
 * - Ensures the attempt is still in "Started" status (not submitted/graded)
 *
 * @param attemptId - The ID of the current test attempt
 * @param questionId - The ID of the question being answered
 * @param response - The answer (selected options or text)
 *
 * @throws 401 if user is not authenticated
 * @throws 404 if attempt not found or user doesn't have access
 * @throws 400 if attempt is already submitted/graded
 * @throws 500 if database operation fails
 */
export const saveAnswerRemote = command(
	saveAnswerSchema,
	async ({ attemptId, questionId, response }) => {
		const { locals } = getRequestEvent();

		// Require authentication
		if (!locals.user) {
			error(401, 'Трябва да сте влезли в системата, за да запазите отговор.');
		}

		// Fetch the attempt and verify ownership
		const currentAttempt = await db.query.testAttempts.findFirst({
			where: (table, { and, eq }) =>
				and(eq(table.id, attemptId), eq(table.userId, locals.user!.id)),
			with: {
				answers: true
			}
		});

		if (!currentAttempt) {
			error(404, 'Опитът не беше намерен или нямате достъп до него.');
		}

		// Verify attempt is still editable (hasn't been auto-submitted by cron)
		if (currentAttempt.submittedAt || currentAttempt.status !== AttemptStatusEnum.Started) {
			// Return a structured response so the client can handle it gracefully
			if (currentAttempt.status === AttemptStatusEnum.Graded) {
				return {
					success: false,
					alreadySubmitted: true,
					status: currentAttempt.status,
					message: 'Този опит вече е оценен автоматично от системата.'
				};
			} else if (currentAttempt.status === AttemptStatusEnum.Submitted) {
				return {
					success: false,
					alreadySubmitted: true,
					status: currentAttempt.status,
					message: 'Този опит вече е предаден автоматично от системата.'
				};
			}
			return {
				success: false,
				alreadySubmitted: true,
				status: currentAttempt.status,
				message: 'Този опит вече е приключен.'
			};
		}

		// Fetch the test to check availability
		const test = await db.query.tests.findFirst({
			where: eq(tests.id, currentAttempt.testId),
			columns: {
				id: true,
				opensAt: true,
				closesAt: true
			}
		});

		if (!test) {
			error(404, 'Тестът не беше намерен.');
		}

		// Check if test is still available (not closed)
		const testAvailability = getTestAvailability(test);

		if (!testAvailability.canTakeTest) {
			if (testAvailability.status === 'closed') {
				return {
					success: false,
					testClosed: true,
					message: 'Тестът е затворен. Опитът ще бъде предаден автоматично.'
				};
			} else if (testAvailability.status === 'not_yet_open') {
				error(400, 'Тестът все още не е отворен.');
			}
			error(400, 'Тестът не е достъпен в момента.');
		}

		// Normalize the response payload
		let payload: AnswerResponse;
		if (response.selected !== undefined) {
			payload = { selected: response.selected.map((val) => val.toString()) };
		} else if (response.fileIds !== undefined) {
			payload = { fileIds: response.fileIds };
		} else {
			payload = { text: response.text ?? '' };
		}

		try {
			// Upsert: Insert new answer or update existing one
			await db
				.insert(testAnswers)
				.values({
					attemptId,
					questionId,
					response: payload,
					answeredAt: new Date()
				})
				.onConflictDoUpdate({
					// Unique constraint on (attemptId, questionId)
					target: [testAnswers.attemptId, testAnswers.questionId],
					set: {
						response: payload,
						answeredAt: new Date()
					}
				});

			return { success: true };
		} catch (err) {
			console.error('Error saving answer', err);
			error(500, 'Възникна грешка при записване на отговора.');
		}
	}
);

/**
 * Submits a test attempt, marking it as completed and grading choice questions.
 *
 * Grading process:
 * 1. Fetches all answers for the attempt with their associated questions
 * 2. For SingleChoice and MultipleChoice questions:
 *    - Compares student's selection to correct answers
 *    - Awards full points for correct answers, 0 for incorrect
 * 3. Text questions are left ungraded (awardedScore = 0) for manual review
 * 4. Calculates total score and updates the attempt
 *
 * Status determination:
 * - If the test has ONLY choice questions -> status = "Graded" (fully auto-graded)
 * - If the test has ANY text questions -> status = "Submitted" (awaiting teacher review)
 *
 * After submission:
 * - The submittedAt timestamp is recorded
 * - If fully auto-graded: gradedAt is set, status = "Graded"
 * - If needs manual review: gradedAt is null, status = "Submitted"
 * - No further edits to answers are allowed
 *
 * Security:
 * - Requires authenticated user
 * - Validates that the user owns the attempt
 * - Ensures the attempt hasn't already been submitted
 *
 * @param attemptId - The ID of the attempt to submit
 *
 * @throws 401 if user is not authenticated
 * @throws 404 if attempt not found or user doesn't have access
 * @throws 400 if attempt is already submitted/graded
 * @throws 500 if database operation fails
 */
export const submitAttemptRemote = command(submitAttemptSchema, async ({ attemptId }) => {
	const { locals } = getRequestEvent();

	const localUser = locals.user;

	// Require authentication
	if (!localUser) {
		error(401, 'Трябва да сте влезли в системата, за да предадете опита.');
	}

	// Fetch the attempt first to check its status and get test info
	const currentAttempt = await db.query.testAttempts.findFirst({
		where: (table, { and, eq }) => and(eq(table.id, attemptId), eq(table.userId, localUser.id)),
		with: {
			test: {
				columns: {
					id: true,
					opensAt: true,
					closesAt: true
				}
			}
		}
	});

	if (!currentAttempt) {
		error(404, 'Опитът не беше намерен или нямате достъп до него.');
	}

	// Check if already submitted (possibly by cron job)
	if (currentAttempt.submittedAt || currentAttempt.status !== AttemptStatusEnum.Started) {
		// Return structured response so the client can redirect to results
		if (currentAttempt.status === AttemptStatusEnum.Graded) {
			return {
				alreadySubmitted: true,
				status: currentAttempt.status,
				totalScore: currentAttempt.totalScore,
				message: 'Този опит вече е оценен автоматично от системата.'
			};
		} else if (currentAttempt.status === AttemptStatusEnum.Submitted) {
			return {
				alreadySubmitted: true,
				status: currentAttempt.status,
				totalScore: currentAttempt.totalScore,
				message: 'Този опит вече е предаден автоматично от системата.'
			};
		}
		return {
			alreadySubmitted: true,
			status: currentAttempt.status,
			totalScore: currentAttempt.totalScore,
			message: 'Този опит вече е приключен.'
		};
	}

	// Check test availability
	const testAvailability = getTestAvailability(currentAttempt.test);

	if (testAvailability.status === 'closed') {
		// Test is closed - the attempt should have been auto-submitted by cron
		// But if it wasn't, we still allow manual submission
		console.log(
			`Warning: Attempt ${attemptId} being manually submitted after test closed. Cron may have missed it.`
		);
	}

	// Begin grading process
	try {
		const result = await gradeAndSubmitTestAttempt(attemptId, localUser.id);

		if (!result) {
			error(404, 'Опитът не беше намерен или нямате достъп до него.');
		}

		return result;
	} catch (err) {
		console.error('Error submitting attempt', err);
		error(500, 'Възникна грешка при предаване на опита.');
	}
});

// ============================================================================
// FILE UPLOAD REMOTE FUNCTIONS
// ============================================================================

/**
 * Schema for getting uploaded files
 */
const getUploadedFilesSchema = z.object({
	attemptId: z.string(),
	questionId: z.string()
});

/**
 * Schema for deleting an uploaded file
 */
const deleteTestFileSchema = z.object({
	attemptId: z.string(),
	questionId: z.string(),
	fileId: z.string()
});

/**
 * Schema for generating an upload token
 */
const generateUploadTokenSchema = z.object({
	attemptId: z.string(),
	questionId: z.string()
});

/**
 * Get list of uploaded files for a specific question in an attempt.
 */
export const getUploadedFilesRemote = command(
	getUploadedFilesSchema,
	async ({ attemptId, questionId }) => {
		const { locals } = getRequestEvent();

		if (!locals.user) {
			error(401, 'Трябва да сте влезли в системата');
		}

		// Verify attempt ownership
		const attempt = await db.query.testAttempts.findFirst({
			where: (table, { and, eq }) =>
				and(eq(table.id, attemptId), eq(table.userId, locals.user!.id)),
			with: {
				answers: {
					where: (table, { eq }) => eq(table.questionId, questionId)
				}
			}
		});

		if (!attempt) {
			error(404, 'Опитът не беше намерен');
		}

		const answer = attempt.answers[0];
		if (!answer?.response || !('fileIds' in answer.response)) {
			return { files: [] };
		}

		const fileIds = (answer.response as FileUploadAnswerResponse).fileIds || [];
		if (fileIds.length === 0) {
			return { files: [] };
		}

		// Fetch file details
		const uploadedFiles = await db.query.files.findMany({
			where: inArray(files.id, fileIds),
			columns: {
				id: true,
				displayName: true,
				originalName: true,
				size: true,
				contentType: true,
				fileKey: true
			}
		});

		return {
			files: uploadedFiles.map((f) => ({
				id: f.id,
				name: f.originalName,
				size: f.size,
				contentType: f.contentType,
				fileKey: f.fileKey
			}))
		};
	}
);

/**
 * Delete an uploaded file from a test answer.
 */
export const deleteTestFileRemote = command(
	deleteTestFileSchema,
	async ({ attemptId, questionId, fileId }) => {
		const { locals } = getRequestEvent();

		if (!locals.user) {
			error(401, 'Трябва да сте влезли в системата');
		}

		// Verify attempt ownership and status
		const attempt = await db.query.testAttempts.findFirst({
			where: (table, { and, eq }) =>
				and(eq(table.id, attemptId), eq(table.userId, locals.user!.id)),
			with: {
				answers: {
					where: (table, { eq }) => eq(table.questionId, questionId)
				}
			}
		});

		if (!attempt) {
			error(404, 'Опитът не беше намерен');
		}

		if (attempt.submittedAt || attempt.status !== AttemptStatusEnum.Started) {
			error(400, 'Този опит вече е приключен');
		}

		const answer = attempt.answers[0];
		if (!answer?.response || !('fileIds' in answer.response)) {
			error(404, 'Файлът не беше намерен');
		}

		const currentFileIds = (answer.response as FileUploadAnswerResponse).fileIds || [];
		if (!currentFileIds.includes(fileId)) {
			error(404, 'Файлът не беше намерен');
		}

		try {
			// Delete file from S3 and database
			await deleteUploadedFile(fileId);

			// Update the answer
			const newFileIds = currentFileIds.filter((id) => id !== fileId);
			const newResponse: FileUploadAnswerResponse = { fileIds: newFileIds };

			await db
				.update(testAnswers)
				.set({
					response: newResponse,
					answeredAt: new Date()
				})
				.where(and(eq(testAnswers.attemptId, attemptId), eq(testAnswers.questionId, questionId)));

			return { success: true };
		} catch (err) {
			console.error('Failed to delete file:', err);
			error(500, 'Неуспешно изтриване на файла');
		}
	}
);

/**
 * Generate an upload token for mobile file upload.
 * The token is valid for 30 minutes.
 */
export const generateUploadTokenRemote = command(
	generateUploadTokenSchema,
	async ({ attemptId, questionId }) => {
		const { locals } = getRequestEvent();

		if (!locals.user) {
			error(401, 'Трябва да сте влезли в системата');
		}

		// Verify attempt ownership and status
		const attempt = await db.query.testAttempts.findFirst({
			where: (table, { and, eq }) => and(eq(table.id, attemptId), eq(table.userId, locals.user!.id))
		});

		if (!attempt) {
			error(404, 'Опитът не беше намерен');
		}

		if (attempt.submittedAt || attempt.status !== AttemptStatusEnum.Started) {
			error(400, 'Този опит вече е приключен');
		}

		// Check for existing valid token
		const existingToken = await db.query.uploadTokens.findFirst({
			where: (table, { and, eq, gt }) =>
				and(
					eq(table.attemptId, attemptId),
					eq(table.questionId, questionId),
					eq(table.userId, locals.user!.id),
					gt(table.expiresAt, new Date())
				)
		});

		if (existingToken) {
			return { token: existingToken.id };
		}

		// Generate new token
		const token = generateShortToken();
		const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

		await db.insert(uploadTokens).values({
			id: token,
			attemptId,
			questionId,
			userId: locals.user.id,
			expiresAt
		});

		return { token };
	}
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Return type of saveAnswerRemote (for type inference in client code) */
export type SaveAnswerResponse = Awaited<ReturnType<typeof saveAnswerRemote>>;

/** Return type of submitAttemptRemote (for type inference in client code) */
export type SubmitAttemptResponse = Awaited<ReturnType<typeof submitAttemptRemote>>;

/** Return type of getUploadedFilesRemote */
export type GetUploadedFilesResponse = Awaited<ReturnType<typeof getUploadedFilesRemote>>;

/** Return type of deleteTestFileRemote */
export type DeleteTestFileResponse = Awaited<ReturnType<typeof deleteTestFileRemote>>;

/** Return type of generateUploadTokenRemote */
export type GenerateUploadTokenResponse = Awaited<ReturnType<typeof generateUploadTokenRemote>>;
