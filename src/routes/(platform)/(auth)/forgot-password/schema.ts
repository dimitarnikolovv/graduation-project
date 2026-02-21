import { z } from 'zod';

export const forgotPasswordSchema = z.object({
	email: z.email({ error: 'Невалиден имейл адрес' }).trim()
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
