import z from 'zod';
import { PublishedStatusEnum, QuestionTypeEnum } from '$lib/types/enums';
import type { ChoiceConfig, QuestionConfig, TextConfig, FileUploadConfig } from '$lib/types/tests';

// single and multiple choice questions
const choiceConfigSchema: z.ZodType<ChoiceConfig> = z.object({
	options: z
		.array(
			z.object({
				id: z.number().nonnegative(),
				text: z.string().min(1, 'Текстът на опцията е задължителен.').trim()
			})
		)
		.min(2, 'Трябва да има поне 2 опции.'),
	correct: z.array(z.int().nonnegative()).min(1, 'Трябва да има поне един верен отговор.')
	// shuffle: z.boolean().default(false)
});

const textConfigSchema: z.ZodType<TextConfig> = z.object({
	sampleAnswer: z.string().min(1, 'Примерният отговор е задължителен.').trim(),
	maxLength: z.int().min(1, 'Максималната дължина трябва да е поне 1.').default(255)
});

// file upload questions
const fileUploadConfigSchema: z.ZodType<FileUploadConfig> = z.object({
	allowedTypes: z.array(z.string().min(1)).min(1, 'Трябва да има поне един позволен тип файл.'),
	maxFileSizeMB: z
		.number()
		.min(0.1, 'Максималният размер трябва да е поне 0.1 MB.')
		.max(100, 'Максималният размер не може да надвишава 100 MB.')
		.default(10),
	maxFiles: z
		.int()
		.min(1, 'Трябва да е позволен поне 1 файл.')
		.max(10, 'Максимум 10 файла.')
		.default(1),
	instructions: z.string().max(500, 'Инструкциите не може да са повече от 500 символа.').optional()
});

const questionConfigSchema: z.ZodType<QuestionConfig> = z.union([
	choiceConfigSchema,
	textConfigSchema,
	fileUploadConfigSchema
]);

const questionSchema = z
	.object({
		order: z.int().min(1),
		type: z.enum(QuestionTypeEnum).default(QuestionTypeEnum.SingleChoice),
		stem: z.string().min(1, 'Въпросът е задължителен.').trim(),
		points: z.number().min(0.01, 'Точките трябва да са поне 0.01.').max(100, 'Максимум 100 точки.'),

		config: questionConfigSchema
	})
	.check(({ value, issues }) => {
		const { type, config } = value;
		// value.forEach(({ type, config, order }, index) => {
		if (type === QuestionTypeEnum.SingleChoice || type === QuestionTypeEnum.MultipleChoice) {
			// Type guard to ensure we're using choiceConfigSchema
			const choiceConfig = config as z.infer<typeof choiceConfigSchema>;

			if (!choiceConfig.options || choiceConfig.options.length === 0) {
				issues.push({
					code: 'custom',
					message: 'Опциите са задължителни за въпроси с избираем отговор.',
					input: type,
					path: ['type']
				});
			}

			if (choiceConfig.options.length < 2) {
				issues.push({
					code: 'custom',
					message: 'Трябва да има поне 2 опции.',
					input: type,
					path: ['type']
				});
			}

			if (!choiceConfig.correct || choiceConfig.correct.length < 1) {
				issues.push({
					code: 'custom',
					message: 'Трябва да има поне един верен отговор.',
					input: type,
					path: ['type']
				});
			}

			if (type === QuestionTypeEnum.SingleChoice && choiceConfig.correct.length > 1) {
				issues.push({
					code: 'custom',
					message: 'Може да има само един верен отговор за въпроси с един отговор.',
					input: type,
					path: ['type']
				});
			}
		}

		if (type === QuestionTypeEnum.Text) {
			// Type guard to ensure we're using textConfigSchema
			const textConfig = config as z.infer<typeof textConfigSchema>;

			if (!textConfig.sampleAnswer || textConfig.sampleAnswer.trim().length === 0) {
				issues.push({
					code: 'custom',
					message: 'Примерният отговор е задължителен за текстови въпроси.',
					input: config,
					path: ['type']
				});
			}
		}

		if (type === QuestionTypeEnum.FileUpload) {
			// Type guard to ensure we're using fileUploadConfigSchema
			const fileConfig = config as z.infer<typeof fileUploadConfigSchema>;

			if (!fileConfig.allowedTypes || fileConfig.allowedTypes.length === 0) {
				issues.push({
					code: 'custom',
					message: 'Трябва да изберете поне един позволен тип файл.',
					input: config,
					path: ['type']
				});
			}

			if (!fileConfig.maxFileSizeMB || fileConfig.maxFileSizeMB <= 0) {
				issues.push({
					code: 'custom',
					message: 'Максималният размер на файла трябва да е по-голям от 0.',
					input: config,
					path: ['type']
				});
			}

			if (!fileConfig.maxFiles || fileConfig.maxFiles < 1) {
				issues.push({
					code: 'custom',
					message: 'Трябва да е позволен поне 1 файл.',
					input: config,
					path: ['type']
				});
			}
		}
	});

export const testInfoSchema = z.object({
	title: z.string().min(1, 'Заглавието е задължително.').trim(),

	allowedAttempts: z.int().nonnegative('Броят опити трябва да е 0 или повече.').default(0), // 0 = no limit
	timeLimitMin: z.int().nonnegative('Времето трябва да е 0 или повече.').default(0), // 0 = no limit

	description: z
		.string('Моля предоставете кратко описание.')
		.min(1, 'Описанието е задължително.')
		.max(500, 'Описанието не може да бъде по-дълго от 500 символа.')
		.trim(),

	isPaid: z.boolean().default(false),

	opensAt: z
		.date('Моля предоставете валидна дата и час за отваряне на теста.')
		.nullable()
		.default(null),
	closesAt: z
		.date('Моля предоставете валидна дата и час за затваряне на теста.')
		.nullable()
		.default(null),

	price: z.number().min(0, 'Цената не може да бъде отрицателна.').default(0),

	isFeatured: z.boolean().default(false),
	featuredOrder: z.number().min(0, 'Редът не може да бъде отрицателен.').default(0),

	publishedStatus: z.enum(PublishedStatusEnum).default(PublishedStatusEnum.draft),

	subjectId: z.int('Изберете предмет.').positive('Изберете предмет.'),
	classGradeId: z.int('Изберете клас.').positive('Изберете клас.'),

	questionsPerPage: z
		.int()
		.min(1, 'Не може да бъде по-малко от 1.')
		.max(20, 'Максимум 20 въпроса на страница.')
		.default(3)
});

export const createTestSchema = testInfoSchema.safeExtend({
	questions: z.array(questionSchema).min(1, 'Трябва да има поне един въпрос.')
});

export const updateTestSchema = testInfoSchema.safeExtend({
	questions: z
		.array(questionSchema.safeExtend({ id: z.string().optional().nullable() }))
		.min(1, 'Трябва да има поне един въпрос.')
});

export type CreateTestSchema = z.infer<typeof createTestSchema>;
export type UpdateTestSchema = z.infer<typeof updateTestSchema>;
