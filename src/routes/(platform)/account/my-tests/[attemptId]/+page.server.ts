/**
 * Attempt Results Page Server
 *
 * Fetches all data needed to display the results of a specific test attempt.
 * Verifies that the attempt belongs to the current user.
 */

import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fetchUserAttemptResults } from '$lib/server/db-querying/attempts';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema/files';
import { inArray } from 'drizzle-orm';
import { AttemptStatusEnum, QuestionTypeEnum } from '$lib/types/enums';
import type { FileUploadAnswerResponse } from '$lib/types/tests';

export const load: PageServerLoad = async ({ locals, params }) => {
	const currentUser = locals.user;

	if (!currentUser) {
		redirect(302, '/login');
	}

	// Fetch the attempt with all related data
	const attemptData = await fetchUserAttemptResults(params.attemptId, currentUser.id);

	if (!attemptData) {
		error(404, { message: 'Опитът не беше намерен или нямате достъп до него.' });
	}

	// Only allow viewing results if the attempt has been submitted
	if (attemptData.status === AttemptStatusEnum.Started) {
		// Redirect to the test taking page if the attempt is still in progress
		redirect(302, `/tests/${attemptData.testId}/start`);
	}

	// Build a map of questionId -> answer for easy lookup
	const answerMap = new Map<string, (typeof attemptData.answers)[number]>();
	for (const answer of attemptData.answers) {
		answerMap.set(answer.questionId, answer);
	}

	// Collect all file IDs from FileUpload question answers
	const allFileIds: string[] = [];
	const fileUploadQuestionIds = new Set(
		attemptData.allQuestions.filter((q) => q.type === QuestionTypeEnum.FileUpload).map((q) => q.id)
	);

	for (const answer of attemptData.answers) {
		if (fileUploadQuestionIds.has(answer.questionId)) {
			const response = answer.response as FileUploadAnswerResponse | null;
			if (response?.fileIds && response.fileIds.length > 0) {
				allFileIds.push(...response.fileIds);
			}
		}
	}

	// Fetch file details if there are any
	const filesMap: Record<
		string,
		{ id: string; name: string; size: number; contentType: string; fileKey: string }
	> = {};

	if (allFileIds.length > 0) {
		const fileRecords = await db
			.select({
				id: files.id,
				name: files.originalName,
				size: files.size,
				contentType: files.contentType,
				fileKey: files.fileKey
			})
			.from(files)
			.where(inArray(files.id, allFileIds));

		for (const file of fileRecords) {
			filesMap[file.id] = file;
		}
	}

	return {
		attempt: attemptData,
		answerMap,
		filesMap
	};
};
