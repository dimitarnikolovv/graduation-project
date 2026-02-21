import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { publicEvents } from '$lib/server/db/schema/publicEvents';
import { publicEventEntries } from '$lib/server/db/schema/publicEventEntries';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { registerForEventSchema } from './schema';
import { createPublicEventEntry } from '$lib/server/server-utils/events';

export const load: PageServerLoad = async (event) => {
	const { params } = event;

	const publicEvent = await db.query.publicEvents.findFirst({
		where: eq(publicEvents.id, params.event_id),
		with: {
			posterFile: true
		}
	});

	if (!publicEvent) {
		error(404, 'Събитието не беше намерено.');
	}

	let isUserRegistered = false;

	if (event.locals.user) {
		const existingEntry = await db.query.publicEventEntries.findFirst({
			where: and(
				eq(publicEventEntries.eventId, params.event_id),
				eq(publicEventEntries.atendeeEmail, event.locals.user.email)
			)
		});

		if (existingEntry) {
			isUserRegistered = true;
		}
	}

	// Count registered participants
	const participantsCount = await db.$count(
		publicEventEntries,
		eq(publicEventEntries.eventId, params.event_id)
	);

	const registerForm = await superValidate(zod4(registerForEventSchema));

	return {
		isUserRegistered,
		event: publicEvent,
		participantsCount,
		registerForm
	};
};

export const actions: Actions = {
	register: async (event) => {
		const { request, params, cookies } = event;
		const form = await superValidate(request, zod4(registerForEventSchema));

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидни данни.' });
		}

		try {
			// Check if the event accepts registrations
			// (E.g., if the event date is in the past, we do not want to allow registrations)
			const publicEvent = await db.query.publicEvents.findFirst({
				where: eq(publicEvents.id, params.event_id)
			});

			if (!publicEvent) {
				return fail(404, { form, message: 'Събитието не беше намерено.' });
			}

			if (new Date(publicEvent.date) < new Date()) {
				return fail(400, { form, message: 'Регистрацията за това събитие е затворена.' });
			}

			// Check if already registered
			const existingEntry = await db.query.publicEventEntries.findFirst({
				where: and(
					eq(publicEventEntries.eventId, params.event_id),
					eq(publicEventEntries.atendeeEmail, form.data.email)
				)
			});

			if (existingEntry) {
				return fail(400, { form, message: 'Този имейл вече е записан за събитието.' });
			}

			await createPublicEventEntry({
				event: publicEvent,
				data: {
					atendeeEmail: form.data.email,
					atendeeName: form.data.name
				}
			});

			return { form, message: 'Успешно се записахте за събитието!' };
		} catch (err) {
			console.error('Error registering for event:', err);
			return fail(500, { form, message: 'Възникна грешка при записването.' });
		}
	}
};
