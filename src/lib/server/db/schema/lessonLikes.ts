import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { lessons } from './lessons';
import { users } from './auth';
import { relations } from 'drizzle-orm';

export const lessonLikes = pgTable('lesson_likes', {
	id: uuid('id').defaultRandom().primaryKey(),
	lessonId: text('lesson_id')
		.references(() => lessons.id, { onDelete: 'cascade' })
		.notNull(),
	userId: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull()
});

export const lessonLikesRelations = relations(lessonLikes, ({ one }) => ({
	lesson: one(lessons, {
		fields: [lessonLikes.lessonId],
		references: [lessons.id]
	}),

	user: one(users, {
		fields: [lessonLikes.userId],
		references: [users.id]
	})
}));
