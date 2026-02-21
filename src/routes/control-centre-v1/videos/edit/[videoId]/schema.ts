import z from 'zod';

export const editVideoSchema = z
	.object({
		displayName: z
			.string({ error: 'Полето е задължително' })
			.min(2, { error: 'Минималната дължина е 2 символа' }),
		chaptersFile: z.file().optional(),
		posterFile: z.file().optional(),

		subjectId: z.int().positive().nullable().optional(),
		classGradeId: z.int().positive().nullable().optional()
	})
	.check(({ value, issues }) => {
		const { chaptersFile, posterFile } = value;
		if (chaptersFile) {
			if (chaptersFile.size > 2 * 1024 * 1024) {
				issues.push({
					code: 'custom',
					message: 'Файлът със сегменти не трябва да е по-голям от 2MB',
					input: chaptersFile
				});
			}

			if (!chaptersFile.name.endsWith('.vtt')) {
				issues.push({
					code: 'custom',
					message: 'Файлът със сегменти трябва да е с разширение .vtt',
					input: chaptersFile
				});
			}
		}

		if (posterFile) {
			if (posterFile.size > 4 * 1024 * 1024) {
				issues.push({
					code: 'custom',
					message: 'Постерът не трябва да е по-голям от 4MB',
					input: posterFile
				});
			}

			if (
				!posterFile.name.endsWith('.jpg') &&
				!posterFile.name.endsWith('.jpeg') &&
				!posterFile.name.endsWith('.png')
			) {
				issues.push({
					code: 'custom',
					message: 'Постерът трябва да е с разширение .jpg, .jpeg или .png',
					input: posterFile
				});
			}
		}
	});

export const deleteFileSchema = z.object({
	id: z.string().min(1)
});

export type EditVideoSchema = z.infer<typeof editVideoSchema>;
export type DeleteFileSchema = z.infer<typeof deleteFileSchema>;
