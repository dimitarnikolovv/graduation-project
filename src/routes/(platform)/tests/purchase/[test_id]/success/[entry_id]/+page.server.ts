import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { handleCheckoutComplete } from '$lib/server/server-utils/checkout';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		redirect(302, '/login');
	}

	const foundEntry = await db.query.paidTestEntries.findFirst({
		where: (t, { eq, and }) =>
			and(eq(t.id, params.entry_id), eq(t.testId, params.test_id), eq(t.userId, user.id)),
		with: { test: true }
	});

	if (!foundEntry) {
		error(404, 'Записът не беше намерен.');
	}

	// If the entry is already marked as paid, we can skip the verification step
	if (foundEntry.paidAt) {
		console.log('Paid test entry already marked as paid, no need to verify again.');
		return { test: foundEntry.test, entry: foundEntry };
	}

	// Do nothing for 5 seconds to allow for the payment provider to update the checkout session and our database record
	await new Promise((resolve) => setTimeout(resolve, 5000));

	// Check again if the entry is marked as paid after waiting, to avoid unnecessary API calls to the payment provider
	const refreshedEntry = await db.query.paidTestEntries.findFirst({
		where: (t, { eq }) => eq(t.id, params.entry_id),
		columns: { paidAt: true, externalCheckoutSessionId: true }
	});

	if (!refreshedEntry) {
		error(404, 'Записът не беше намерен при повторната проверка.');
	}

	if (refreshedEntry.paidAt) {
		console.log(
			'Paid test entry already marked as paid after waiting, no need to verify with payment provider.'
		);
		return { test: foundEntry.test, entry: refreshedEntry };
	}

	if (!refreshedEntry.externalCheckoutSessionId) {
		error(500, 'Липсва информация за плащането.');
	}

	try {
		const checkOutId = refreshedEntry.externalCheckoutSessionId;

		console.log(`Processing checkout_session after redirect for checkout ID: ${checkOutId}`);

		await handleCheckoutComplete({ sessionId: checkOutId });

		const updatedEntry = await db.query.paidTestEntries.findFirst({
			where: (t, { eq }) => eq(t.id, params.entry_id)
		});

		return { test: foundEntry.test, entry: updatedEntry ?? foundEntry };
	} catch (err) {
		console.error('Test purchase success verification:', err);
		error(500, 'Възникна грешка при потвърждението на плащането.');
	}
};
