import z from 'zod';

export const addEntrySchema = z.object({
	atendeeEmail: z.email('Моля, въведете валиден имейл адрес.').trim(),
	atendeeName: z.string().min(2, 'Името трябва да е поне 2 символа дълго.').trim()
});

export type AddEntrySchema = z.infer<typeof addEntrySchema>;
