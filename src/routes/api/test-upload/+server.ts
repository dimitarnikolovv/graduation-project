/**
 * Test File Upload API
 *
 * Handles file uploads for test questions.
 * This endpoint is used because remote form functions don't work well
 * with programmatic file uploads (drag-and-drop, custom file pickers).
 */
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { testAnswers } from '$lib/server/db/schema/tests';
import { uploadFileToS3 } from '$lib/server/server-utils/files';
import { AttemptStatusEnum, QuestionTypeEnum } from '$lib/types/enums';
import { isFileUploadConfig, type FileUploadAnswerResponse } from '$lib/types/tests';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Require authentication
	if (!locals.user) {
		error(401, 'Трябва да сте влезли в системата');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const attemptId = formData.get('attemptId') as string | null;
	const questionId = formData.get('questionId') as string | null;

	if (!file || !attemptId || !questionId) {
		error(400, 'Липсват задължителни полета');
	}

	// Fetch the attempt and verify ownership
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

	// Verify attempt is still editable
	if (attempt.submittedAt || attempt.status !== AttemptStatusEnum.Started) {
		error(400, 'Този опит вече е приключен');
	}

	// Fetch the question to get config
	const question = await db.query.testQuestions.findFirst({
		where: (table, { eq }) => eq(table.id, questionId)
	});

	if (!question) {
		error(404, 'Въпросът не беше намерен');
	}

	if (question.type !== QuestionTypeEnum.FileUpload) {
		error(400, 'Този въпрос не приема файлове');
	}

	// Validate file against question config
	if (!isFileUploadConfig(question.config)) {
		error(500, 'Невалидна конфигурация на въпроса');
	}

	const config = question.config;

	// Check file size
	const maxSizeBytes = config.maxFileSizeMB * 1024 * 1024;
	if (file.size > maxSizeBytes) {
		error(400, `Файлът е твърде голям (максимум ${config.maxFileSizeMB} MB)`);
	}

	// Check file type
	const isAllowedType = config.allowedTypes.some((allowed) => {
		if (allowed.endsWith('/*')) {
			const category = allowed.replace('/*', '');
			return file.type.startsWith(category + '/');
		}
		return file.type === allowed;
	});

	if (!isAllowedType) {
		error(400, 'Неразрешен тип файл');
	}

	// Check current file count
	const existingAnswer = attempt.answers[0];
	let currentFileIds: string[] = [];

	if (existingAnswer?.response && 'fileIds' in existingAnswer.response) {
		currentFileIds = (existingAnswer.response as FileUploadAnswerResponse).fileIds || [];
	}

	if (currentFileIds.length >= config.maxFiles) {
		error(400, `Максималният брой файлове (${config.maxFiles}) е достигнат`);
	}

	// Upload file to S3
	const { key: fileKey, fileId } = await uploadFileToS3(file, {
		basePath: `test-answers/${attemptId}/${questionId}`,
		displayName: file.name,
		uploadedById: locals.user.id
	});

	// Update the answer with new file ID
	const newFileIds = [...currentFileIds, fileId];
	const newResponse: FileUploadAnswerResponse = { fileIds: newFileIds };

	await db
		.insert(testAnswers)
		.values({
			attemptId,
			questionId,
			response: newResponse,
			answeredAt: new Date()
		})
		.onConflictDoUpdate({
			target: [testAnswers.attemptId, testAnswers.questionId],
			set: {
				response: newResponse,
				answeredAt: new Date()
			}
		});

	return json({
		success: true,
		file: {
			id: fileId,
			name: file.name,
			size: file.size,
			contentType: file.type,
			fileKey
		}
	});
};
