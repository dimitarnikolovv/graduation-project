import { query } from '$app/server';
import { fetchExpandedVideos } from '$lib/server/db-querying/videos';
import { z } from 'zod';

const getVideosParamsSchema = z.object({
	page: z.int().min(1).default(1),
	limit: z.int().min(1).max(30).default(9),
	searchParams: z.instanceof(URLSearchParams).optional()
});

export const getVideos = query(getVideosParamsSchema, async ({ page, limit, searchParams }) => {
	const { results: videos, totalItems } = await fetchExpandedVideos({
		page,
		limit,
		searchParams
	});

	const totalPages = Math.ceil(totalItems / limit);

	return {
		videos,
		totalItems,
		page,
		limit,
		totalPages
	};
});
