import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fetchPublishedTestById } from '$lib/server/db-querying/tests';
import { checkIfUserHasAccessToTest, createPaidTestEntry } from '$lib/server/server-utils/tests';
import { db } from '$lib/server/db';
import { paidTestEntries } from '$lib/server/db/schema/paidTestEntries';
import { testQuestions } from '$lib/server/db/schema/tests';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { getTestAvailability } from '$lib/utils/tests';
import { createCheckoutSession } from '$lib/server/server-utils/checkout';

export const load: PageServerLoad = async (event) => {
	const { locals, params } = event;
	const foundTest = await fetchPublishedTestById(params.test_id);

	if (!foundTest) {
		error(404, `Тестът не беше намерен.`);
	}

	// Free tests: redirect to start (no purchase needed)
	if (!foundTest.isPaid) {
		redirect(302, `/tests/${foundTest.id}/start`);
	}

	const [questionsCountRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(testQuestions)
		.where(eq(testQuestions.testId, foundTest.id));
	const questionsCount = Number(questionsCountRow?.count ?? 0);
	const testAvailability = getTestAvailability(foundTest);

	if (!locals.user) {
		return { foundTest, questionsCount, testAvailability };
	}

	const isUserAllowedToTakeTest = await checkIfUserHasAccessToTest({
		userId: locals.user.id,
		testId: foundTest.id
	});

	if (isUserAllowedToTakeTest) {
		redirect(302, `/tests/${foundTest.id}/start`);
	}

	return {
		foundTest,
		questionsCount,
		testAvailability
	};
};

export const actions: Actions = {
	purchase: async (event) => {
		const { params, locals } = event;

		const user = locals.user;
		if (!user) {
			return fail(401, { message: 'Трябва да сте влезли в профила си, за да купите тест.' });
		}

		const foundTest = await fetchPublishedTestById(params.test_id);
		if (!foundTest || !foundTest.isPaid) {
			return fail(404, { message: 'Тестът не е наличен за покупка.' });
		}

		const hasAccess = await checkIfUserHasAccessToTest({
			userId: user.id,
			testId: foundTest.id
		});
		if (hasAccess) {
			redirect(303, `/tests/${foundTest.id}/start`);
		}

		let redirectUrl: string | undefined;

		try {
			// Remove any existing unpaid entry for this user and test
			await db
				.delete(paidTestEntries)
				.where(
					and(
						eq(paidTestEntries.testId, foundTest.id),
						eq(paidTestEntries.userId, user.id),
						isNull(paidTestEntries.paidAt)
					)
				);

			const { entry } = await createPaidTestEntry({
				userId: user.id,
				testId: foundTest.id
			});

			const checkoutData = await createCheckoutSession({
				body: {
					metadata: {
						pays_for: 'paid_test_entry',
						entry_id: entry.id
					},
					locale: 'bg',
					currency: 'EUR',
					mode: 'payment',
					ui_mode: 'hosted',
					success_url: `${event.url.origin}/tests/purchase/${foundTest.id}/success/${entry.id}`,
					cancel_url: `${event.url.origin}/tests/purchase/${foundTest.id}`,
					return_url: `${event.url.origin}/tests/purchase/${foundTest.id}`,
					client_customer_id: user.id,
					client_reference_id: entry.id,
					customer_email: user.email,
					description: `Тест: ${foundTest.title}`,
					saved_payment_method_options: { payment_method_save: 'enabled' },
					submit_type: 'pay',
					line_items: [
						{
							quantity: 1,

							price_data: {
								currency: 'EUR',
								product_data: {
									name: foundTest.title
								},
								type: 'one_time',
								unit_amount: foundTest.priceInCents
							}
						}
					],
					amount: foundTest.priceInCents
				},
				options: {
					idempotencyKey: `test:${foundTest.id}:entry:${entry.id}`
				}
			});

			await db
				.update(paidTestEntries)
				.set({
					externalCheckoutSessionId: checkoutData.id,
					externalCustomerId: checkoutData.customer
				})
				.where(eq(paidTestEntries.id, entry.id));

			redirectUrl = checkoutData.url;
		} catch (err) {
			console.error('Error purchasing test:', err);
			return fail(500, { message: 'Възникна грешка при покупката.' });
		}

		if (!redirectUrl) {
			return fail(500, { message: 'Възникна грешка при покупката.' });
		}

		return redirect(303, redirectUrl);
	}
};
