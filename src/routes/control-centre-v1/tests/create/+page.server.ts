import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { createTestSchema } from '../schema';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';
import { db } from '$lib/server/db';
import { testQuestions, tests } from '$lib/server/db/schema/tests';
import { realPriceToPriceInCents } from '$lib/utils/prices';
import { isAfter } from 'date-fns';

export const load: PageServerLoad = async ({ locals }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateTests)) {
		error(403, 'Отказан достъп.');
	}

	const createTestForm = await superValidate(zod4(createTestSchema));

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	return {
		createTestForm,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};

export const actions: Actions = {
	createTest: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createTestSchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateTests)) {
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
			await db.transaction(async (tx) => {
				const [createdTest] = await tx
					.insert(tests)
					.values({
						title: form.data.title,
						allowedAttempts: form.data.allowedAttempts,
						description: form.data.description,
						timeLimitSec: form.data.timeLimitMin * 60,
						subjectId: form.data.subjectId,
						classGradeId: form.data.classGradeId,
						authorId: user.id,
						isPaid: form.data.isPaid,
						priceInCents: realPriceToPriceInCents(form.data.price),
						isFeatured: form.data.isFeatured,
						featuredOrder: form.data.featuredOrder,
						opensAt: form.data.opensAt,
						closesAt: form.data.closesAt,
						publishedStatus: form.data.publishedStatus,
						lastEditedById: user.id,
						questionsPerPage: form.data.questionsPerPage,
						maxScore: maxScore
					})
					.returning({
						id: tests.id
					});

				const questionPromises = form.data.questions.map(
					async (question) =>
						await tx.insert(testQuestions).values({
							testId: createdTest.id,
							order: question.order,
							type: question.type,
							stem: question.stem,
							points: question.points,
							config: question.config
						})
				);

				await Promise.all(questionPromises);
			});
			return { form, message: 'Тестът беше създаден успешно.' };
		} catch (err) {
			console.error('Error creating test:', err);
			return fail(500, { form, message: 'Възникна грешка при създаването на теста.' });
		}
	}
};
