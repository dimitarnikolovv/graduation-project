import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { db } from '$lib/server/db';
import { desc } from 'drizzle-orm';
import { publicEvents } from '$lib/server/db/schema/publicEvents';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewEvents)) {
		return error(403, { message: 'Нямате нужните права за преглед на публични събития.' });
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	// Fetch public events with entry counts
	const events = await db.query.publicEvents.findMany({
		with: {
			posterFile: true,
			entries: {
				columns: {
					id: true
				}
			}
		},
		orderBy: [desc(publicEvents.date)],
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(publicEvents);
	const totalPages = Math.ceil(totalItems / limit);

	// Transform events to include entry count
	const eventsWithCount = events.map((event) => ({
		...event,
		entryCount: event.entries.length
	}));

	return {
		events: eventsWithCount,
		totalItems,
		page,
		limit,
		totalPages
	};
};
