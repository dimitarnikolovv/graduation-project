import { z } from 'zod';

export const createLessonGroupSchema = z.object({
	name: z
		.string()
		.min(1, { error: 'Полето е задължително' })
		.max(255, { error: 'Максималната дължина е 255 символа' })
		.trim(),
	order: z.int().positive('Редът трябва да е положително число'),

	lessonIds: z.string().array().default([]),

	classGradeId: z.int().positive({ message: 'Изберете клас' }),
	subjectId: z.int().positive({ message: 'Изберете предмет' })
});

export type CreateLessonGroupSchema = z.infer<typeof createLessonGroupSchema>;

export const updateLessonGroupSchema = createLessonGroupSchema;

export type UpdateLessonGroupSchema = z.infer<typeof updateLessonGroupSchema>;
