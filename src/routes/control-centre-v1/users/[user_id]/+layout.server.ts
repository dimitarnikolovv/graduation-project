import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserAndRole } from '$lib/server/auth';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema/auth';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewUsers)) {
		error(403, 'Отказан достъп. Нямате разрешение да преглеждате тази страница.');
	}

	const foundUser = await db.query.users.findFirst({
		columns: {
			passwordHash: false
		},
		where: and(eq(users.id, params.user_id))
	});

	if (!foundUser) {
		error(404, 'Потребителят не е намерен.');
	}

	return {
		foundUser
	};
};
