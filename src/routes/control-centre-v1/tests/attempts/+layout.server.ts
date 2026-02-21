/**
 * Attempts Layout Server
 *
 * Handles authentication and permission checks for the attempts management section.
 * Only admins and teachers with appropriate permissions can access this area.
 * Also fetches the tests list for the filter dropdown.
 */

import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { db } from '$lib/server/db';
import { asc } from 'drizzle-orm';
import { tests } from '$lib/server/db/schema/tests';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Require admin or teacher role
	if (!checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher])) {
		redirect(302, '/login');
	}

	// Require ViewTests permission to access attempts
	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
		error(403, { message: 'Нямате нужните права за преглед на опити.' });
	}

	// Fetch all tests for the filter dropdown (only id and title)
	const allTests = await db.query.tests.findMany({
		columns: {
			id: true,
			title: true
		},
		orderBy: asc(tests.title)
	});

	return {
		tests: allTests
	};
};
