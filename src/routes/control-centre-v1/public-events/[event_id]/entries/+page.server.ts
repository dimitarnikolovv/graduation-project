import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { publicEvents } from '$lib/server/db/schema/publicEvents';
import { publicEventEntries } from '$lib/server/db/schema/publicEventEntries';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate } from 'sveltekit-superforms';
import { addEntrySchema } from './schema';
import { createPublicEventEntry } from '$lib/server/server-utils/events';
import { fetchPublicEventEntries } from '$lib/server/db-querying/publicEventEntries';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewEvents)) {
		return error(403, { message: 'Нямате нужните права за преглед на публични събития.' });
	}

	const { event } = await parent();

	const addEntryForm = await superValidate(zod4(addEntrySchema));

	// Fetch entries with pagination
	const limit = parseInt(url.searchParams.get('limit') ?? '50');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const {
		results: entries,
		totalItems,
		totalPages
	} = await fetchPublicEventEntries({
		eventId: event.id,
		page,
		limit,
		searchParams: url.searchParams
	});

	return {
		event,
		entries,
		totalItems,
		page,
		limit,
		totalPages,
		addEntryForm,
		userPermissions: locals.userPermissions
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
			// Check if entry already exists
			const existingEntry = await db.query.publicEventEntries.findFirst({
				where: and(
					eq(publicEventEntries.eventId, params.event_id),
					eq(publicEventEntries.atendeeEmail, form.data.atendeeEmail)
				)
			});

			if (existingEntry) {
				return fail(400, { form, message: 'Този имейл вече е записан за събитието.' });
			}

			const publicEvent = await db.query.publicEvents.findFirst({
				where: eq(publicEvents.id, params.event_id)
			});

			if (!publicEvent) {
				return fail(404, { form, message: 'Събитието не беше намерено.' });
			}

			await createPublicEventEntry({
				event: publicEvent,
				data: {
					atendeeEmail: form.data.atendeeEmail,
					atendeeName: form.data.atendeeName
				}
			});

			return { form, message: 'Участникът беше добавен успешно.' };
		} catch (err) {
			console.error('Error adding entry:', err);
			return fail(500, { form, message: 'Възникна грешка при добавянето на участника.' });
		}
	}
};
