import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { fetchTestById } from '$lib/server/db-querying/tests';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditTests)) {
		error(403, 'Отказан достъп.');
	}

	const test = await fetchTestById(params.testId);

	if (!test) {
		error(404, `Тест с ID ${params.testId} не беше намерен.`);
	}

	return {
		test
	};
};
