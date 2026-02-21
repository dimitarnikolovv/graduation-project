import { and, desc, eq, gte, ilike, lte, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { publicEventEntries } from '../db/schema/publicEventEntries';
import type { PublicEvent } from '../db/schema/publicEvents';

/** Generates a query array based on the provided search parameters.
 * This function constructs an array of conditions to be used in a **drizzle orm** query.
 *
 * @param searchParams - The URLSearchParams object containing the search parameters.
 * @returns An array of conditions for the database query or undefined if no conditions are found.
 */
function generateQueryFromParams(searchParams: URLSearchParams) {
	const startDate = searchParams.get('startDate')?.trim();
	const endDate = searchParams.get('endDate')?.trim();
	const id = searchParams.get('id')?.trim();
	const name = searchParams.get('name')?.trim();
	const email = searchParams.get('email')?.trim();

	const query = [];

	if (startDate) query.push(gte(publicEventEntries.createdAt, new Date(startDate)));
	if (endDate && endDate !== startDate)
		query.push(lte(publicEventEntries.createdAt, new Date(endDate)));
	if (startDate && endDate && startDate === endDate)
		query.push(
			lte(
				publicEventEntries.createdAt,
				new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))
			)
		);
	if (id) query.push(eq(publicEventEntries.id, id));
	if (name) query.push(ilike(publicEventEntries.atendeeName, `%${name}%`));
	if (email) query.push(ilike(publicEventEntries.atendeeEmail, `%${email}%`));

	return query.length > 0 ? and(...query) : undefined;
}

type FetchPublicEventEntriesParams = {
	eventId: PublicEvent['id'];
	page: number;
	limit: number;
	baseQuery?: SQL; // This will be the base query (e.g., isNotNull(paidAt) or isNull(paidAt))
	searchParams?: URLSearchParams;
};

/** Fetches public event entries from the database based on the provided parameters.
 *
 * @param params - The parameters for fetching public event entries.
 * @returns An object containing the fetched entries, total items count, and total pages count.
 */
export async function fetchPublicEventEntries(params: FetchPublicEventEntriesParams) {
	const { eventId, page, limit, baseQuery, searchParams } = params;

	const query = and(
		generateQueryFromParams(searchParams || new URLSearchParams()), // Generate dynamic query conditions based on search parameters
		eq(publicEventEntries.eventId, eventId), // Ensure we are filtering by the correct event ID
		baseQuery // Include the base query condition (e.g., isNotNull(paidAt) for paid entries or isNull(paidAt) for unpaid entries)
	);

	const entries = await db.query.publicEventEntries.findMany({
		where: query,
		orderBy: [desc(publicEventEntries.createdAt)],
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(publicEventEntries, query);
	const totalPages = Math.ceil(totalItems / limit);

	return {
		results: entries,
		totalItems,
		totalPages
	};
}
