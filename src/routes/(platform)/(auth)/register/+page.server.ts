import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { registerUserSchema } from './schema';
import { checkIfUser, registerUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema/auth';
import { stripFieldsFromForm, uniqueOrThrow } from '$lib/utils/general';
import { eq } from 'drizzle-orm';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;

	if (checkIfUser(locals)) {
		return redirect(302, '/');
	}

	const registerForm = await superValidate(zod4(registerUserSchema));

	// SEO
	const title = `Регистрация | ${DEFAULT_SEO_TITLE}`;

	return { registerForm, title };
};

export const actions: Actions = {
	register: async (event) => {
		const { request } = event;

		const form = await superValidate(request, zod4(registerUserSchema));

		if (!form.valid) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Формата е невалидна.'
			});
		}

		const { email, password, passwordConfirm, firstName, lastName, privacy } = form.data;

		if (password !== passwordConfirm) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Паролите не съвпадат.'
			});
		}

		if (!privacy) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Трябва да се съгласите с условията.'
			});
		}

		try {
			//throw error if the email exists
			await db
				.selectDistinct({ email: users.email })
				.from(users)
				.where(eq(users.email, email))
				.then(uniqueOrThrow);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_) {
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Този имейл вече е регистриран.'
			});
		}

		try {
			await registerUser({
				email,
				password,
				firstName,
				lastName
			});
		} catch (err) {
			console.log(err);
			return fail(400, {
				form: stripFieldsFromForm(form, ['password', 'passwordConfirm']),
				message: 'Грешка при регистрация.'
			});
		}

		return redirect(302, '/login');
	}
};
