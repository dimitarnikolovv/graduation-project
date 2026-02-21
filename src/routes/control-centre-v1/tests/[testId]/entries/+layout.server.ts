import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { addEntrySchema } from './schema';
import { paidTestEntries } from '$lib/server/db/schema/paidTestEntries';
import { countPaidTestEntries } from '$lib/server/db-querying/paidTestEntries';

export const load: LayoutServerLoad = async ({ locals, parent, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
		return error(403, { message: 'Нямате нужните права за преглед на тестове.' });
	}

	const { test } = await parent();

	try {
		const addEntryForm = await superValidate(zod4(addEntrySchema));

		const [paidEntriesCount, unpaidEntriesCount] = await Promise.all([
			await countPaidTestEntries({
				baseQuery: and(isNotNull(paidTestEntries.paidAt), eq(paidTestEntries.testId, test.id)),
				searchParams: url.searchParams
			}),
			await countPaidTestEntries({
				baseQuery: and(isNull(paidTestEntries.paidAt), eq(paidTestEntries.testId, test.id)),
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

		error(500, 'Възникна грешка при зареждането на записите за теста.');
	}
};
