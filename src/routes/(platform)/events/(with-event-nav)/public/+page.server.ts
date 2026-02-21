import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { publicEvents } from '$lib/server/db/schema/publicEvents';
import { desc, gte, lt } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const limit = parseInt(url.searchParams.get('limit') ?? '12');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const filter = url.searchParams.get('filter') ?? 'upcoming'; // 'upcoming', 'past', 'all'

	let whereClause;
	const now = new Date();

	if (filter === 'upcoming') {
		whereClause = gte(publicEvents.date, now);
	} else if (filter === 'past') {
		whereClause = lt(publicEvents.date, now);
	} else {
		// filter === 'all'
		whereClause = undefined;
	}

	const events = await db.query.publicEvents.findMany({
		where: whereClause,
		orderBy: [desc(publicEvents.date)],
		with: {
			posterFile: true
		},
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(publicEvents, whereClause);
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
