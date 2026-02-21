import { EventAttributeDataType } from '$lib/types/enums';
import z from 'zod';

export const createPublicEventSchema = z
	.object({
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
		attributes: z
			.array(
				z.object({
					name: z.string().min(1, 'Името на атрибута е задължително.').trim(),
					value: z.string().min(1, 'Стойността на атрибута е задължителна.').trim(),
					dataType: z.enum(EventAttributeDataType, 'Типът на данните е задължителен.'),
					displayOrder: z.int().positive()
				})
			)
			.default([]),

		date: z.date('Датата и часът са задължителни.'),
		price: z.number('Цената е задължителна.').positive('Цената трябва да бъде положително число.'),
		posterFile: z
			.instanceof(File, { message: 'Моля, изберете файл.' })
			.refine((file) => file.size <= 5 * 1024 * 1024, 'Файлът не може да бъде по-голям от 5MB.')
			.refine(
				(file) => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
				'Файлът трябва да бъде в JPEG или PNG формат.'
			)
			.nullable()
			.optional(),

		isRedirecting: z.boolean().default(false),
		redirectUrl: z.union([
			z.url('Моля, въведете валиден URL адрес.').trim().optional(),
			z.undefined(),
			z.literal('')
		]),
		redirectButtonText: z.union([
			z.string().min(1, 'Текстът на бутона за пренасочване е задължителен.').trim().optional(),
			z.undefined(),
			z.literal('')
		])
	})
	.superRefine(({ isRedirecting, redirectUrl, redirectButtonText }, ctx) => {
		if (isRedirecting) {
			if (!redirectUrl) {
				ctx.addIssue({
					code: 'custom',
					message:
						"Когато събитието е с пренасочване, полето 'URL за пренасочване' е задължително и трябва да съдържа валиден URL адрес.",
					path: ['redirectUrl'],
					input: redirectUrl
				});
			}

			if (!redirectButtonText) {
				ctx.addIssue({
					code: 'custom',
					message:
						"Когато събитието е с пренасочване, полето 'Текст на бутона за пренасочване' е задължително и не може да бъде празно.",
					path: ['redirectButtonText'],
					input: redirectButtonText
				});
			}
		}
	});

export type CreatePublicEventSchema = z.infer<typeof createPublicEventSchema>;

export const updatePublicEventSchema = z.object({
	...createPublicEventSchema.shape
});

export type UpdatePublicEventSchema = z.infer<typeof updatePublicEventSchema>;
