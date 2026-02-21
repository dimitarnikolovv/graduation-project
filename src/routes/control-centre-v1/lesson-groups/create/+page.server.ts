import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { createLessonGroupSchema } from '../schema';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';
import { lessonGroups } from '$lib/server/db/schema/lessonGroups';
import { db } from '$lib/server/db';
import { lessons } from '$lib/server/db/schema/lessons';
import { inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateLessons)) {
		error(403, 'Отказан достъп.');
	}

	const createLessonGroupForm = await superValidate(zod4(createLessonGroupSchema));

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	return {
		createLessonGroupForm,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};

export const actions: Actions = {
	createLessonGroup: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createLessonGroupSchema));

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
			await db.transaction(async (tx) => {
				const [lessonGroup] = await tx
					.insert(lessonGroups)
					.values({
						name: form.data.name,
						order: form.data.order,
						subjectId: form.data.subjectId,
						classGradeId: form.data.classGradeId
					})
					.returning();

				// If there are lesson IDs to associate, update those lessons to link to the new group
				if (form.data.lessonIds && form.data.lessonIds.length > 0) {
					await tx
						.update(lessons)
						.set({
							groupId: lessonGroup.id
						})
						.where(inArray(lessons.id, form.data.lessonIds));
				}
			});

			return { form, message: 'Разделът беше създаден успешно.' };
		} catch (err) {
			console.error('Error creating lesson:', err);
			return fail(500, { form, message: 'Възникна грешка при създаването на раздела.' });
		}
	}
};
