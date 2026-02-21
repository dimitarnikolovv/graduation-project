/**
 * Attempts Index Redirect
 *
 * Redirects to the pending attempts page by default.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	redirect(302, '/control-centre-v1/tests/attempts/pending');
};
