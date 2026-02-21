import { pgTable, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';
import { timestamps } from '../column-helpers';
import { relations } from 'drizzle-orm/relations';
import { roleEnum } from './enums';
import type { RolesEnum } from '../../../types/enums';
import { videos } from './videos';
import { testAttempts, tests } from './tests';
import { lessons } from './lessons';
import { studentLessons } from './studentLessons';

export const users = pgTable(
	'users',
	{
		id: text('id').primaryKey(),
		googleId: text('google_id').unique(),
		firstName: varchar('first_name', { length: 180 }).notNull(),
		lastName: varchar('last_name', { length: 180 }).notNull(),
		email: varchar('email', { length: 255 }).notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		role: roleEnum('role').$type<RolesEnum>(),
		refreshToken: text('refresh_token'),

		...timestamps
	},
	(table) => [
		index('user_email_idx').on(table.email),
		index('user_role_idx').on(table.role),
		index('user_created_at_idx').on(table.createdAt),
		index('user_deleted_at_idx').on(table.deletedAt)
	]
);

// User Relations
export const userRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	testAttempts: many(testAttempts),
	passwordResetTokens: many(passwordResetTokens),
	uploadedVideos: many(videos),
	createdTests: many(tests, { relationName: 'test_author' }),
	createdLessons: many(lessons, { relationName: 'lesson_author' }),
	editedLessons: many(lessons, { relationName: 'lesson_last_edited_by' }),
	editedTests: many(tests, { relationName: 'test_last_edited_by' }),

	// Student lessons (many-to-many via junction table)
	studentLessons: many(studentLessons)
}));

export type User = typeof users.$inferSelect;

export const sessions = pgTable('sessions', {
	...timestamps,
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export type Session = typeof sessions.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
	token: text('token').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull()
});

export const passwordResetTokenRelations = relations(passwordResetTokens, ({ one }) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	})
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
