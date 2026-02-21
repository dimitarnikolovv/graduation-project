import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleCheckoutComplete } from '$lib/server/server-utils/checkout';

export const POST: RequestHandler = async (event) => {
	// console.dir(event, { depth: null });

	const body = await event.request.json();

	console.log('Headers: ');
	console.dir(event.request.headers, { depth: null });

	console.log('Body: ');
	console.dir(body, { depth: null });

	const eventType: string = body.type;

	try {
		if (eventType === 'checkout_session.completed' && body.data.object.payment_status === 'paid') {
			await handleCheckoutComplete({ sessionId: body.id });
		}
	} catch (err: any) {
		if (err instanceof Error) {
			console.error('Error handling webhook:', err.message);
			return json({ message: 'Error handling webhook: ' + err.message }, { status: 500 });
		} else {
			console.error('Unknown error handling webhook');
			return json(
				{ message: err?.message || 'Unknown error handling webhook' },
				{ status: err?.status || 500 }
			);
		}
	}

	return json({ message: 'Unhandled event type' });
};
