import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../column-helpers';
import { isNotNull, relations } from 'drizzle-orm';
import { transactions } from './transactions';
import { paymentMethodEnum } from './enums';
import { PaymentMethodEnum } from '../../../types/enums';
import { users } from './auth';
import { tests } from './tests';

export const paidTestEntries = pgTable(
	'paid_test_entries',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		testId: uuid('test_id')
			.references(() => tests.id, { onDelete: 'cascade' })
			.notNull(),

		paidAt: timestamp('paid_at', { withTimezone: true, mode: 'date', precision: 3 }),

		// Payment provider specific fields for validation/tracking

		externalCheckoutSessionId: text('external_checkout_session_id'),
		externalCustomerId: text('external_customer_id'),

		transactionId: text('transaction_id').references(() => transactions.id, {
			onDelete: 'set null'
		}),

		paymentMethod: paymentMethodEnum('payment_method')
			.notNull()
			.$type<PaymentMethodEnum>()
			.default(PaymentMethodEnum.card),

		...timestamps
	},
	(t) => [
		// Only one paid entry per user per test where
		uniqueIndex('unique_paid_test_user_id_paid_at_not_null')
			.on(t.testId, t.userId, t.paidAt)
			.where(isNotNull(t.paidAt))
	]
);

export const paidTestEntriesRelations = relations(paidTestEntries, ({ one }) => ({
	test: one(tests, {
		fields: [paidTestEntries.testId],
		references: [tests.id]
	}),

	user: one(users, {
		fields: [paidTestEntries.userId],
		references: [users.id]
	}),

	transaction: one(transactions, {
		fields: [paidTestEntries.transactionId],
		references: [transactions.id]
	})
}));

export type PaidTestEntry = typeof paidTestEntries.$inferSelect;
export type NewPaidTestEntry = typeof paidTestEntries.$inferInsert;
