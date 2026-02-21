/**
 * Attempt Grading Page Server
 *
 * Fetches all data needed for grading an attempt, including questions and answers.
 */

import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { QuestionTypeEnum, RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { fetchAttemptForGrading } from '$lib/server/db-querying/attempts';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema/files';
import { inArray } from 'drizzle-orm';
import type { FileUploadAnswerResponse } from '$lib/types/tests';

export const load: PageServerLoad = async ({ locals, params }) => {
	// Require admin or teacher role
	if (!checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher])) {
		redirect(302, '/login');
	}

	// Require permission
	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
		error(403, { message: 'Нямате нужните права за оценяване на опити.' });
	}

	// Fetch attempt data
	const attemptData = await fetchAttemptForGrading(params.attemptId);

	if (!attemptData) {
		error(404, { message: 'Опитът не беше намерен.' });
	}

	// Build a map of questionId -> answer for easy lookup
	const answerMap = new Map<string, (typeof attemptData.answers)[number]>();
	for (const answer of attemptData.answers) {
		answerMap.set(answer.questionId, answer);
	}

	// Collect all file IDs from FileUpload question answers
	const allFileIds: string[] = [];
	for (const answer of attemptData.answers) {
		if (
			answer.question.type === QuestionTypeEnum.FileUpload &&
			answer.response &&
			'fileIds' in answer.response
		) {
			const fileIds = (answer.response as FileUploadAnswerResponse).fileIds || [];
			allFileIds.push(...fileIds);
		}
	}

	// Fetch file details if there are any
	let filesMap = new Map<
		string,
		{
			id: string;
			displayName: string;
			originalName: string;
			size: number;
			contentType: string;
			fileKey: string;
		}
	>();

	if (allFileIds.length > 0) {
		const uploadedFiles = await db.query.files.findMany({
			where: inArray(files.id, allFileIds),
			columns: {
				id: true,
				displayName: true,
				originalName: true,
				size: true,
				contentType: true,
				fileKey: true
			}
		});

		filesMap = new Map(uploadedFiles.map((f) => [f.id, f]));
	}

	return {
		attempt: attemptData,
		answerMap,
		filesMap
	};
};

