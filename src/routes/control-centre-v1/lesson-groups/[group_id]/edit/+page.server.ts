import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';
import { lessons } from '$lib/server/db/schema/lessons';
import { db } from '$lib/server/db';
import { updateLessonGroupSchema } from '../../schema';
import { fetchExpandedLessonGroup } from '$lib/server/db-querying/lessonGroups';
import { lessonGroups } from '$lib/server/db/schema/lessonGroups';
import { eq, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditLessonGroups)) {
		error(403, 'Отказан достъп.');
	}

	const group = await fetchExpandedLessonGroup(parseInt(params.group_id));

	if (!group) {
		error(404, `Група с ID ${params.group_id} не беше намерена.`);
	}

	const updateLessonGroupForm = await superValidate(zod4(updateLessonGroupSchema));

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	return {
		group,
		updateLessonGroupForm,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};

export const actions: Actions = {
	updateLessonGroup: async ({ request, locals, params }) => {
		const form = await superValidate(request, zod4(updateLessonGroupSchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditLessonGroups)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const existingGroupLessons = await db.query.lessons.findMany({
				where: eq(lessons.groupId, parseInt(params.group_id)),
				columns: {
					id: true
				}
			});

			const existingLessonIds = existingGroupLessons.map((lesson) => lesson.id);

			await db.transaction(async (tx) => {
				await tx
					.update(lessonGroups)
					.set({
						name: form.data.name,
						order: form.data.order,
						subjectId: form.data.subjectId,
						classGradeId: form.data.classGradeId
					})
					.where(eq(lessonGroups.id, parseInt(params.group_id)));

				// Unlink lessons that were previously linked but are not in the new list
				const lessonIdsToUnlink = existingLessonIds.filter(
					(lessonId) => !form.data.lessonIds.includes(lessonId)
				);

				if (lessonIdsToUnlink.length > 0) {
					await tx
						.update(lessons)
						.set({ groupId: null })
						.where(inArray(lessons.id, lessonIdsToUnlink));
				}

				// If there are lesson IDs to associate, update those lessons to link to the group
				if (form.data.lessonIds && form.data.lessonIds.length > 0) {
					await tx
						.update(lessons)
						.set({
							groupId: parseInt(params.group_id)
						})
						.where(inArray(lessons.id, form.data.lessonIds));
				}
			});

			return { form, message: 'Разделът беше редактиран успешно.' };
		} catch (err) {
			console.error('Error editing lesson:', err);
			return fail(500, { form, message: 'Възникна грешка при редактирането на раздела.' });
		}
	}
};
