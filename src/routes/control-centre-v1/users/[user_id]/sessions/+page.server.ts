import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { deleteSessionSchema, deleteAllSessionsSchema } from './schema';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema/auth';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewUsers)) {
		error(403, 'Access denied. You do not have permission to view this page.');
	}

	try {
		const deleteSessionForm = await superValidate(zod4(deleteSessionSchema));
		const deleteAllSessionsForm = await superValidate(zod4(deleteAllSessionsSchema));

		const foundSessions = await db.query.sessions.findMany({
			where: and(eq(sessions.userId, params.user_id))
		});

		return {
			foundSessions,
			deleteSessionForm,
			deleteAllSessionsForm
		};
	} catch (err) {
		console.log(err);
		error(500, 'Нещо се обърка. Моля, опитайте отново.');
	}
};

export const actions: Actions = {
	deleteUserSession: async (event) => {
		const { locals } = event;

		const form = await superValidate(event.request, zod4(deleteSessionSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, {
				form,
				message: 'Отказан достъп. Нямате разрешение да редактирате сесии.'
			});
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditUsers)) {
			return fail(403, {
				form,
				message: 'Отказан достъп. Нямате разрешение да редактирате сесии.'
			});
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидна форма.' });
		}

		try {
			await db
				.delete(sessions)
				.where(and(eq(sessions.id, form.data.sessionId), eq(sessions.userId, form.data.userId)))
				.returning({ id: sessions.id });

			return { form, message: 'Сесията е изтрита успешно.' };
		} catch (err) {
			console.log(err);
			return fail(500, { form, message: 'Възникна грешка при изтриването на сесията.' });
		}
	},

	deleteAllUserSession: async (event) => {
		const { locals } = event;

		const form = await superValidate(event.request, zod4(deleteAllSessionsSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, {
				form,
				message: 'Отказан достъп. Нямате разрешение да редактирате сесии.'
			});
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditUsers)) {
			return fail(403, {
				form,
				message: 'Отказан достъп. Нямате разрешение да редактирате сесии.'
			});
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидна форма.' });
		}

		try {
			await db
				.delete(sessions)
				.where(eq(sessions.userId, form.data.userId))
				.returning({ id: sessions.id });

			return { form, message: 'Всички сесии са изтрити успешно.' };
		} catch (err) {
			console.log(err);
			return fail(500, { form, message: 'Възникна грешка при изтриването на сесиите.' });
		}
	}
};
