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
import { createPaidEventEntry } from '$lib/server/server-utils/events';
import { paidEventEntries } from '$lib/server/db/schema/paidEventEntries';
import { paidEvents } from '$lib/server/db/schema/paidEvents';
import { fetchPaidEventEntries } from '$lib/server/db-querying/paidEventEntries';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewEvents)) {
		return error(403, { message: 'Нямате нужните права за преглед на събития.' });
	}

	const { event } = await parent();

	// Fetch entries with pagination
	const limit = parseInt(url.searchParams.get('limit') ?? '50');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const {
		results: entries,
		totalItems,
		totalPages
	} = await fetchPaidEventEntries({
		eventId: event.id,
		page,
		limit,
		baseQuery: isNotNull(paidEventEntries.paidAt),
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
			const existingEntry = await db.query.paidEventEntries.findFirst({
				where: and(
					eq(paidEventEntries.eventId, params.event_id),
					eq(paidEventEntries.atendeeEmail, form.data.atendeeEmail),
					isNotNull(paidEventEntries.paidAt)
				)
			});

			if (existingEntry) {
				return fail(400, { form, message: 'Този имейл вече е записан за събитието.' });
			}

			const paidEvent = await db.query.paidEvents.findFirst({
				where: eq(paidEvents.id, params.event_id),
				columns: {
					id: true
				}
			});

			if (!paidEvent) {
				return fail(404, { form, message: 'Събитието не беше намерено.' });
			}

			await createPaidEventEntry({
				eventId: paidEvent.id,
				atendeeEmail: form.data.atendeeEmail,
				firstName: form.data.firstName,
				lastName: form.data.lastName,
				phone: form.data.phone,
				paymentMethod: form.data.paymentMethod
			});

			return { form, message: 'Участникът беше добавен успешно.' };
		} catch (err) {
			console.error('Error adding entry:', err);
			return fail(500, { form, message: 'Възникна грешка при добавянето на участника.' });
		}
	}
};
