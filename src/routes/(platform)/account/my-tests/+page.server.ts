/**
 * My Tests Page Server
 *
 * Fetches paginated list of test attempts for the current user.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fetchUserAttempts } from '$lib/server/db-querying/attempts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const currentUser = locals.user;

	if (!currentUser) {
		redirect(302, '/login');
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '10');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const { results: attempts, totalItems, totalPages } = await fetchUserAttempts({
		userId: currentUser.id,
		page,
		limit
	});

	return {
		attempts,
		totalItems,
		totalPages,
		page,
		limit
	};
};

