import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { publicEvents } from './publicEvents';
import { timestamps } from '../column-helpers';
import { relations } from 'drizzle-orm';

export const publicEventEntries = pgTable(
	'public_event_entries',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		eventId: uuid('event_id')
			.references(() => publicEvents.id, { onDelete: 'cascade' })
			.notNull(),

		atendeeEmail: text('atendee_email').notNull(),
		atendeeName: text('atendee_name').notNull(),

		...timestamps
	},
	(t) => [uniqueIndex('unique_public_event_email').on(t.eventId, t.atendeeEmail)]
);

export const publicEventEntriesRelations = relations(publicEventEntries, ({ one }) => ({
	event: one(publicEvents, {
		fields: [publicEventEntries.eventId],
		references: [publicEvents.id]
	})
}));

export type PublicEventEntry = typeof publicEventEntries.$inferSelect;
