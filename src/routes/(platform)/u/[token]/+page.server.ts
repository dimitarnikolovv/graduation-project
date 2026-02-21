/**
 * Mobile Upload Page Server
 *
 * Validates the upload token and loads necessary data for the mobile upload page.
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { eq, and, inArray } from 'drizzle-orm';
import { QuestionTypeEnum } from '$lib/types/enums';
import { isFileUploadConfig, type FileUploadAnswerResponse } from '$lib/types/tests';
import { testAnswers } from '$lib/server/db/schema/tests';
import { files } from '$lib/server/db/schema/files';

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;

	// Find the token
	const uploadToken = await db.query.uploadTokens.findFirst({
		where: (table, { eq }) => eq(table.id, token),
		with: {
			attempt: {
				with: {
					test: {
						columns: {
							id: true,
							title: true
						}
					}
				}
			},
			question: {
				columns: {
					id: true,
					type: true,
					stem: true,
					config: true,
					order: true
				}
			}
		}
	});

	if (!uploadToken) {
		error(404, 'Невалиден линк за качване');
	}

	// Check if token has expired
	if (new Date() > uploadToken.expiresAt) {
		error(410, 'Линкът за качване е изтекъл. Моля, генерирайте нов от компютъра.');
	}

	// Verify question is a file upload question
	if (uploadToken.question.type !== QuestionTypeEnum.FileUpload) {
		error(400, 'Този въпрос не приема файлове');
	}

	// Get file upload config
	if (!isFileUploadConfig(uploadToken.question.config)) {
		error(500, 'Невалидна конфигурация на въпроса');
	}

	const config = uploadToken.question.config;

	// Fetch existing uploaded files for this question
	const existingAnswer = await db.query.testAnswers.findFirst({
		where: and(
			eq(testAnswers.attemptId, uploadToken.attemptId),
			eq(testAnswers.questionId, uploadToken.questionId)
		)
	});

	let existingFiles: Array<{ id: string; name: string; size: number; contentType: string }> = [];

	if (existingAnswer?.response) {
		const response = existingAnswer.response as FileUploadAnswerResponse;
		if (response.fileIds && response.fileIds.length > 0) {
			const fileRecords = await db
				.select({
					id: files.id,
					name: files.originalName,
					size: files.size,
					contentType: files.contentType
				})
				.from(files)
				.where(inArray(files.id, response.fileIds));

			existingFiles = fileRecords;
		}
	}

	return {
		token: uploadToken.id,
		attemptId: uploadToken.attemptId,
		questionId: uploadToken.questionId,
		testTitle: uploadToken.attempt.test.title,
		questionNumber: uploadToken.question.order + 1,
		questionStem: uploadToken.question.stem,
		config: {
			allowedTypes: config.allowedTypes,
			maxFileSizeMB: config.maxFileSizeMB,
			maxFiles: config.maxFiles,
			instructions: config.instructions
		},
		expiresAt: uploadToken.expiresAt.toISOString(),
		existingFiles
	};
};
