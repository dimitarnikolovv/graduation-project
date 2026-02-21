import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { handleCheckoutComplete } from '$lib/server/server-utils/checkout';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { paidEvent } = await parent();

	const foundEntry = await db.query.paidEventEntries.findFirst({
		where: (t, { eq }) => eq(t.id, params.entry_id),
		columns: {
			id: true,
			paidAt: true,
			externalCheckoutSessionId: true
		}
	});

	if (!foundEntry) {
		error(404, 'Записът не беше намерен.');
	}

	if (foundEntry.paidAt) {
		console.log('Paid event entry already marked as paid, no need to verify again.');
		return {
			paidEvent,
			entry: foundEntry
		};
	}

	// Do nothing for 5 seconds to allow for the payment provider to update the checkout session and our database record
	await new Promise((resolve) => setTimeout(resolve, 5000));

	// Check again if the entry is marked as paid after waiting, to avoid unnecessary API calls to the payment provider
	const refreshedEntry = await db.query.paidEventEntries.findFirst({
		where: (t, { eq }) => eq(t.id, params.entry_id),
		columns: {
			id: true,
			paidAt: true,
			externalCheckoutSessionId: true
		}
	});

	if (!refreshedEntry) {
		error(404, 'Записът не беше намерен при повторната проверка.');
	}

	if (refreshedEntry.paidAt) {
		console.log(
			'Paid event entry already marked as paid after waiting, no need to verify with payment provider.'
		);
		return { paidEvent, entry: refreshedEntry };
	}

	if (!refreshedEntry.externalCheckoutSessionId) {
		error(500, 'Липсва информация за плащането.');
	}

	try {
		const checkOutId = refreshedEntry.externalCheckoutSessionId;

		console.log(`Processing checkout_session after redirect for checkout ID: ${checkOutId}`);

		await handleCheckoutComplete({ sessionId: checkOutId });

		const updatedEntry = await db.query.paidEventEntries.findFirst({
			where: (t, { eq }) => eq(t.id, params.entry_id),
			columns: {
				id: true,
				paidAt: true,
				externalCheckoutSessionId: true
			}
		});

		if (!updatedEntry) {
			error(404, 'Записът не беше намерен след обработката на плащането.');
		}

		return {
			paidEvent,
			entry: updatedEntry ?? foundEntry
		};
	} catch (err) {
		console.log(err);
		error(500, 'Възникна грешка при зареждането на плащането.');
	}
};
