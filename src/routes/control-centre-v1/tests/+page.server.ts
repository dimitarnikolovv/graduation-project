import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';

import { fetchExpandedTests } from '$lib/server/db-querying/tests';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
		return error(403, { message: 'Нямате нужните права за преглед на тестове.' });
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const {
		results: tests,
		totalItems,
		totalPages
	} = await fetchExpandedTests({
		page,
		limit,
		searchParams: url.searchParams
	});

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	return {
		tests,
		totalItems,
		page,
		limit,
		totalPages,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};
