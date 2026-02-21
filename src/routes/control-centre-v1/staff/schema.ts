import { UserPermissionsEnum } from '$lib/types/enums';
import { z } from 'zod';

export const deleteAdminSchema = z.object({
	id: z.string()
});

export type DeleteAdminSchema = z.infer<typeof deleteAdminSchema>;

export const generalAdminInfoSchema = z.object({
	firstName: z
		.string('Полето е задължително.')
		.min(1, 'Полето е задължително.')
		.max(128, 'Полето не може да е по-дълго от 128 символа.')
		.trim(),
	lastName: z
		.string('Полето е задължително.')
		.min(1, 'Полето е задължително.')
		.max(128, 'Полето не може да е по-дълго от 128 символа.')
		.trim(),
	email: z.email('Имейл адресът не е валиден.').trim(),

	permissions: z.object({
		...Object.values(UserPermissionsEnum).reduce(
			(acc, key) => {
				acc[key] = z.boolean().default(false);
				return acc;
			},
			{} as Record<UserPermissionsEnum, z.ZodDefault<z.ZodBoolean>>
		)
	})
});

export type GeneralAdminInfoSchema = z.infer<typeof generalAdminInfoSchema>;

export const registerAdminSchema = generalAdminInfoSchema
	.extend({
		password: z
			.string('Полето е задължително.')
			.min(8, 'Паролата трябва да е поне 8 символа.')
			.regex(/[0-9]/, 'Паролата трябва да съдържа поне една цифра.')
			.regex(/[a-zA-Z]/, 'Паролата трябва да съдържа поне една буква.'),
		passwordConfirm: z
			.string('Полето е задължително.')
			.min(8, 'Паролата трябва да е поне 8 символа.')
			.regex(/[0-9]/, 'Паролата трябва да съдържа поне една цифра.')
			.regex(/[a-zA-Z]/, 'Паролата трябва да съдържа поне една буква.')
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

export type RegisterAdminSchema = z.infer<typeof registerAdminSchema>;

export const updateAdminSchema = generalAdminInfoSchema
	.extend({
		cityId: z.int().positive('Моля, изберете валиден град.').optional(),
		newPassword: z.union([
			z
				.string('Полето е задължително.')
				.min(8, 'Паролата трябва да е поне 8 символа.')
				.regex(/[0-9]/, 'Паролата трябва да съдържа поне една цифра.')
				.regex(/[a-zA-Z]/, 'Паролата трябва да съдържа поне една буква.')
				.nullable()
				.optional(),

			z.literal('').optional()
		]),
		newPasswordConfirm: z.union([
			z
				.string('Полето е задължително.')
				.min(8, 'Паролата трябва да е поне 8 символа.')
				.regex(/[0-9]/, 'Паролата трябва да съдържа поне една цифра.')
				.regex(/[a-zA-Z]/, 'Паролата трябва да съдържа поне една буква.')
				.nullable()
				.optional(),

			z.literal('').optional()
		])
	})
	.check(({ value, issues }) => {
		const { newPasswordConfirm, newPassword } = value;
		if (newPasswordConfirm !== newPassword) {
			issues.push({
				code: 'custom',
				message: 'Паролите трябва да съвпадат',
				input: newPasswordConfirm,
				path: ['newPasswordConfirm']
			});
			issues.push({
				code: 'custom',
				message: 'Паролите трябва да съвпадат',
				input: newPassword,
				path: ['newPassword']
			});
		}
	});

export type UpdateAdminSchema = z.infer<typeof updateAdminSchema>;
