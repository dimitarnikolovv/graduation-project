import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { paidEvents } from './paidEvents';
import { timestamps } from '../column-helpers';
import { isNotNull, relations } from 'drizzle-orm';
import { transactions } from './transactions';
import { paymentMethodEnum } from './enums';
import { PaymentMethodEnum } from '../../../types/enums';

export const paidEventEntries = pgTable(
	'paid_event_entries',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		eventId: uuid('event_id')
			.references(() => paidEvents.id, { onDelete: 'cascade' })
			.notNull(),

		firstName: text('first_name').notNull(),
		lastName: text('last_name').notNull(),
		atendeeEmail: text('atendee_email').notNull(),
		phone: text('phone').notNull(),

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
		// Only one paid entry per attendee per event
		uniqueIndex('unique_paid_event_email_paid_at_not_null')
			.on(t.eventId, t.atendeeEmail, t.paidAt, t.firstName, t.lastName)
			.where(isNotNull(t.paidAt))
	]
);

export const paidEventEntriesRelations = relations(paidEventEntries, ({ one }) => ({
	event: one(paidEvents, {
		fields: [paidEventEntries.eventId],
		references: [paidEvents.id]
	}),

	transaction: one(transactions, {
		fields: [paidEventEntries.transactionId],
		references: [transactions.id]
	})
}));

export type PaidEventEntry = typeof paidEventEntries.$inferSelect;

export type NewPaidEventEntry = typeof paidEventEntries.$inferInsert;
