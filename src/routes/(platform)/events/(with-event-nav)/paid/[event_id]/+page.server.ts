import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { registerForEventSchema } from './schema';
import { paidEvents } from '$lib/server/db/schema/paidEvents';
import { paidEventEntries } from '$lib/server/db/schema/paidEventEntries';
import { createPaidEventEntry } from '$lib/server/server-utils/events';
import { createCheckoutSession } from '$lib/server/server-utils/checkout';

export const load: PageServerLoad = async (event) => {
	const { params, parent } = event;

	const { paidEvent } = await parent();

	let isUserRegistered = false;

	if (event.locals.user) {
		const existingEntry = await db.query.paidEventEntries.findFirst({
			where: and(
				eq(paidEventEntries.eventId, params.event_id),
				eq(paidEventEntries.atendeeEmail, event.locals.user.email),
				eq(paidEventEntries.firstName, event.locals.user.firstName),
				eq(paidEventEntries.lastName, event.locals.user.lastName),
				isNotNull(paidEventEntries.paidAt)
			)
		});

		if (existingEntry) {
			isUserRegistered = true;
		}
	}

	// Count registered participants
	const participantsCount = await db.$count(
		paidEventEntries,
		eq(paidEventEntries.eventId, params.event_id)
	);

	const registerForm = await superValidate(zod4(registerForEventSchema));

	return {
		isUserRegistered,
		event: paidEvent,
		participantsCount,
		registerForm
	};
};

export const actions: Actions = {
	register: async (event) => {
		const { request, params, locals } = event;
		const form = await superValidate(request, zod4(registerForEventSchema));

		if (!form.valid) {
			return fail(400, { form, message: 'Невалидни данни.' });
		}

		let redirectUrl: string | undefined;

		try {
			// Check if the event accepts registrations
			// (E.g., if the event date is in the past, we do not want to allow registrations)
			const paidEvent = await db.query.paidEvents.findFirst({
				columns: {
					id: true,
					date: true,
					name: true,
					priceInCents: true
				},
				where: eq(paidEvents.id, params.event_id)
			});

			if (!paidEvent) {
				return fail(404, { form, message: 'Събитието не беше намерено.' });
			}

			if (new Date(paidEvent.date) < new Date()) {
				return fail(400, { form, message: 'Регистрацията за това събитие е затворена.' });
			}

			// Check if already registered
			const existingEntry = await db.query.paidEventEntries.findFirst({
				where: and(
					eq(paidEventEntries.eventId, params.event_id),
					eq(paidEventEntries.atendeeEmail, form.data.atendeeEmail),
					eq(paidEventEntries.firstName, form.data.firstName),
					eq(paidEventEntries.lastName, form.data.lastName),
					isNotNull(paidEventEntries.paidAt)
				)
			});

			if (existingEntry) {
				return fail(400, {
					form,
					message: 'Имате съществуваща регистрация с въведените данни за това събитие.'
				});
			}

			// Delete all unpaid entries for this user and event before creating a new one
			await db
				.delete(paidEventEntries)
				.where(
					and(
						eq(paidEventEntries.eventId, params.event_id),
						eq(paidEventEntries.atendeeEmail, form.data.atendeeEmail),
						isNull(paidEventEntries.paidAt)
					)
				);

			const { entry } = await createPaidEventEntry({
				eventId: paidEvent.id,
				...form.data
			});

			const checkoutData = await createCheckoutSession({
				body: {
					metadata: {
						pays_for: 'paid_event_entry',
						entry_id: entry.id
					},

					locale: 'bg',
					currency: 'EUR',
					mode: 'payment',
					ui_mode: 'hosted',
					success_url: `${event.url.origin}/events/paid/${paidEvent.id}/success/${entry.id}`,
					cancel_url: `${event.url.origin}/events/paid/${paidEvent.id}`,
					return_url: `${event.url.origin}/events/paid/${paidEvent.id}`,

					client_customer_id: locals.user?.id ?? form.data.atendeeEmail,
					client_reference_id: entry.id,

					customer_email: form.data.atendeeEmail,

					description: `Записване за събитие: ${paidEvent.name}`,

					saved_payment_method_options: {
						payment_method_save: 'enabled'
					},

					submit_type: 'pay',

					line_items: [
						{
							quantity: 1,
							price_data: {
								currency: 'EUR',
								product_data: {
									name: `Записване за: ${paidEvent.name}`
								},
								type: 'one_time',
								unit_amount: paidEvent.priceInCents // in cents
							}
						}
					],
					amount: paidEvent.priceInCents // in cents
				},
				options: {
					idempotencyKey: `event:${paidEvent.id}:entry:${entry.id}`
				}
			});

			await db
				.update(paidEventEntries)
				.set({
					externalCheckoutSessionId: checkoutData.id,
					externalCustomerId: checkoutData.customer
				})
				.where(eq(paidEventEntries.id, entry.id));

			redirectUrl = checkoutData.url;
		} catch (err) {
			console.error('Error registering for event:', err);
			return fail(500, { form, message: 'Възникна грешка при записването.' });
		}

		if (!redirectUrl) {
			return fail(500, { form, message: 'Възникна грешка при записването.' });
		}

		return redirect(303, redirectUrl);
	}
};
