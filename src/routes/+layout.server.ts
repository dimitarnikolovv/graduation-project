import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		areCookiesAccepted: locals.areCookiesAccepted,
		userPermissions: locals.userPermissions
	};
};
