import type { PaymentMethodEnum } from '$lib/types/enums';
import { and, desc, eq, getTableColumns, gte, ilike, lte, sql, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { paidTestEntries } from '../db/schema/paidTestEntries';
import { users } from '../db/schema/auth';
import type { Test } from '../db/schema/tests';

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

	if (startDate) query.push(gte(paidTestEntries.createdAt, new Date(startDate)));
	if (endDate && endDate !== startDate)
		query.push(lte(paidTestEntries.createdAt, new Date(endDate)));
	if (startDate && endDate && startDate === endDate)
		query.push(
			lte(
				paidTestEntries.createdAt,
				new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))
			)
		);
	if (id) query.push(eq(paidTestEntries.id, id));
	if (firstName) query.push(ilike(users.firstName, `%${firstName}%`));
	if (lastName) query.push(ilike(users.lastName, `%${lastName}%`));
	if (email) query.push(ilike(users.email, `%${email}%`));

	if (transactionId) query.push(eq(paidTestEntries.transactionId, transactionId));

	if (paymentMethod) query.push(eq(paidTestEntries.paymentMethod, paymentMethod));

	return query.length > 0 ? and(...query) : undefined;
}

type FetchPaidTestEntriesParams = {
	testId: Test['id'];
	page: number;
	limit: number;
	baseQuery?: SQL; // This will be the base query (e.g., isNotNull(paidAt) or isNull(paidAt))
	searchParams?: URLSearchParams;
};

/** Fetches paid test entries from the database based on the provided parameters.
 *
 * @param params - The parameters for fetching paid test entries.
 * @returns An object containing the fetched entries, total items count, and total pages count.
 */
export async function fetchPaidTestEntries(params: FetchPaidTestEntriesParams) {
	const { testId, page, limit, baseQuery, searchParams } = params;

	const query = and(
		generateQueryFromParams(searchParams || new URLSearchParams()), // Generate dynamic query conditions based on search parameters
		eq(paidTestEntries.testId, testId), // Ensure we are filtering by the correct test ID
		baseQuery // Include the base query condition (e.g., isNotNull(paidAt) for paid entries or isNull(paidAt) for unpaid entries)
	);

	const entries = await db
		.select({
			...getTableColumns(paidTestEntries),
			user: getTableColumns(users)
		})
		.from(paidTestEntries)
		.innerJoin(users, eq(paidTestEntries.userId, users.id))
		.where(query)
		.orderBy(desc(paidTestEntries.createdAt))
		.limit(limit)
		.offset((page - 1) * limit);

	const totalItems = await db
		.select({ count: sql<number>`count(*)` })
		.from(paidTestEntries)
		.innerJoin(users, eq(paidTestEntries.userId, users.id))
		.where(query)
		.then((res) => Number(res[0]?.count || 0));

	const totalPages = Math.ceil(totalItems / limit);

	return {
		results: entries,
		totalItems,
		totalPages
	};
}

export type FetchPaidTestEntriesResult = Awaited<ReturnType<typeof fetchPaidTestEntries>>;

type CountTestEventEntriesParams = {
	baseQuery?: SQL; // This will be the base query (e.g., isNotNull(paidAt) or isNull(paidAt))
	searchParams?: URLSearchParams;
};

export async function countPaidTestEntries(params: CountTestEventEntriesParams) {
	const { baseQuery, searchParams } = params;

	const query = and(
		generateQueryFromParams(searchParams || new URLSearchParams()), // Generate dynamic query conditions based on search parameters
		baseQuery // Include the base query condition (e.g., isNotNull(paidAt) for paid entries or isNull(paidAt) for unpaid entries)
	);

	const totalItems = await db
		.select({ count: sql<number>`count(*)` })
		.from(paidTestEntries)
		.innerJoin(users, eq(paidTestEntries.userId, users.id))
		.where(query)
		.then((res) => Number(res[0]?.count || 0));

	return totalItems;
}
