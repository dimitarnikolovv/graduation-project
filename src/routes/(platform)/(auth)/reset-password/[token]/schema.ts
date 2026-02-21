import { z } from 'zod';

export const resetPasswordSchema = z
	.object({
		password: z
			.string({ error: 'Полето е задължително' })
			.min(8, {
				error: 'Паролата трябва да бъде поне 8 символа'
			})
			.regex(/[0-9]/, {
				error: 'Паролата трябва да съдържа поне една цифра'
			})
			.regex(/[a-zA-Z]/, {
				error: 'Паролата трябва да съдържа поне една буква'
			}),
		passwordConfirm: z
			.string({ error: 'Полето е задължително' })
			.min(8, {
				error: 'Паролата трябва да бъде поне 8 символа'
			})
			.regex(/[0-9]/, {
				error: 'Паролата трябва да съдържа поне една цифра'
			})
			.regex(/[a-zA-Z]/, {
				error: 'Паролата трябва да съдържа поне една буква'
			})
	})
	.check(({ value, issues }) => {
		const { passwordConfirm, password } = value;
		if (passwordConfirm !== password) {
			issues.push({
				code: 'custom',
				message: 'Паролите трябва да съвпадат',
				input: passwordConfirm,
				path: ['passwordConfirm']
			});
			issues.push({
				code: 'custom',
				message: 'Паролите трябва да съвпадат',
				input: password,
				path: ['password']
			});
		}
	});
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
