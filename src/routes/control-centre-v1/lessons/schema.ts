import { PublishedStatusEnum } from '$lib/types/enums';
import z from 'zod';

export const createLessonSchema = z.object({
	title: z.string().min(1, 'Заглавието е задължително.'),
	content: z.string().trim().nullable().optional(),
	resume: z
		.string()
		.trim()
		.min(1, 'Резюмето е задължително.')
		.max(1800, 'Резюмето трябва да е максимум 1800 символа.'),

	isPaid: z.boolean().default(false),
	publishedStatus: z.enum(PublishedStatusEnum).default(PublishedStatusEnum.hidden),

	subjectId: z.int('Изберете предмет.').positive('Изберете предмет.'),
	classGradeId: z.int('Изберете клас.').positive('Изберете клас.'),

	order: z
		.int('Полето е задължително')
		.positive('Поредният номер може да бъде само положително число.'),

	groupId: z.int().positive().optional(),

	videoId: z.string('Изберете видео.').min(1, 'Изберете видео.'),
	testId: z.string().nullable().optional()
});

export type CreateLessonSchema = z.infer<typeof createLessonSchema>;

// For update, we use the same schema as for create for now
export const updateLessonSchema = createLessonSchema;

export type UpdateLessonSchema = z.infer<typeof updateLessonSchema>;
