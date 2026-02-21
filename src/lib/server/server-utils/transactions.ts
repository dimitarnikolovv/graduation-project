import { generateId } from '$lib/utils/general';
import { eq } from 'drizzle-orm';
import { db, type Transaction as DBTransaction } from '../db';
import { transactions, type NewTransaction, type Transaction } from '../db/schema/transactions';

export const transactionIdPrefix = 'tr_';

/** * Generates a unique transaction ID.
 * The ID is prefixed with `tr_` and includes a random part and a timestamp encoded to base36 string.
 * @returns {string} The transaction ID.
 * @example
 * const transactionId = generateTransactionId();
 * console.log(transactionId); // Outputs something like 'tr_kiysegt4eiwotukmcrmbzmfe.me0fg4dk'
 */
export function generateTransactionId(): string {
	const randomPart = generateId();
	const timestampPart = Date.now().toString(36);
	const transactionId = `${transactionIdPrefix}${randomPart}.${timestampPart}`;

	return transactionId;
}

type CreateTransactionRecordProps = Omit<NewTransaction, 'id'> & {
	tx?: DBTransaction;
};

/**
 * Creates a new transaction in the database.
 * If an `externalId` is provided and a transaction with the same `externalId` already exists,
 * this function will return the existing transaction.
 * @param {Object} params - The parameters for the transaction.
 * @param {string} [params.externalId] - Optional external ID for the transaction.
 * @param {string} [params.externalProviderName] - Optional external provider name.
 * @param {string} [params.externalProviderId] - Optional external provider ID.
 * @param {number} [params.amountInCents] - The amount of the transaction in cents (e.g. 2345 for $23.45).
 * @param {string} params.reason - The reason for the transaction.
 * @param {string} params.email - The email associated with the transaction.
 * @param {string} params.phone - The phone number associated with the transaction.
 * @param {string} params.firstName - The first name of the person associated with the transaction.
 * @param {string} params.lastName - The last name of the person associated with the transaction.
 * @param {string} params.paymentMethod - The payment method used for the transaction.
 * @param {string} [params.last4] - The last 4 digits of the card used for the transaction (optional).
 * @param {string} [params.cardType] - The type of card used for the transaction (optional).
 * @returns {Promise<Transaction>} The created transaction.
 *
 * @example
 * const transaction = await createTransactionRecord({
 *   externalId: '12345',
 *   externalProviderName: 'Stripe',
 *   externalProviderId: 'IE3206488LH',
 *   amountInCents: 2345,
 *   reason: 'Payment for service',
 *   email: 'john.doe@example.com',
 *   phone: '123-456-7890',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   last4: '1234',
 *   cardType: 'Visa'
 * });
 */
export async function createTransactionRecord({
	tx,
	...rest
}: CreateTransactionRecordProps): Promise<Transaction> {
	const dbInstance = tx || db;

	const { externalId } = rest;

	const transactionId = generateTransactionId();

	// if a externalId is provided, check if a transaction with the same externalId already exists
	// if so, return the existing transaction
	// this is useful to prevent duplicates when for example a webhook fails and retries,
	// but the failed transaction is already processed
	if (externalId) {
		const existingTransaction = await dbInstance.query.transactions.findFirst({
			where: eq(transactions.externalId, externalId)
		});

		if (existingTransaction) {
			return existingTransaction;
		}
	}

	const [transaction] = await dbInstance
		.insert(transactions)
		.values({
			...rest,
			id: transactionId,
			externalId
		})
		.returning();

	return transaction;
}
