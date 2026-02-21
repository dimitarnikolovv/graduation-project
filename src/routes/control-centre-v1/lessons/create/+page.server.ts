import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { createLessonSchema } from '../schema';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';
import { lessons } from '$lib/server/db/schema/lessons';
import { db } from '$lib/server/db';
import { generateId } from '$lib/utils/general';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateLessons)) {
		error(403, 'Отказан достъп.');
	}

	const createLessonForm = await superValidate(zod4(createLessonSchema));

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	return {
		createLessonForm,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};

export const actions: Actions = {
	createLesson: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createLessonSchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateLessons)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			// Check if the order is unique within the same subject and class grade
			const existingLesson = await db.query.lessons.findFirst({
				where: and(
					eq(lessons.subjectId, form.data.subjectId),
					eq(lessons.classGradeId, form.data.classGradeId),
					eq(lessons.order, form.data.order)
				)
			});

			if (existingLesson) {
				return fail(400, {
					form: {
						...form,
						errors: {
							order: ['Този пореден номер вече съществува за този предмет и клас.']
						}
					},
					message: `Урок с пореден номер ${form.data.order} вече съществува за този предмет и клас.`
				});
			}

			await db.insert(lessons).values({
				id: generateId(),
				title: form.data.title,
				resume: form.data.resume,
				content: form.data.content,
				videoId: form.data.videoId,
				isPaid: form.data.isPaid,
				publishedStatus: form.data.publishedStatus,
				subjectId: form.data.subjectId,
				classGradeId: form.data.classGradeId,
				order: form.data.order,
				authorId: locals.user.id,
				lastEditedById: locals.user.id,
				testId: form.data.testId
			});

			return { form, message: 'Урокът беше създаден успешно.' };
		} catch (err) {
			console.error('Error creating lesson:', err);
			return fail(500, { form, message: 'Възникна грешка при създаването на урока.' });
		}
	}
};
