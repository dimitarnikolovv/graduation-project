import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { fetchExpandedComments } from '$lib/server/db-querying/lessonComments';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewComments)) {
		return error(403, { message: 'Нямате нужните права за преглед на коментари.' });
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const {
		results: comments,
		totalItems,
		totalPages
	} = await fetchExpandedComments({
		page,
		limit,
		searchParams: url.searchParams
	});

	return {
		comments,
		totalItems,
		page,
		limit,
		totalPages
	};
};
