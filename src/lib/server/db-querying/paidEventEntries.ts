import type { PaymentMethodEnum } from '$lib/types/enums';
import { and, desc, eq, gte, ilike, lte, type SQL } from 'drizzle-orm';
import { paidEventEntries } from '../db/schema/paidEventEntries';
import type { PaidEvent } from '../db/schema/paidEvents';
import { db } from '../db';

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
	const firstName = searchParams.get('firstName')?.trim();
	const lastName = searchParams.get('lastName')?.trim();
	const email = searchParams.get('email')?.trim();
	const transactionId = searchParams.get('transactionId')?.trim();
	const paymentMethod = searchParams.get('paymentMethod')?.trim() as PaymentMethodEnum | undefined;

	const query = [];

	if (startDate) query.push(gte(paidEventEntries.createdAt, new Date(startDate)));
	if (endDate && endDate !== startDate)
		query.push(lte(paidEventEntries.createdAt, new Date(endDate)));
	if (startDate && endDate && startDate === endDate)
		query.push(
			lte(
				paidEventEntries.createdAt,
				new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))
			)
		);
	if (id) query.push(eq(paidEventEntries.id, id));
	if (firstName) query.push(ilike(paidEventEntries.firstName, `%${firstName}%`));
	if (lastName) query.push(ilike(paidEventEntries.lastName, `%${lastName}%`));
	if (email) query.push(ilike(paidEventEntries.atendeeEmail, `%${email}%`));

	if (transactionId) query.push(eq(paidEventEntries.transactionId, transactionId));

	if (paymentMethod) query.push(eq(paidEventEntries.paymentMethod, paymentMethod));

	return query.length > 0 ? and(...query) : undefined;
}

type FetchPaidEventEntriesParams = {
	eventId: PaidEvent['id'];
	page: number;
	limit: number;
	baseQuery?: SQL; // This will be the base query (e.g., isNotNull(paidAt) or isNull(paidAt))
	searchParams?: URLSearchParams;
};

/** Fetches paid event entries from the database based on the provided parameters.
 *
 * @param params - The parameters for fetching paid event entries.
 * @returns An object containing the fetched entries, total items count, and total pages count.
 */
export async function fetchPaidEventEntries(params: FetchPaidEventEntriesParams) {
	const { eventId, page, limit, baseQuery, searchParams } = params;

	const query = and(
		generateQueryFromParams(searchParams || new URLSearchParams()), // Generate dynamic query conditions based on search parameters
		eq(paidEventEntries.eventId, eventId), // Ensure we are filtering by the correct event ID
		baseQuery // Include the base query condition (e.g., isNotNull(paidAt) for paid entries or isNull(paidAt) for unpaid entries)
	);

	const entries = await db.query.paidEventEntries.findMany({
		where: query,
		orderBy: [desc(paidEventEntries.createdAt)],
		limit,
		offset: (page - 1) * limit
	});

	const totalItems = await db.$count(paidEventEntries, query);
	const totalPages = Math.ceil(totalItems / limit);

	return {
		results: entries,
		totalItems,
		totalPages
	};
}

type CountPaidEventEntriesParams = {
	eventId: PaidEvent['id'];
	baseQuery?: SQL; // This will be the base query (e.g., isNotNull(paidAt) or isNull(paidAt))
	searchParams?: URLSearchParams;
};

export async function countPaidEventEntries(params: CountPaidEventEntriesParams) {
	const { eventId, baseQuery, searchParams } = params;

	const query = and(
		generateQueryFromParams(searchParams || new URLSearchParams()), // Generate dynamic query conditions based on search parameters
		eq(paidEventEntries.eventId, eventId), // Ensure we are filtering by the correct event ID
		baseQuery // Include the base query condition (e.g., isNotNull(paidAt) for paid entries or isNull(paidAt) for unpaid entries)
	);

	const totalItems = await db.$count(paidEventEntries, query);

	return totalItems;
}
