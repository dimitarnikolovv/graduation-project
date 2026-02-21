import { z } from 'zod';

export const newSubjectSchema = z.object({
	name: z
		.string()
		.min(1, { error: 'Полето е задължително' })
		.max(128, { error: 'Максималната дължина е 128 символа' })
		.trim(),
	slug: z
		.string()
		.min(1, { error: 'Полето е задължително' })
		.max(128, { error: 'Максималната дължина е 128 символа' })
		.trim(),
	colorFrom: z
		.string()
		.min(7, { error: 'Моля, изберете валиден цвят' })
		.max(7, { error: 'Моля, изберете валиден цвят' })
		.regex(/^#([0-9A-Fa-f]{6})$/, { message: 'Моля, изберете валиден цвят' })
		.trim()
		.optional(),
	colorTo: z
		.string()
		.min(7, { error: 'Моля, изберете валиден цвят' })
		.max(7, { error: 'Моля, изберете валиден цвят' })
		.regex(/^#([0-9A-Fa-f]{6})$/, { message: 'Моля, изберете валиден цвят' })
		.trim()
		.optional()
});

export type NewSubjectSchema = z.infer<typeof newSubjectSchema>;

export const updateSubjectSchema = newSubjectSchema.extend({
	id: z.int().positive()
});

export type UpdateSubjectSchema = z.infer<typeof updateSubjectSchema>;
