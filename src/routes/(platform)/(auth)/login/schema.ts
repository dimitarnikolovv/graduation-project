import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email({ error: 'Невалиден имейл адрес' }).trim(),
	password: z
		.string({ error: 'Полето е задължително' })
		.min(1, { message: 'Полето е задължително' })
});

export type LoginSchema = z.infer<typeof loginSchema>;
