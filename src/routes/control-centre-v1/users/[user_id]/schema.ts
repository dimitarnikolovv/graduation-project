import { z } from 'zod';

export const updateUserSchema = z.object({
	id: z.string(),
	firstName: z
		.string('Полето е задължително.')
		.min(1, 'Полето е задължително.')
		.max(128, 'Полето е твърде дълго. Максимална дължина: 128 символа.')
		.trim(),
	lastName: z
		.string('Полето е задължително.')
		.min(1, 'Полето е задължително.')
		.max(128, 'Полето е твърде дълго. Максимална дължина: 128 символа.')
		.trim(),
	email: z.email('Имейлът не е валиден.').trim()
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export const deactivateUserSchema = z.object({
	userId: z.string()
});

export type DeactivateUserSchema = z.infer<typeof deactivateUserSchema>;

export const activateUserSchema = z.object({
	userId: z.string()
});

export type ActivateUserSchema = z.infer<typeof activateUserSchema>;

export const deleteUserSchema = z.object({
	userId: z.string()
});

export type DeleteUserSchema = z.infer<typeof deleteUserSchema>;
