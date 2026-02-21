import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { hash } from '@node-rs/argon2';
import { checkIfUserAndRole } from '$lib/server/auth';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { updateAdminSchema } from '../../schema';
import { userPermissions } from '$lib/server/db/schema/userPermissions';
import { db } from '$lib/server/db';
import { eq, ne, and } from 'drizzle-orm';
import { ensureUpToDatePermissions } from '$lib/server/server-utils/access-control';
import { users } from '$lib/server/db/schema/auth';
import { stripFieldsFromForm, uniqueOrThrow } from '$lib/utils/general';
import { sendAdminCredentials } from '$lib/server/server-utils/emails';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditAdmins)) {
		error(403, 'Отказан достъп. Нямате нужните права, за да посетите тази страница.');
	}

	const userId = params.user_id;

	try {
		let foundPermissions = await db.query.userPermissions.findFirst({
			where: eq(userPermissions.userId, userId)
		});

		if (!foundPermissions) {
			[foundPermissions] = await db
				.insert(userPermissions)
				.values({
					userId: userId,
					permissions: Object.values(UserPermissionsEnum).reduce(
						(acc, key) => {
							acc[key] = false;
							return acc;
						},
						{} as Record<UserPermissionsEnum, boolean>
					)
				})
				.returning();
		}

		if (!foundPermissions) {
			error(404, 'Липсващи потребителски права.');
		}

		// Ensure that the permissions are up to date
		const permissions = await ensureUpToDatePermissions(foundPermissions);

		const foundUser = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (!foundUser || foundUser.role !== RolesEnum.admin) {
			redirect(307, '/control-centre-v1/staff');
		}

		// SEO
		const title = `Редакция на служител | Център за контрол`;

		const updateAdminForm = await superValidate(zod4(updateAdminSchema));

		return {
			updateAdminForm,
			foundUser,
			foundPermissions: permissions,
			title
		};
	} catch (err) {
		console.log(err);

		error(500, 'Error loading admin user data.');
	}
};

export const actions: Actions = {
	updateAdmin: async (event) => {
		const { locals, params } = event;

		const userId = params.user_id;

		const form = await superValidate(event.request, zod4(updateAdminSchema));

		if (!locals.user || !checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, {
				form: stripFieldsFromForm(form, ['newPassword', 'newPasswordConfirm']),
				message: 'Отказан достъп.'
			});
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditAdmins)) {
			return fail(403, {
				form: stripFieldsFromForm(form, ['newPassword', 'newPasswordConfirm']),
				message: 'Отказан достъп.'
			});
		}

		if (!form.valid) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['newPassword', 'newPasswordConfirm']),
				message: 'Формата е невалидна.'
			});
		}

		const { email, newPassword, firstName, lastName } = form.data;

		try {
			//throw error if the email exists
			await db
				.selectDistinct({ email: users.email })
				.from(users)
				.where(and(eq(users.email, email), ne(users.id, userId)))
				.then(uniqueOrThrow);
		} catch (err) {
			console.log(err);
			return fail(400, {
				form: stripFieldsFromForm(form, ['newPassword', 'newPasswordConfirm']),
				message: 'Имейлът вече съществува.'
			});
		}

		const isPasswordChanged = newPassword && newPassword.length > 0;

		let passwordHash: string | undefined = undefined;

		if (isPasswordChanged) {
			passwordHash = await hash(newPassword, {
				// recommended minimum parameters
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
		}

		try {
			const currentUser = await db.query.users.findFirst({ where: eq(users.id, userId) });

			// update the user record
			await db
				.update(users)
				.set({
					email: email,
					passwordHash: isPasswordChanged ? passwordHash : currentUser?.passwordHash,
					firstName,
					lastName
				})
				.where(eq(users.id, userId));

			// update the user permissions if the user is not the current user
			// prevents self-modification of permissions
			if (locals.user.id !== userId) {
				await db
					.update(userPermissions)
					.set({
						permissions: form.data.permissions as Record<UserPermissionsEnum, boolean>
					})
					.where(eq(userPermissions.userId, userId));
			}

			try {
				// Send credentials email
				if (currentUser?.email !== form.data.email || isPasswordChanged) {
					await sendAdminCredentials(email, isPasswordChanged ? newPassword : 'Без промяна');
				}
			} catch (err) {
				console.log(err);
				return fail(500, {
					form: stripFieldsFromForm(form, ['newPassword', 'newPasswordConfirm']),
					message: 'Грешка при изпращане на имейл.'
				});
			}
		} catch (err) {
			console.log(err);
			return fail(500, {
				form: stripFieldsFromForm(form, ['newPassword', 'newPasswordConfirm']),
				message: 'Грешка при актуализация на администратора.'
			});
		}

		return {
			form: stripFieldsFromForm(form, ['newPassword', 'newPasswordConfirm']),
			message: 'Успешно актуализиране на администратора.'
		};
	}
};
