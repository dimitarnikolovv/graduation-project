import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { files } from './files';
import { timestamps } from '../column-helpers';
import { relations } from 'drizzle-orm';
import { publicEventEntries } from './publicEventEntries';

export const publicEvents = pgTable('public_events', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	description: text('description'),

	link: text('link'),

	date: timestamp('date', { withTimezone: true, mode: 'date', precision: 3 }).notNull(),

	posterFileId: text('poster_file_id').references(() => files.id, { onDelete: 'set null' }),

	...timestamps
});

export const publicEventRelations = relations(publicEvents, ({ many, one }) => ({
	entries: many(publicEventEntries),
	posterFile: one(files, {
		fields: [publicEvents.posterFileId],
		references: [files.id]
	})
}));

export type PublicEvent = typeof publicEvents.$inferSelect;
