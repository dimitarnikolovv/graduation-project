import { checkIfUserAndRole } from '$lib/server/auth';
import { countAttemptsByStatus } from '$lib/server/db-querying/attempts';
import { RolesEnum } from '$lib/types/enums';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (
		!locals.user ||
		(locals.user && !checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher]))
	) {
		return redirect(302, '/login');
	}

	// SEO
	const title = `Административен панел | BRAAND`;

	const testAttemptsForGradingCount = await countAttemptsByStatus('pending');

	return { title, testAttemptsForGradingCount };
};
