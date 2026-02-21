import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { getAllTransactions } from '$lib/server/db-querying/transactions';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTransactions)) {
		error(403, 'Access denied. You do not have permission to view this page.');
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	try {
		const { transactions, totalItems } = await getAllTransactions(limit, page, url.searchParams);

		return {
			transactions,
			totalItems,
			limit,
			page
		};
	} catch (err) {
		console.log(err);
		return error(500, 'Internal Server Error');
	}
};
