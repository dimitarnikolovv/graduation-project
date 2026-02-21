import { index, integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../column-helpers';
import { paymentMethodEnum } from './enums';
import { PaymentMethodEnum } from '../../../types/enums';

// Transactions Table
export const transactions = pgTable(
	'transactions',
	{
		...timestamps,
		id: text('id').primaryKey(),
		orderId: serial('order_id').notNull().unique(),
		externalId: text('external_id').notNull().unique(),

		/**
		 * The total amount of the transaction, before any discounts, in cents
		 *
		 * The amount is stored as an integer number representing the cost in the platform's currency.
		 *
		 * @example 1999 // represents 19.99 in the currency
		 */
		amountInCents: integer('amount_in_cents').notNull(),

		// Payment details
		reason: text('reason').notNull(),
		last4: varchar('last4', { length: 4 }),
		cardType: varchar('card_type', { length: 255 }),
		paymentMethod: paymentMethodEnum('payment_method')
			.notNull()
			.$type<PaymentMethodEnum>()
			.default(PaymentMethodEnum.card),

		// Customer details
		email: varchar('email', { length: 255 }).notNull(),
		phone: varchar('phone', { length: 255 }),
		firstName: varchar('first_name', { length: 255 }).notNull(),
		lastName: varchar('last_name', { length: 255 }).notNull()
	},
	(table) => {
		return [
			index('transactions_external_id_idx').on(table.externalId),
			index('transactions_email_idx').on(table.email),
			index('transactions_phone_idx').on(table.phone),
			index('transactions_created_at_idx').on(table.createdAt),
			index('transactions_deleted_at_idx').on(table.deletedAt)
		];
	}
);

export type Transaction = typeof transactions.$inferSelect;

export type NewTransaction = typeof transactions.$inferInsert;
