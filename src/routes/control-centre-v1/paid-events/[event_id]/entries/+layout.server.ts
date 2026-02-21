import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { isNotNull, isNull } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { addEntrySchema } from './schema';
import { paidEventEntries } from '$lib/server/db/schema/paidEventEntries';
import { countPaidEventEntries } from '$lib/server/db-querying/paidEventEntries';

export const load: LayoutServerLoad = async ({ locals, parent, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewEvents)) {
		return error(403, { message: 'Нямате нужните права за преглед на събития.' });
	}

	const { event } = await parent();

	try {
		const addEntryForm = await superValidate(zod4(addEntrySchema));

		const [paidEntriesCount, unpaidEntriesCount] = await Promise.all([
			await countPaidEventEntries({
				eventId: event.id,
				baseQuery: isNotNull(paidEventEntries.paidAt),
				searchParams: url.searchParams
			}),
			await countPaidEventEntries({
				eventId: event.id,
				baseQuery: isNull(paidEventEntries.paidAt),
				searchParams: url.searchParams
			})
		]);

		return {
			addEntryForm,
			paidEntriesCount,
			unpaidEntriesCount
		};
	} catch (err) {
		console.log(err);

		error(500, 'Възникна грешка при зареждането на събитието.');
	}
};
