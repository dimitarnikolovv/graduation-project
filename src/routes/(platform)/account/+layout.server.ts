import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Require authentication for account pages
	if (!locals.user) {
		redirect(302, '/login');
	}

	return {
		user: locals.user
	};
};
