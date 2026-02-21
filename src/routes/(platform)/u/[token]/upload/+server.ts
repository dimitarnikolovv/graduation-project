/**
 * Mobile Upload Endpoint
 *
 * Handles file uploads from mobile devices via upload token.
 * Uses API endpoint approach since mobile uploads are token-based
 * (not session-based) and work better with programmatic file handling.
 */
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { testAnswers } from '$lib/server/db/schema/tests';
import { uploadFileToS3 } from '$lib/server/server-utils/files';
import { AttemptStatusEnum, QuestionTypeEnum } from '$lib/types/enums';
import { isFileUploadConfig, type FileUploadAnswerResponse } from '$lib/types/tests';

export const POST: RequestHandler = async ({ request, params }) => {
	const { token } = params;

	// Find and validate the token
	const uploadToken = await db.query.uploadTokens.findFirst({
		where: (table, { eq }) => eq(table.id, token),
		with: {
			attempt: {
				with: {
					answers: true
				}
			},
			question: true
		}
	});

	if (!uploadToken) {
		error(404, 'Невалиден линк за качване');
	}

	// Check if token has expired
	if (new Date() > uploadToken.expiresAt) {
		error(410, 'Линкът за качване е изтекъл');
	}

	// Verify attempt is still editable
	if (
		uploadToken.attempt.submittedAt ||
		uploadToken.attempt.status !== AttemptStatusEnum.Started
	) {
		error(400, 'Този опит вече е приключен');
	}

	// Verify question type
	if (uploadToken.question.type !== QuestionTypeEnum.FileUpload) {
		error(400, 'Този въпрос не приема файлове');
	}

	// Get file upload config
	if (!isFileUploadConfig(uploadToken.question.config)) {
		error(500, 'Невалидна конфигурация на въпроса');
	}

	const config = uploadToken.question.config;

	// Parse form data
	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		error(400, 'Липсва файл');
	}

	// Validate file size
	const maxSizeBytes = config.maxFileSizeMB * 1024 * 1024;
	if (file.size > maxSizeBytes) {
		error(400, `Файлът е твърде голям (максимум ${config.maxFileSizeMB} MB)`);
	}

	// Validate file type
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

	// Get current file IDs from the answer
	const existingAnswer = uploadToken.attempt.answers.find(
		(a) => a.questionId === uploadToken.questionId
	);

	let currentFileIds: string[] = [];
	if (existingAnswer?.response && 'fileIds' in existingAnswer.response) {
		currentFileIds = (existingAnswer.response as FileUploadAnswerResponse).fileIds || [];
	}

	// Check if max files reached
	if (currentFileIds.length >= config.maxFiles) {
		error(400, `Максималният брой файлове (${config.maxFiles}) е достигнат`);
	}

	// Upload file to S3
	const { key: fileKey, fileId } = await uploadFileToS3(file, {
		basePath: `test-answers/${uploadToken.attemptId}/${uploadToken.questionId}`,
		displayName: file.name,
		uploadedById: uploadToken.userId
	});

	// Update the answer with new file ID
	const newFileIds = [...currentFileIds, fileId];
	const newResponse: FileUploadAnswerResponse = { fileIds: newFileIds };

	await db
		.insert(testAnswers)
		.values({
			attemptId: uploadToken.attemptId,
			questionId: uploadToken.questionId,
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
