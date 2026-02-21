import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_HOST } from '$env/static/public';
import { publicEvents } from '$lib/server/db/schema/publicEvents';
import { gte, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const now = new Date();

	// Get upcoming events (limit to 6 for carousel)
	const upcomingPublicEvents = await db.query.publicEvents.findMany({
		where: gte(publicEvents.date, now),
		orderBy: [desc(publicEvents.date)],
		with: {
			posterFile: true
		},
		limit: 6
	});

	const upcomingPaidEvents = await db.query.paidEvents.findMany({
		where: gte(publicEvents.date, now),
		orderBy: [desc(publicEvents.date)],
		with: {
			posterFile: true
		},
		limit: 6
	});

	return {
		upcomingPublicEvents,
		upcomingPaidEvents
	};
};

export const actions: Actions = {
	acceptCookies: async ({ cookies }) => {
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180); // 6 months

		cookies.set('accept-cookies', 'true', {
			path: '/',
			domain: new URL(PUBLIC_HOST).hostname,
			expires: expiresAt
		});
	},

	declineCookies: async ({ cookies }) => {
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180); // 6 months

		cookies.set('accept-cookies', 'false', {
			path: '/',
			domain: new URL(PUBLIC_HOST).hostname,
			expires: expiresAt
		});
	}
};
