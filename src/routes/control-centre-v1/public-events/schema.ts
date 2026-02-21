import z from 'zod';

export const createPublicEventSchema = z.object({
	name: z
		.string()
		.min(1, 'Името е задължително.')
		.max(200, 'Името трябва да е максимум 200 символа.')
		.trim(),
	description: z
		.string()
		.trim()
		.min(1, 'Описанието е задължително.')
		.max(5000, 'Описанието трябва да е максимум 5000 символа.')
		.nullable()
		.optional(),
	link: z.url('Линкът трябва да е валиден URL адрес.').trim().nullable().optional(),
	date: z.date('Датата и часът са задължителни.'),
	posterFile: z
		.file('Моля, изберете файл.')
		.refine((file) => file.size <= 5 * 1024 * 1024, 'Файлът не може да бъде по-голям от 5MB.')
		.refine(
			(file) => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
			'Файлът трябва да бъде в JPEG или PNG формат.'
		)
		.nullable()
		.optional()
});

export type CreatePublicEventSchema = z.infer<typeof createPublicEventSchema>;

export const updatePublicEventSchema = z.object({
	...createPublicEventSchema.shape
});

export type UpdatePublicEventSchema = z.infer<typeof updatePublicEventSchema>;
