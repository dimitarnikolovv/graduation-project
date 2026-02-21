import { redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { addMinutes } from 'date-fns';
import { checkIfUser } from '$lib/server/auth';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { forgotPasswordSchema } from './schema';
import { db } from '$lib/server/db';
import { and, eq, isNull } from 'drizzle-orm';
import { passwordResetTokens, users } from '$lib/server/db/schema/auth';
import { sendResetPasswordEmail } from '$lib/server/server-utils/emails';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;

	if (checkIfUser(locals)) {
		return redirect(302, '/');
	}

	const loginForm = await superValidate(zod4(forgotPasswordSchema));

	// SEO
	const title = `Забравена парола | ${DEFAULT_SEO_TITLE}`;

	return { loginForm, title };
};

export const actions: Actions = {
	resetPassword: async (event) => {
		const form = await superValidate(event.request, zod4(forgotPasswordSchema));

		const { email } = form.data;

		const existingUser = await db.query.users.findFirst({
			where: and(eq(users.email, email), isNull(users.deletedAt))
		});

		if (!existingUser) {
			return { form, emailNotFound: true };
		}

		// Generate password reset token
		const resetToken = randomUUID();
		const tokenExpiration = addMinutes(new Date(), 30); // Token expires in 30 minutes

		try {
			// Delete old tokens
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, existingUser.id));

			// Store reset password token
			await db.insert(passwordResetTokens).values({
				userId: existingUser.id,
				token: resetToken,
				expiresAt: tokenExpiration
			});

			// Send reset password email
			await sendResetPasswordEmail(email, resetToken);

			return { form, sendVerificationLink: true };
		} catch (err) {
			console.log(err);
			return { form, sendVerificationLinkError: true };
		}
	}
};
