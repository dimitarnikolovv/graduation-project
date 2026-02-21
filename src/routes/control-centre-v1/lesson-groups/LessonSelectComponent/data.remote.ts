import { query } from '$app/server';
import { fetchExpandedLessons } from '$lib/server/db-querying/lessons';
import { z } from 'zod';

const getLessonsParamsSchema = z.object({
	page: z.int().min(1).default(1),
	limit: z.int().min(1).max(30).default(9),
	searchParams: z.instanceof(URLSearchParams).optional()
});

export const getLessons = query(getLessonsParamsSchema, async ({ page, limit, searchParams }) => {
	const { results: lessons, totalItems } = await fetchExpandedLessons({
		page,
		limit,
		searchParams
	});

	const totalPages = Math.ceil(totalItems / limit);

	return {
		lessons,
		totalItems,
		page,
		limit,
		totalPages
	};
});
