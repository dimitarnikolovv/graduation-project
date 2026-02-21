import { redirect } from '@sveltejs/kit';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { fetchPaginatedTestQuestions } from '$lib/server/db-querying/tests';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditTests)) {
		error(403, 'Отказан достъп.');
	}

	const { test } = await parent();

	const limit = test.questionsPerPage;

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const {
		results: questions,
		totalItems,
		totalPages
	} = await fetchPaginatedTestQuestions({
		testId: test.id,
		page,
		limit
	});

	return {
		test,
		questions,
		totalItems,
		totalPages,
		page,
		limit
	};
};
