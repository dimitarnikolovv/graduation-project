import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	activateUserSchema,
	deactivateUserSchema,
	deleteUserSchema,
	updateUserSchema
} from './schema';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { db } from '$lib/server/db';
import { eq, and, ne } from 'drizzle-orm';
import { sessions, users } from '$lib/server/db/schema/auth';
import { uniqueOrThrow } from '$lib/utils/general';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewUsers)) {
		error(403, 'Отказан достъп. Нямате разрешение да преглеждате тази страница.');
	}

	const foundUser = await db.query.users.findFirst({
		where: eq(users.id, params.user_id)
	});

	if (!foundUser) {
		error(404, 'User not found');
	}

	const updateUserForm = await superValidate(zod4(updateUserSchema));

	const deactivateUserForm = await superValidate(zod4(deactivateUserSchema));
	const activateUserForm = await superValidate(zod4(activateUserSchema));

	const deleteUserForm = await superValidate(zod4(deleteUserSchema));

	// SEO
	const title = `Редактиране на потребител | Център за контрол`;

	return {
		title,
		updateUserForm,
		foundUser,
		deactivateUserForm,
		activateUserForm,
		deleteUserForm
	};
};

export const actions: Actions = {
	updateUser: async (event) => {
		const { request, locals } = event;

		const form = await superValidate(request, zod4(updateUserSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Нямате разрешение да извършвате това действие.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditUsers)) {
			return fail(403, { form, message: 'Нямате разрешение да извършвате това действие.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидна форма.' });
		}

		const { email, firstName, lastName } = form.data;

		try {
			//throw error if the email exists
			await db
				.selectDistinct({ email: users.email })
				.from(users)
				.where(and(eq(users.email, email), ne(users.id, form.data.id)))
				.then(uniqueOrThrow);
		} catch (err) {
			console.log(err);
			return fail(400, {
				form,
				message: 'Потребител с този имейл вече съществува.'
			});
		}

		try {
			// update the user record
			await db
				.update(users)
				.set({
					email: email,
					firstName,
					lastName
				})
				.where(eq(users.id, form.data.id));
		} catch (err) {
			console.log(err);
			return fail(400, { form, message: 'Възникна грешка при обновяването на потребителя.' });
		}

		return {
			form,
			message: 'Потребителят беше обновен успешно.'
		};
	},

	deactivateUser: async (event) => {
		const { request, locals } = event;

		const form = await superValidate(request, zod4(deactivateUserSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Нямате нужните права за деактивиране на потребители.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteUsers)) {
			return fail(403, { form, message: 'Нямате нужните права за деактивиране на потребители.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидна форма.' });
		}

		try {
			await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, form.data.userId));

			await db.delete(sessions).where(eq(sessions.userId, form.data.userId));

			return {
				form,
				message: 'Потребителят беше деактивиран успешно.'
			};
		} catch (err) {
			console.log(err);
			return fail(400, { form, message: 'Възникна грешка при деактивирането на потребителя.' });
		}
	},

	activateUser: async (event) => {
		const { request, locals } = event;

		const form = await superValidate(request, zod4(activateUserSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Нямате нужните права за активиране на потребители.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditUsers)) {
			return fail(403, { form, message: 'Нямате нужните права за активиране на потребители.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидна форма.' });
		}

		try {
			await db.update(users).set({ deletedAt: null }).where(eq(users.id, form.data.userId));

			return {
				form,
				message: 'Потребителят беше активиран успешно.'
			};
		} catch (err) {
			console.log(err);
			return fail(400, { form, message: 'Възникна грешка при активирането на потребителя.' });
		}
	},

	deleteUser: async (event) => {
		const { request, locals } = event;

		const form = await superValidate(request, zod4(deleteUserSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Нямате нужните права за изтриване на потребители.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteUsers)) {
			return fail(403, { form, message: 'Нямате нужните права за изтриване на потребители.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидна форма.' });
		}

		try {
			await db.delete(users).where(eq(users.id, form.data.userId));

			await db.delete(sessions).where(eq(sessions.userId, form.data.userId));
		} catch (err) {
			console.log(err);
			return fail(400, { form, message: 'Възникна грешка при изтриването на потребителя.' });
		}

		return redirect(303, '/control-centre-v1/users');
	}
};
