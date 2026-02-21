import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { loginSchema } from './schema';
import { checkIfUser, loginAndRedirectUser } from '$lib/server/auth';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { stripFieldsFromForm } from '$lib/utils/general';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;

	if (checkIfUser(locals)) {
		return redirect(302, '/');
	}

	const loginForm = await superValidate(zod4(loginSchema));

	// SEO
	const title = `Вход | ${DEFAULT_SEO_TITLE}`;

	return { loginForm, title };
};

export const actions: Actions = {
	login: async (event) => {
		const form = await superValidate(event.request, zod4(loginSchema));

		if (!form.valid) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password']),
				message: 'Невалидни форма.'
			});
		}

		const { email, password } = form.data;

		const existingUser = await db.query.users.findFirst({
			where: (u, { eq }) => eq(u.email, email)
		});

		if (!existingUser) {
			return fail(409, {
				form: stripFieldsFromForm(form, ['password']),
				message: 'Грешен имейл или парола.'
			});
		}

		const validPassword = await verify(existingUser.passwordHash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) {
			return fail(409, {
				form: stripFieldsFromForm(form, ['password']),
				message: 'Грешен имейл или парола.'
			});
		}

		if (existingUser.deletedAt) {
			return fail(410, {
				form: stripFieldsFromForm(form, ['password']),
				message: 'Вашият акаунт е деактивиран. Моля, свържете се с администратор.'
			});
		}

		await loginAndRedirectUser({ event, user: existingUser });
	}
};
