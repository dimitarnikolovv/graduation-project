import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { paidEvents } from '$lib/server/db/schema/paidEvents';
import { desc, gte, lt } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const limit = parseInt(url.searchParams.get('limit') ?? '12');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const filter = url.searchParams.get('filter') ?? 'upcoming'; // 'upcoming', 'past', 'all'

	let whereClause;
	const now = new Date();

	if (filter === 'upcoming') {
		whereClause = gte(paidEvents.date, now);
	} else if (filter === 'past') {
		whereClause = lt(paidEvents.date, now);
	} else {
		// filter === 'all'
		whereClause = undefined;
	}

	const events = await db.query.paidEvents.findMany({
		where: whereClause,
		orderBy: [desc(paidEvents.date)],
		with: {
			posterFile: true
		},
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(paidEvents, whereClause);
	const totalPages = Math.ceil(totalItems / limit);

	return {
		events,
		totalItems,
		page,
		limit,
		totalPages,
		filter
	};
};
