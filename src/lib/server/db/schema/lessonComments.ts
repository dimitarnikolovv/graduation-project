import { timestamps } from '../column-helpers';
import { pgTable, text, index, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { relations } from 'drizzle-orm';
import { lessons } from './lessons';

export const lessonComments = pgTable(
	'lesson_comments',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		content: text('content').notNull(),
		lessonId: text('lesson_id')
			.references(() => lessons.id, { onDelete: 'cascade' })
			.notNull(),
		authorId: text('author_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		...timestamps
	},
	(table) => [
		index('lesson_comments_author_idx').on(table.authorId),
		index('lesson_comments_created_at_idx').on(table.createdAt),
		index('lesson_comments_deleted_at_idx').on(table.deletedAt)
	]
);

export type LessonComments = typeof lessons.$inferSelect;

export const lessonCommentsRelations = relations(lessonComments, ({ one }) => ({
	author: one(users, {
		fields: [lessonComments.authorId],
		references: [users.id],
		relationName: 'lesson_author'
	}),

	lesson: one(lessons, {
		fields: [lessonComments.lessonId],
		references: [lessons.id]
	})
}));
