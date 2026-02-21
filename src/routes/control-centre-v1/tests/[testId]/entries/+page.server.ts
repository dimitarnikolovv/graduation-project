import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { db } from '$lib/server/db';
import { eq, and, isNotNull } from 'drizzle-orm';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { addEntrySchema } from './schema';
import { paidTestEntries } from '$lib/server/db/schema/paidTestEntries';
import { tests } from '$lib/server/db/schema/tests';
import { createPaidTestEntry } from '$lib/server/server-utils/tests';
import { fetchPaidTestEntries } from '$lib/server/db-querying/paidTestEntries';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
		return error(403, { message: 'Нямате нужните права за преглед на тестове.' });
	}

	const { test } = await parent();

	// Fetch entries with pagination
	const limit = parseInt(url.searchParams.get('limit') ?? '50');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const {
		results: entries,
		totalItems,
		totalPages
	} = await fetchPaidTestEntries({
		testId: test.id,
		page,
		limit,
		baseQuery: isNotNull(paidTestEntries.paidAt),
		searchParams: url.searchParams
	});

	return {
		entries,
		totalItems,
		page,
		limit,
		totalPages
	};
};

export const actions: Actions = {
	addEntry: async ({ request, locals, params }) => {
		const form = await superValidate(request, zod4(addEntrySchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditEvents)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидни данни.' });
		}

		try {
			// Check if paid entry already exists
			const existingEntry = await db.query.paidTestEntries.findFirst({
				where: and(
					eq(paidTestEntries.testId, params.testId),
					eq(paidTestEntries.userId, form.data.userId),
					isNotNull(paidTestEntries.paidAt)
				)
			});

			if (existingEntry) {
				return fail(400, { form, message: 'Този потребител вече е записан за теста.' });
			}

			const test = await db.query.tests.findFirst({
				where: eq(tests.id, params.testId),
				columns: {
					id: true
				}
			});

			if (!test) {
				return fail(404, { form, message: 'Тестът не беше намерен.' });
			}

			await createPaidTestEntry({
				testId: test.id,
				userId: form.data.userId,
				paymentMethod: form.data.paymentMethod
			});

			return { form, message: 'Участникът беше добавен успешно.' };
		} catch (err) {
			console.error('Error adding entry:', err);
			return fail(500, { form, message: 'Възникна грешка при добавянето на участника.' });
		}
	}
};
