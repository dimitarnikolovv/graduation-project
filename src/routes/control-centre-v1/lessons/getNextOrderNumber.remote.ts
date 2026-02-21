import { query } from '$app/server';
import { db } from '$lib/server/db';
import { lessons } from '$lib/server/db/schema/lessons';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const getNextOrderNumberParamsSchema = z.object({
	subjectId: z.int().positive(),
	classGradeId: z.int().positive(),
	lessonId: z.string().optional()
});

export const getNextOrderNumber = query(
	getNextOrderNumberParamsSchema,
	async ({ subjectId, classGradeId, lessonId }) => {
		const result = await db.query.lessons.findFirst({
			where: and(eq(lessons.subjectId, subjectId), eq(lessons.classGradeId, classGradeId)),
			orderBy: [desc(lessons.order)],
			columns: {
				id: true,
				order: true
			}
		});

		if (lessonId && result?.id === lessonId) {
			return result.order;
		}

		return result ? result.order + 1 : 1;
	}
);
