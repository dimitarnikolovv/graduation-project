import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ params }) => {
	const paidEvent = await db.query.paidEvents.findFirst({
		where: (t, { eq }) => eq(t.id, params.event_id),
		with: {
			posterFile: true
		}
	});

	if (!paidEvent) {
		error(404, 'Събитието не беше намерено.');
	}

	return {
		paidEvent
	};
};
