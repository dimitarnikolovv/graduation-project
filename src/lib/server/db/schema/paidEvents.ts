import {
	boolean,
	check,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
import { files } from './files';
import { timestamps } from '../column-helpers';
import { relations, sql } from 'drizzle-orm';
import { paidEventEntries } from './paidEventEntries';
import type { EventAttribute } from '$lib/types/events';

export const paidEvents = pgTable(
	'paid_events',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: text('name').notNull(),
		description: text('description'),

		isRedirecting: boolean('is_redirecting').notNull().default(false),
		redirectUrl: text('redirect_url'),
		redirectButtonText: text('redirect_button_text'),

		/**
		 * Key - Value pairs with custom attributes for the event
		 *
		 * These can include any additional data relevant to the event
		 * such as location, speakers, agenda, etc.
		 */
		attributes: jsonb('attributes').$type<EventAttribute[]>().notNull().default([]),

		/**
		 * Price of the event in cents
		 *
		 * The price is stored as an integer number representing the cost in the platform's currency.
		 *
		 * @example 1999 // represents 19.99 in the currency
		 */
		priceInCents: integer('price_in_cents').notNull().default(0),
		date: timestamp('date', { withTimezone: true, mode: 'date', precision: 3 }).notNull(),

		posterFileId: text('poster_file_id').references(() => files.id, { onDelete: 'set null' }),

		...timestamps
	},
	(table) => [
		// Check if redirectUrl is set when isRedirecting is true
		check(
			'redirect_url_check',
			sql`${table.isRedirecting} = false OR (${table.isRedirecting} = true AND ${table.redirectUrl} IS NOT NULL)`
		),

		// Check if redirectButtonText is set when isRedirecting is true
		check(
			'redirect_button_text_check',
			sql`${table.isRedirecting} = false OR (${table.isRedirecting} = true AND ${table.redirectButtonText} IS NOT NULL)`
		)
	]
);

export const paidEventRelations = relations(paidEvents, ({ many, one }) => ({
	entries: many(paidEventEntries),
	posterFile: one(files, {
		fields: [paidEvents.posterFileId],
		references: [files.id]
	})
}));

export type PaidEvent = typeof paidEvents.$inferSelect;
