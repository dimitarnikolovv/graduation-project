import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema/files';
import { inArray } from 'drizzle-orm';
import { AttemptStatusEnum, QuestionTypeEnum } from '$lib/types/enums';
import type { FileUploadAnswerResponse } from '$lib/types/tests';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const currentUser = locals.user;

	if (!currentUser) {
		redirect(302, '/login');
	}

	const { foundTest } = await parent();

	// Find active attempt (not submitted)
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

	if (!activeAttempt) {
		error(404, 'Няма активен опит за този тест.');
	}

	// Fetch all questions ordered
	const allQuestions = await db.query.testQuestions.findMany({
		where: (table, { eq }) => eq(table.testId, foundTest.id),
		orderBy: (table, { asc }) => [asc(table.order)]
	});

	const answerMap = new Map<string, (typeof activeAttempt.answers)[number]>();

	for (const answer of activeAttempt.answers) {
		answerMap.set(answer.questionId, answer);
	}

	// Collect all file IDs from FileUpload question answers
	const allFileIds: string[] = [];
	const fileUploadQuestionIds = new Set(
		allQuestions.filter((q) => q.type === QuestionTypeEnum.FileUpload).map((q) => q.id)
	);

	for (const answer of activeAttempt.answers) {
		if (fileUploadQuestionIds.has(answer.questionId)) {
			const response = answer.response as FileUploadAnswerResponse | null;
			if (response?.fileIds && response.fileIds.length > 0) {
				allFileIds.push(...response.fileIds);
			}
		}
	}

	// Fetch file details if there are any
	const filesMap: Record<string, { id: string; name: string; size: number; contentType: string }> =
		{};

	if (allFileIds.length > 0) {
		const fileRecords = await db
			.select({
				id: files.id,
				name: files.originalName,
				size: files.size,
				contentType: files.contentType
			})
			.from(files)
			.where(inArray(files.id, allFileIds));

		for (const file of fileRecords) {
			filesMap[file.id] = file;
		}
	}

	return {
		test: foundTest,
		attempt: activeAttempt,
		questions: allQuestions,
		answerMap,
		filesMap
	};
};
