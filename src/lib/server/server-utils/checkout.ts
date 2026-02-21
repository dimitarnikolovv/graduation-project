import { PRIVATE_PAYPERCUT_API_KEY_SECRET } from '$env/static/private';
import { PUBLIC_PAYPERCUT_API_BASE_URL } from '$env/static/public';
import { error } from '@sveltejs/kit';
import { db } from '../db';
import { updatePaidEventEntryAsPaid } from './events';
import { updatePaidTestEntryAsPaid } from './tests';
import { createTransactionRecord } from './transactions';

type CheckoutMetadata =
	| {
			pays_for: 'paid_event_entry' | 'paid_test_entry';
			entry_id?: string;
	  }
	| {
			pays_for: 'payment_link';
			payment_id?: string;
	  };

type CheckoutSessionBody = {
	currency: string;
	mode: 'payment' | 'setup' | 'subscription';
	amount: number;
	billing_address_collection?: 'required' | 'auto';
	cancel_url?: string;
	client_customer_id?: string;
	client_reference_id?: string;
	customer?: string | null;
	customer_email?: string | null;
	description?: string;
	expires_at?: string | null;
	line_items?: {
		quantity: number;
		metadata?: Record<string, string>;
		price_data?: {
			active?: boolean;
			billing_scheme?: 'per_unit' | 'tiered';
			currency?: string;
			created?: number;
			id?: string;
			livemode?: boolean;
			lookup_key?: string | null;
			product?: string;
			product_data?: {
				name: string;
				active?: boolean;
				description?: string;
				id?: string;
				unit_label?: string;
			};
			type?: 'one_time' | 'recurring';
			unit_amount?: number;
			unit_amount_decimal?: string;
		};
	}[];
	locale: string;
	metadata?: CheckoutMetadata;
	return_url?: string;
	saved_payment_method_options?: {
		payment_method_save: 'enabled' | 'disabled';
	};
	submit_type: 'auto' | 'book' | 'donate' | 'pay' | 'subscribe';
	success_url: string;
	ui_mode: 'custom' | 'embedded' | 'hosted';
	wallet_options?: {
		apple_pay?: {
			display: 'auto' | 'never';
		};
		google_pay?: {
			display: 'auto' | 'never';
		};
	};
};

type CreateCheckoutSessionParams = {
	body: CheckoutSessionBody;
	options: {
		idempotencyKey: string;
	};
};
/**
 * Creates a checkout session in the payment provider system.
 *
 * @param body The body of the checkout session creation request.
 * @param options Additional options for creating the checkout session, such as idempotency key.
 * @returns The created checkout session, including its ID and URL.
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
	const { body, options } = params;

	const checkoutEndpoint = new URL('/v1/checkouts', PUBLIC_PAYPERCUT_API_BASE_URL);

	const res = await fetch(checkoutEndpoint, {
		headers: new Headers({
			'Idempotency-Key': options.idempotencyKey,
			'Content-Type': 'application/json',
			Authorization: `Bearer ${PRIVATE_PAYPERCUT_API_KEY_SECRET}`
		}),
		method: 'POST',
		body: JSON.stringify(body)
	});

	const checkoutData = await res.json();

	if (!res.ok) {
		console.error('Error creating checkout:', checkoutData);
		throw Error('Failed to create checkout session: ' + JSON.stringify(checkoutData), {
			cause: res.status
		});
	}

	if (!checkoutData.id) {
		console.error('No checkout ID returned:', checkoutData);
		throw Error('Failed to create checkout session: No checkout ID returned', {
			cause: 500
		});
	}

	if (!checkoutData.url) {
		console.error('No checkout URL returned:', checkoutData);
		throw Error('Failed to create checkout session: No checkout URL returned', {
			cause: 500
		});
	}

	return {
		id: checkoutData.id as string,
		url: checkoutData.url as string,
		customer: checkoutData.customer as string | null
	};
}

type HandleCheckoutCompleteProps = {
	sessionId: string;
};
export async function handleCheckoutComplete(props: HandleCheckoutCompleteProps) {
	const { sessionId } = props;

	console.log(`Processing checkout_session.completed for checkout ID: ${sessionId}`);

	const checkoutsEndPoint = new URL(PUBLIC_PAYPERCUT_API_BASE_URL + `/v1/checkouts/${sessionId}`);
	checkoutsEndPoint.searchParams.append('expand', 'payment_intent');
	checkoutsEndPoint.searchParams.append('expand', 'customer');

	const checkoutRes = await fetch(checkoutsEndPoint, {
		headers: new Headers({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${PRIVATE_PAYPERCUT_API_KEY_SECRET}`
		}),
		method: 'GET'
	});

	if (!checkoutRes.ok) {
		console.error(
			`Failed to retrieve checkout details for checkout ID: ${sessionId}, status: ${checkoutRes.status}`
		);
		error(500, 'Failed to retrieve checkout details');
	}

	const checkoutData = await checkoutRes.json();

	if (checkoutData.status !== 'complete') {
		console.log(
			`Checkout status is not completed for checkout ID: ${sessionId}, status: ${checkoutData.status}`
		);
		return;
	}

	console.log('CHECKOUT DATA: ');
	console.dir(checkoutData, { depth: null });

	const latestPaymentId = checkoutData.payment_intent.latest_payment;

	const paymentEndPoint = new URL(
		PUBLIC_PAYPERCUT_API_BASE_URL + `/v2/payments/${latestPaymentId}`
	);

	const paymentRes = await fetch(paymentEndPoint, {
		headers: new Headers({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${PRIVATE_PAYPERCUT_API_KEY_SECRET}`
		}),
		method: 'GET'
	});

	if (!paymentRes.ok) {
		console.error(
			`Failed to retrieve payment details for payment ID: ${latestPaymentId}, status: ${paymentRes.status}`
		);
		error(500, 'Failed to retrieve payment details');
	}

	const paymentData = await paymentRes.json();

	console.log('PAYMENT DATA: ');
	console.dir(paymentData, { depth: null });

	const amountInCents = paymentData.amount;
	const customerEmail = checkoutData.customer_email || checkoutData.customer?.email;
	const externalTransactionId = latestPaymentId;
	const last4 = paymentData.payment_method_details.card.last4;
	const cardType = paymentData.payment_method_details.card.brand;

	const metadata: CheckoutMetadata = checkoutData.metadata;

	// Process based on metadata
	// handle paid event entry
	if (metadata.pays_for === 'paid_event_entry') {
		const entryId = metadata.entry_id;
		if (!entryId) {
			console.error('No entry_id found in metadata for paid_event_entry');
			error(400, 'Invalid metadata');
		}

		await handlePaidEventEntrySuccessfulPayment({
			entryId: entryId,
			amountInCents,
			customerEmail,
			externalTransactionId,
			last4,
			cardType,
			reason: checkoutData?.description
		});
	}

	// handle paid test entry
	if (metadata.pays_for === 'paid_test_entry') {
		const entryId = metadata.entry_id;
		if (!entryId) {
			console.error('No entry_id found in metadata for paid_test_entry');
			error(400, 'Invalid metadata');
		}

		await handlePaidTestEntrySuccessfulPayment({
			entryId,
			amountInCents,
			customerEmail,
			externalTransactionId,
			last4,
			cardType,
			reason: checkoutData?.description
		});
	}
}

type HandlePaidEventEntrySuccessfulPaymentProps = {
	entryId: string;
	amountInCents: number;
	customerEmail: string;
	last4: string;
	cardType: string;
	reason?: string;
	externalTransactionId: string;
};

export async function handlePaidEventEntrySuccessfulPayment(
	props: HandlePaidEventEntrySuccessfulPaymentProps
) {
	const { entryId, amountInCents, customerEmail, last4, cardType, reason, externalTransactionId } =
		props;

	const entry = await db.query.paidEventEntries.findFirst({
		where: (t, { eq }) => eq(t.id, entryId),

		with: {
			event: true
		}
	});

	if (!entry) {
		console.error('No paid event entry found for ID:', entryId);
		error(400, 'Invalid paid event entry ID');
	}

	if (entry.paidAt) {
		console.log('Paid event entry already marked as paid for ID:', entryId);
		return;
	}

	console.log(`Marking paid event entry ${entryId} as paid.`);

	await db.transaction(async (tx) => {
		const transaction = await createTransactionRecord({
			tx: tx,
			externalId: externalTransactionId,
			amountInCents: amountInCents,
			email: customerEmail ?? entry.atendeeEmail,
			firstName: entry.firstName,
			lastName: entry.lastName,
			last4,
			cardType,
			reason: reason || 'Paid Event Entry'
		});

		await updatePaidEventEntryAsPaid({
			entryId,
			transactionId: transaction.id,
			tx
		});
	});
}

type HandlePaidTestEntrySuccessfulPaymentProps = {
	entryId: string;
	amountInCents: number;
	customerEmail: string;
	last4: string;
	cardType: string;
	reason?: string;
	externalTransactionId: string;
};

export async function handlePaidTestEntrySuccessfulPayment(
	props: HandlePaidTestEntrySuccessfulPaymentProps
) {
	const { entryId, amountInCents, customerEmail, last4, cardType, reason, externalTransactionId } =
		props;

	const entry = await db.query.paidTestEntries.findFirst({
		where: (t, { eq }) => eq(t.id, entryId),
		with: {
			user: true,
			test: true
		}
	});

	if (!entry) {
		console.error('No paid test entry found for ID:', entryId);
		error(400, 'Invalid paid test entry ID');
	}

	if (entry.paidAt) {
		console.log('Paid test entry already marked as paid for ID:', entryId);
		return;
	}

	const user = entry.user;
	if (!user) {
		console.error('No user found for paid test entry:', entryId);
		error(400, 'Invalid paid test entry');
	}

	console.log(`Marking paid test entry ${entryId} as paid.`);

	await db.transaction(async (tx) => {
		const transaction = await createTransactionRecord({
			tx,
			externalId: externalTransactionId,
			amountInCents,
			email: customerEmail ?? entry.user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			last4,
			cardType,
			reason: reason || `Тест: ${entry.test?.title ?? entry.testId}`
		});

		await updatePaidTestEntryAsPaid({
			entryId,
			transactionId: transaction.id,
			tx
		});
	});
}
