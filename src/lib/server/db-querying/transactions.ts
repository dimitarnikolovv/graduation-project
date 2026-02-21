import { and, asc, desc, eq, gte, ilike, lte, or, SQL } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';
import { transactions } from '../db/schema/transactions';
import { db } from '../db';
import { TransactionsReportFilters } from '$lib/types/enums';

function generateQueryFromParams(searchParams: URLSearchParams) {
	const startDate = searchParams.get('startDate')?.trim();
	const endDate = searchParams.get('endDate')?.trim();
	const email = searchParams.get('email')?.trim();
	const name = searchParams.get('name')?.trim();
	const internalId = searchParams.get('internalId')?.trim();
	const externalId = searchParams.get('externalId')?.trim();
	const orderId = searchParams.get('orderId')?.trim();

	const query = [];

	if (name)
		query.push(
			or(ilike(transactions.firstName, `%${name}%`), ilike(transactions.lastName, `%${name}%`))
		);
	if (startDate) query.push(gte(transactions.createdAt, startOfDay(new Date(startDate))));
	if (endDate && endDate !== startDate)
		query.push(lte(transactions.createdAt, endOfDay(new Date(endDate))));
	if (startDate && endDate && startDate === endDate)
		query.push(
			and(
				gte(transactions.createdAt, startOfDay(new Date(startDate))),
				lte(transactions.createdAt, endOfDay(new Date(endDate)))
			)
		);
	if (email) query.push(ilike(transactions.email, `%${email}%`));
	if (internalId) query.push(eq(transactions.id, internalId));
	if (externalId) query.push(eq(transactions.externalId, externalId));
	if (orderId) query.push(eq(transactions.orderId, parseInt(orderId)));

	return query.length > 0 ? and(...query) : undefined;
}

export async function getTransactionById(transactionId: string) {
	const transaction = await db.query.transactions.findFirst({
		where: eq(transactions.id, transactionId)
	});

	return transaction;
}

export type ExpandedTransaction = Awaited<ReturnType<typeof getTransactionById>>;

export async function getAllTransactions(
	limit: number,
	page: number,
	searchParams?: URLSearchParams
) {
	const query = generateQueryFromParams(searchParams ?? new URLSearchParams());

	const orderByAscArray = searchParams
		? Array.from(Object.values(TransactionsReportFilters)).filter((filter) =>
				searchParams.getAll('asc').includes(filter)
			)
		: [];

	const orderByDescArray = searchParams
		? Array.from(Object.values(TransactionsReportFilters)).filter((filter) =>
				searchParams.getAll('desc').includes(filter)
			)
		: [];

	const orderBy = [...orderByAscArray, ...orderByDescArray]
		.map((column) => {
			if (orderByAscArray.includes(column)) {
				return asc(transactions[TransactionsReportFilters[column]]);
			} else if (orderByDescArray.includes(column)) {
				return desc(transactions[TransactionsReportFilters[column]]);
			}
			return undefined;
		})
		.filter(Boolean) as SQL[];

	const foundTransactions = await db.query.transactions.findMany({
		where: query,
		limit,
		offset: (page - 1) * limit,
		orderBy: orderBy && orderBy.length ? orderBy : desc(transactions.createdAt)
	});

	const totalItems = await db.$count(transactions, query);

	return { transactions: foundTransactions, totalItems };
}

export type AllExpandedTransactions = Awaited<ReturnType<typeof getAllTransactions>>;
