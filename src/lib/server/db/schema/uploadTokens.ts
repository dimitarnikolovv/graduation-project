import { pgTable, text, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { testAttempts, testQuestions } from './tests';

/**
 * Upload tokens table for mobile file uploads.
 *
 * These tokens are generated when a student wants to upload files from their
 * mobile device (via QR code or short URL). The token links to a specific
 * question in a specific attempt and expires after a set time.
 */
export const uploadTokens = pgTable(
	'upload_tokens',
	{
		/** Short token ID (8 characters) for the URL */
		id: text('id').primaryKey(),

		/** The attempt this token is for */
		attemptId: uuid('attempt_id')
			.notNull()
			.references(() => testAttempts.id, { onDelete: 'cascade' }),

		/** The question this token is for */
		questionId: uuid('question_id')
			.notNull()
			.references(() => testQuestions.id, { onDelete: 'cascade' }),

		/** The user who owns this token */
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		/** When this token expires */
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date', precision: 3 }).notNull(),

		/** When this token was created */
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date', precision: 3 })
			.defaultNow()
			.notNull()
	},
	(table) => [
		index('upload_tokens_attempt_idx').on(table.attemptId),
		index('upload_tokens_user_idx').on(table.userId),
		index('upload_tokens_expires_at_idx').on(table.expiresAt)
	]
);

export type UploadToken = typeof uploadTokens.$inferSelect;
export type NewUploadToken = typeof uploadTokens.$inferInsert;

export const uploadTokensRelations = relations(uploadTokens, ({ one }) => ({
	attempt: one(testAttempts, {
		fields: [uploadTokens.attemptId],
		references: [testAttempts.id]
	}),
	question: one(testQuestions, {
		fields: [uploadTokens.questionId],
		references: [testQuestions.id]
	}),
	user: one(users, {
		fields: [uploadTokens.userId],
		references: [users.id]
	})
}));
