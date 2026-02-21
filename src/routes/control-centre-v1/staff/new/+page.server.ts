import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { hash } from '@node-rs/argon2';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { registerAdminSchema } from '../schema';
import { generateId, stripFieldsFromForm, uniqueOrThrow } from '$lib/utils/general';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema/auth';
import { userPermissions } from '$lib/server/db/schema/userPermissions';
import { sendAdminCredentials } from '$lib/server/server-utils/emails';

export const load: PageServerLoad = async ({ locals }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditAdmins)) {
		error(403, 'Отказан достъп. Нямате нужните права, за да посетите тази страница.');
	}

	const registerAdminForm = await superValidate(zod4(registerAdminSchema));

	// SEO
	const title = `Регистрация на служител | Център за контрол`;

	return {
		title,
		registerAdminForm
	};
};

export const actions: Actions = {
	register: async (event) => {
		const { request, locals } = event;

		const form = await superValidate(request, zod4(registerAdminSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Отказан достъп.'
			});
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditAdmins)) {
			return fail(403, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Отказан достъп.'
			});
		}

		if (!form.valid) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Формата е невалидна.'
			});
		}

		const { email, password, firstName, lastName } = form.data;

		try {
			//throw error if the email exists
			await db
				.selectDistinct({ email: users.email })
				.from(users)
				.where(eq(users.email, email))
				.then(uniqueOrThrow);
		} catch (err) {
			console.log(err);

			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Имейлът вече съществува.'
			});
		}

		const userId = generateId();
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			// create a user record with verified email
			await db.insert(users).values({
				id: userId,
				email: email,
				passwordHash,
				role: RolesEnum.admin,
				firstName,
				lastName
			});

			// Create a user permissions record
			await db.insert(userPermissions).values({
				userId,
				permissions: form.data.permissions
			});

			try {
				// Send verification email
				await sendAdminCredentials(email, password);
			} catch (err) {
				console.log(err);

				return fail(500, {
					form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
					message: 'Грешка при изпращане на имейл.'
				});
			}
		} catch (err) {
			console.log(err);

			return fail(500, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Грешка при регистрация на администратор.'
			});
		}

		return redirect(302, '/control-centre-v1/staff/success/register');
	}
};
