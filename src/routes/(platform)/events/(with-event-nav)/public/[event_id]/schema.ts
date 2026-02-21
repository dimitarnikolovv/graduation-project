import z from 'zod';

export const registerForEventSchema = z.object({
	eventId: z.uuid(),
	email: z.email('Моля, въведете валиден имейл адрес.'),
	name: z.string().min(2, 'Името трябва да е поне 2 символа дълго.')
});

export type RegisterForEventSchema = z.infer<typeof registerForEventSchema>;
