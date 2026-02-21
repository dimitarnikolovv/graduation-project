/**
 * Pending Attempts Page Server
 *
 * Fetches paginated list of attempts awaiting grading.
 */

import type { PageServerLoad } from './$types';
import { fetchPaginatedAttempts } from '$lib/server/db-querying/attempts';

export const load: PageServerLoad = async ({ url }) => {
	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const { results: attempts, totalItems, totalPages } = await fetchPaginatedAttempts({
		page,
		limit,
		status: 'pending',
		searchParams: url.searchParams
	});

	return {
		attempts,
		totalItems,
		totalPages,
		page,
		limit
	};
};

