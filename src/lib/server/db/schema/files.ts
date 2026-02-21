import { timestamps } from '../column-helpers';
import { pgTable, text, bigint, index } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { relations } from 'drizzle-orm';

export const files = pgTable(
	'files',
	{
		id: text('id').primaryKey(),
		fileKey: text('file_key').notNull().unique(), // e.g. "thumbnails/thumb.jpg"
		originalName: text('original_name').notNull(), // e.g. "thumb.jpg"
		contentType: text('content_type').notNull(), // "image/jpeg"
		size: bigint('size', { mode: 'number' }).notNull(), // Size in bytes
		displayName: text('display_name').notNull(), // e.g. "Intro",
		uploadedById: text('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }), // User ID
		...timestamps
	},
	(table) => [
		index('file_uploaded_by_idx').on(table.uploadedById),
		index('file_file_key_idx').on(table.fileKey),
		index('file_created_at_idx').on(table.createdAt),
		index('file_deleted_at_idx').on(table.deletedAt)
	]
);

export type UploadedFile = typeof files.$inferSelect;

export const fileRelations = relations(files, ({ one }) => ({
	uploadedByUser: one(users, {
		fields: [files.uploadedById],
		references: [users.id]
	})
}));
