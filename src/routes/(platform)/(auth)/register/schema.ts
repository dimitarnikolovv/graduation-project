import { z } from 'zod';

export const registerUserSchema = z
	.object({
		firstName: z
			.string({ error: 'Полето е задължително' })
			.min(1, { error: 'Полето е задължително' })
			.max(128, {
				error: 'Полето не може да бъде по-дълго от 128 символа'
			})
			.trim(),
		lastName: z
			.string({ error: 'Полето е задължително' })
			.min(1, { error: 'Полето е задължително' })
			.max(128, {
				error: 'Полето не може да бъде по-дълго от 128 символа'
			})
			.trim(),
		email: z.email({ error: 'Невалиден имейл адрес' }).trim(),

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
			}),
		privacy: z.boolean({
			error: 'Полето е задължително'
		})
	})
	.check(({ value, issues }) => {
		const { passwordConfirm, password, privacy } = value;
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

		if (privacy === false) {
			issues.push({
				code: 'custom',
				message:
					'За да използвате платформата, трябва да се съгласите с политиката за поверителност.',
				error:
					'За да използвате платформата, трябва да се съгласите с политиката за поверителност.',
				input: privacy,
				path: ['privacy']
			});
		}
	});

export type RegisterSchema = z.infer<typeof registerUserSchema>;
