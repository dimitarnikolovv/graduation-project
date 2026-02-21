import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { resetPasswordSchema } from './schema';
import { hash } from '@node-rs/argon2';
import { checkIfUser } from '$lib/server/auth';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { stripFieldsFromForm } from '$lib/utils/general';
import { passwordResetTokens, users } from '$lib/server/db/schema/auth';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const { locals, params } = event;

	if (checkIfUser(locals)) {
		return redirect(302, '/');
	}

	const { token } = params;

	if (!token) {
		error(404, 'Невалиден линк за смяна на парола.');
	}

	const resetPasswordForm = await superValidate(zod4(resetPasswordSchema));

	// SEO
	const title = `Смяна на парола | ${DEFAULT_SEO_TITLE}`;

	if (await isTokenValid(token)) {
		return {
			resetPasswordForm,
			token,
			title
		};
	} else {
		return {
			resetPasswordForm,
			invalidToken: true,
			token
		};
	}
};

export const actions: Actions = {
	resetPassword: async (event) => {
		const { request, params } = event;

		const form = await superValidate(request, zod4(resetPasswordSchema));

		if (!form.valid) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Формата е невалидна.'
			});
		}

		const { password, passwordConfirm } = form.data;

		const { token } = params;

		if (!(await isTokenValid(token))) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Невалиден или изтекъл линк за смяна на парола.'
			});
		}

		if (password !== passwordConfirm) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Паролите не съвпадат.'
			});
		}

		const foundToken = await db.query.passwordResetTokens.findFirst({
			where: eq(passwordResetTokens.token, token)
		});

		if (!foundToken) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Невалиден или изтекъл линк за смяна на парола.'
			});
		}

		const userId = foundToken.userId;

		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			// update a user record
			await db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning({
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				role: users.role
			});

			// delete the token
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
		} catch (err) {
			console.log(err);
			return fail(500, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Възникна грешка при смяната на паролата.'
			});
		}

		return redirect(307, '/login');
	}
};

async function isTokenValid(token: string) {
	try {
		const existingToken = await db.query.passwordResetTokens.findFirst({
			where: eq(passwordResetTokens.token, token)
		});

		if (!existingToken) {
			return false;
		}

		if (!existingToken || new Date() > existingToken.expiresAt) {
			return false;
		}

		return true;
	} catch (err) {
		console.log(err);
		return false;
	}
}
