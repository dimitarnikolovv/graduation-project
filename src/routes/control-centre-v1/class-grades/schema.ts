import { z } from 'zod';

export const newClassGradeSchema = z.object({
	name: z
		.string()
		.min(1, { error: 'Полето е задължително' })
		.max(128, { error: 'Максималната дължина е 128 символа' })
		.trim(),
	gradeNumber: z
		.int({ error: 'Полето е задължително' })
		.positive({ message: 'Полето трябва да е положително число' }),
	slug: z
		.string()
		.min(1, { error: 'Полето е задължително' })
		.max(128, { error: 'Максималната дължина е 128 символа' })
		.trim()
});

export type NewClassGradeSchema = z.infer<typeof newClassGradeSchema>;

export const updateClassGradeSchema = z.object({
	...newClassGradeSchema.shape,
	id: z.int().positive()
});

export type UpdateClassGradeSchema = z.infer<typeof updateClassGradeSchema>;
