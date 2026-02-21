import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { paidEvents } from '$lib/server/db/schema/paidEvents';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewEvents)) {
		error(403, 'Отказан достъп.');
	}

	const event = await db.query.paidEvents.findFirst({
		where: eq(paidEvents.id, params.event_id),
		with: {
			posterFile: true
		}
	});

	if (!event) {
		error(404, `Събитие с ID ${params.event_id} не беше намерено.`);
	}

	return {
		event
	};
};
