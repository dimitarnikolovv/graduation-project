import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { updateLessonSchema } from '../../schema';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';
import { lessons } from '$lib/server/db/schema/lessons';
import { db } from '$lib/server/db';
import { fetchExpandedLesson } from '$lib/server/db-querying/lessons';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditLessons)) {
		error(403, 'Отказан достъп.');
	}

	const lesson = await fetchExpandedLesson(params.lesson_id);

	if (!lesson) {
		error(404, `Урок с ID ${params.lesson_id} не беше намерен.`);
	}

	const updateLessonForm = await superValidate(zod4(updateLessonSchema), {
		defaults: {
			title: lesson.title,
			resume: lesson.resume,
			content: lesson.content,
			isPaid: lesson.isPaid,
			publishedStatus: lesson.publishedStatus,
			subjectId: lesson.subjectId,
			classGradeId: lesson.classGradeId,
			order: lesson.order,
			videoId: lesson.videoId,
			testId: lesson.testId
		}
	});

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	return {
		lesson,
		updateLessonForm,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};

export const actions: Actions = {
	updateLesson: async ({ request, locals, params }) => {
		const form = await superValidate(request, zod4(updateLessonSchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditLessons)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			await db
				.update(lessons)
				.set({
					title: form.data.title,
					resume: form.data.resume,
					content: form.data.content,
					videoId: form.data.videoId,
					isPaid: form.data.isPaid,
					publishedStatus: form.data.publishedStatus,
					subjectId: form.data.subjectId,
					classGradeId: form.data.classGradeId,
					order: form.data.order,
					lastEditedById: locals.user.id,
					testId: form.data.testId
				})
				.where(eq(lessons.id, params.lesson_id));

			return { form, message: 'Урокът беше редактиран успешно.' };
		} catch (err) {
			console.error('Error updating lesson:', err);
			return fail(500, { form, message: 'Възникна грешка при редактирането на урока.' });
		}
	}
};
