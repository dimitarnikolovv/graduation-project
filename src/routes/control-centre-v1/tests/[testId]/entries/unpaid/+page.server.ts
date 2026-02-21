import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { isNull } from 'drizzle-orm';
import { paidTestEntries } from '$lib/server/db/schema/paidTestEntries';
import { fetchPaidTestEntries } from '$lib/server/db-querying/paidTestEntries';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
		return error(403, { message: 'Нямате нужните права за преглед на публични тестове.' });
	}

	const { test } = await parent();

	// Fetch entries with pagination
	const limit = parseInt(url.searchParams.get('limit') ?? '50');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const {
		results: entries,
		totalItems,
		totalPages
	} = await fetchPaidTestEntries({
		testId: test.id,
		page,
		limit,
		baseQuery: isNull(paidTestEntries.paidAt),
		searchParams: url.searchParams
	});

	return {
		entries,
		totalItems,
		page,
		limit,
		totalPages
	};
};
