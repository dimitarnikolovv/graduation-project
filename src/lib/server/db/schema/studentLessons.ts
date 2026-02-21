import { pgTable, text, timestamp, index, primaryKey, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { lessons } from './lessons';

/**
 * Junction table tracking student enrollment and progress in lessons
 */
export const studentLessons = pgTable(
	'student_lessons',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		lessonId: text('lesson_id')
			.notNull()
			.references(() => lessons.id, { onDelete: 'cascade' }),

		// Tracking fields
		startedAt: timestamp('started_at', { withTimezone: true, mode: 'date', precision: 3 })
			.defaultNow()
			.notNull(),
		lastAccessedAt: timestamp('last_accessed_at', {
			withTimezone: true,
			mode: 'date',
			precision: 3
		})
			.defaultNow()
			.notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date', precision: 3 }),

		// Progress tracking (0-100)
		progress: real('progress').notNull().default(0), // Percentage of lesson completed

		// Video watching progress (in seconds)
		videoProgress: real('video_progress').notNull().default(0)
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.lessonId] }),
		index('student_lessons_user_id_idx').on(table.userId),
		index('student_lessons_lesson_id_idx').on(table.lessonId),
		index('student_lessons_started_at_idx').on(table.startedAt),
		index('student_lessons_completed_at_idx').on(table.completedAt)
	]
);

export type StudentLesson = typeof studentLessons.$inferSelect;
export type StudentLessonInsert = typeof studentLessons.$inferInsert;

// Relations
export const studentLessonsRelations = relations(studentLessons, ({ one }) => ({
	user: one(users, {
		fields: [studentLessons.userId],
		references: [users.id]
	}),
	lesson: one(lessons, {
		fields: [studentLessons.lessonId],
		references: [lessons.id]
	})
}));
