import { query } from '$app/server';
import { fetchExpandedTests } from '$lib/server/db-querying/tests';
import { z } from 'zod';

const getTestsParamsSchema = z.object({
	page: z.int().min(1).default(1),
	limit: z.int().min(1).max(30).default(9),
	searchParams: z.instanceof(URLSearchParams).optional()
});

export const getTests = query(getTestsParamsSchema, async ({ page, limit, searchParams }) => {
	const { results: tests, totalItems } = await fetchExpandedTests({
		page,
		limit,
		searchParams
	});

	const totalPages = Math.ceil(totalItems / limit);

	return {
		tests,
		totalItems,
		page,
		limit,
		totalPages
	};
});
