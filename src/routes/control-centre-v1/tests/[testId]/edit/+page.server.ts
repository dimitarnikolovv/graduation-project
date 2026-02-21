import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { PublishedStatusEnum, RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { updateTestSchema } from '../../schema';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';
import { db } from '$lib/server/db';
import { testAttempts, testQuestions, tests } from '$lib/server/db/schema/tests';
import { fetchExpandedTest } from '$lib/server/db-querying/tests';
import { eq } from 'drizzle-orm';
import { priceInCentsToRealPrice, realPriceToPriceInCents } from '$lib/utils/prices';
import { isAfter } from 'date-fns';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditTests)) {
		error(403, 'Отказан достъп.');
	}

	const test = await fetchExpandedTest(params.testId);

	if (!test) {
		error(404, `Тест с ID ${params.testId} не беше намерен.`);
	}

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	// Search if there are any user attempts for this test, if so, disable question removal
	const userAttemptsCount = await db.$count(testAttempts, eq(testAttempts.testId, test.id));

	const allowQuestionRemoval =
		userAttemptsCount === 0 || test.publishedStatus === PublishedStatusEnum.draft;

	const allowSettingAsDraft =
		test.publishedStatus === PublishedStatusEnum.draft || userAttemptsCount === 0;

	const updateTestForm = await superValidate(zod4(updateTestSchema), {
		defaults: {
			title: test.title,
			subjectId: test.subjectId,
			classGradeId: test.classGradeId,
			allowedAttempts: test.allowedAttempts,
			timeLimitMin: test.timeLimitSec / 60,
			description: test.description,
			isPaid: test.isPaid,
			opensAt: test.opensAt,
			closesAt: test.closesAt,
			price: priceInCentsToRealPrice(test.priceInCents),
			isFeatured: test.isFeatured,
			featuredOrder: test.featuredOrder,
			publishedStatus: test.publishedStatus,
			questionsPerPage: test.questionsPerPage,
			questions: test.questions.map((q) => ({
				id: q.id, // IMPORTANT: Include ID to update existing questions instead of recreating them
				order: q.order,
				stem: q.stem,
				type: q.type,
				points: q.points,
				config: q.config
			}))
		}
	});

	return {
		test,
		updateTestForm,
		subjects: foundSubjects,
		classGrades: foundClassGrades,
		allowQuestionRemoval,
		allowSettingAsDraft
	};
};

export const actions: Actions = {
	updateTest: async ({ request, locals, params }) => {
		const form = await superValidate(request, zod4(updateTestSchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditTests)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		// Check if the opensAt is before closesAt if both are set
		if (form.data.opensAt && form.data.closesAt && isAfter(form.data.opensAt, form.data.closesAt)) {
			return fail(400, {
				form,
				message: 'Дата и час на отваряне трябва да са преди дата и час на затваряне.'
			});
		}

		const duplicateQuestionOrdersMap = new Map<number, number[]>();
		form.data.questions.forEach((question, index) => {
			if (duplicateQuestionOrdersMap.has(question.order)) {
				duplicateQuestionOrdersMap.get(question.order)?.push(index + 1);
			} else {
				duplicateQuestionOrdersMap.set(question.order, [index + 1]);
			}
		});

		const duplicateOrders = Array.from(duplicateQuestionOrdersMap.entries()).filter(
			([, indices]) => indices.length > 1
		);

		if (duplicateOrders.length > 0) {
			const messages = duplicateOrders.map(
				([order, indices]) =>
					`Въпросите на позиции ${indices.join(
						', '
					)} имат еднакъв пореден ред (${order}). Редът трябва да е уникален за всеки въпрос.`
			);
			return fail(400, { form, message: messages.join(' ') });
		}

		const user = locals.user;

		const maxScore = form.data.questions.reduce((acc, question) => acc + question.points, 0);

		try {
			const test = await db.query.tests.findFirst({
				where: eq(tests.id, params.testId),

				columns: { id: true, publishedStatus: true }
			});

			if (!test) {
				return fail(404, { form, message: 'Тестът не беше намерен.' });
			}
			// Search if there are any user attempts for this test, if so, disable question removal
			const userAttemptsCount = await db.$count(
				testAttempts,
				eq(testAttempts.testId, params.testId)
			);

			const allowSettingAsDraft =
				test.publishedStatus === PublishedStatusEnum.draft || userAttemptsCount === 0;

			if (!allowSettingAsDraft && form.data.publishedStatus === PublishedStatusEnum.draft) {
				return fail(400, {
					form,
					message:
						'Не може да се зададе статус "чернова", тъй като тестът вече е публикуван и има опити от потребители.'
				});
			}

			await db.transaction(async (tx) => {
				await tx
					.update(tests)
					.set({
						title: form.data.title,
						allowedAttempts: form.data.allowedAttempts,
						description: form.data.description,
						timeLimitSec: form.data.timeLimitMin * 60,
						subjectId: form.data.subjectId,
						classGradeId: form.data.classGradeId,
						isPaid: form.data.isPaid,
						opensAt: form.data.opensAt,
						closesAt: form.data.closesAt,
						priceInCents: realPriceToPriceInCents(form.data.price),
						isFeatured: form.data.isFeatured,
						featuredOrder: form.data.featuredOrder,
						publishedStatus: form.data.publishedStatus,
						lastEditedById: user.id,
						questionsPerPage: form.data.questionsPerPage,
						maxScore: maxScore
					})
					.where(eq(tests.id, params.testId));

				const questions = await tx.query.testQuestions.findMany({
					where: eq(testQuestions.testId, params.testId)
				});

				const questionsToUpdate = form.data.questions.filter(
					(q) => questions.some((tq) => q.id && tq.id === q.id) // questions that exist in DB and in form
				) as ((typeof form.data.questions)[number] & { id: string })[];

				const questionsToCreate = form.data.questions.filter((q) => !q.id); // new questions (form only)

				// Note: Questions are never deleted to preserve student answer history
				// Only updates and new additions are allowed

				const createQuestionPromises = questionsToCreate.map(
					async (question) =>
						await tx.insert(testQuestions).values({
							testId: params.testId,
							order: question.order,
							type: question.type,
							stem: question.stem,
							points: question.points,
							config: question.config
						})
				);

				await Promise.all(createQuestionPromises);

				const questionPromises = questionsToUpdate.map(
					async (question) =>
						await tx
							.update(testQuestions)
							.set({
								order: question.order,
								type: question.type,
								stem: question.stem,
								points: question.points,
								config: question.config
							})
							.where(eq(testQuestions.id, question.id))
				);

				await Promise.all(questionPromises);
			});

			return { form, message: 'Тестът беше редактиран успешно.' };
		} catch (err) {
			console.error('Error creating test:', err);
			return fail(500, { form, message: 'Възникна грешка при редактирането на теста.' });
		}
	}
};
