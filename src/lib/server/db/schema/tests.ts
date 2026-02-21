// db/schema/tests.ts
import {
	pgTable,
	text,
	integer,
	timestamp,
	jsonb,
	index,
	uniqueIndex,
	uuid,
	boolean,
	real,
	check
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { attemptStatus, publishedStatusEnum, questionType } from './enums';
import {
	AttemptStatusEnum,
	PublishedStatusEnum,
	type QuestionTypeEnum
} from '../../../types/enums';
import { timestamps } from '../column-helpers';
import { users } from './auth';
import type { AnswerResponse, QuestionConfig } from '$lib/types/tests';
import { classGrades, subjects } from './subjects';
import { paidTestEntries } from './paidTestEntries';

// ----- Tests -----
export const tests = pgTable(
	'tests',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
		lastEditedById: text('last_edited_by_id').references(() => users.id, { onDelete: 'set null' }),
		title: text('title').notNull(),
		allowedAttempts: integer('allowed_attempts').notNull().default(0), // 0 = no limit
		description: text('description').notNull(), // Short description / summary,
		timeLimitSec: integer('time_limit_sec').notNull().default(0), // 0 = no limit

		opensAt: timestamp('opens_at', { withTimezone: true, mode: 'date', precision: 3 }), // null = available immediately
		closesAt: timestamp('closes_at', { withTimezone: true, mode: 'date', precision: 3 }), // null = never closes

		questionsPerPage: integer('questions_per_page').notNull().default(3),

		maxScore: real('max_score').notNull().default(0), // computed field

		subjectId: integer('subject_id')
			.references(() => subjects.id, { onDelete: 'restrict' })
			.notNull(), // Subject ID
		classGradeId: integer('class_grade_id')
			.references(() => classGrades.id, {
				onDelete: 'restrict'
			})
			.notNull(), // Class Grade ID (optional for filtering)

		isPaid: boolean('is_paid').notNull().default(false),

		isFeatured: boolean('is_featured').notNull().default(false),
		featuredOrder: integer('featured_order').notNull().default(0),

		/**
		 * Price of the test in cents
		 *
		 * The price is stored as an integer number representing the cost in the platform's currency.
		 *
		 * @example 1999 // represents 19.99 in the currency
		 */
		priceInCents: integer('price_in_cents').notNull().default(0),

		publishedStatus: publishedStatusEnum('published_status')
			.notNull()
			.$type<PublishedStatusEnum>()
			.default(PublishedStatusEnum.draft),

		...timestamps
	},
	(table) => [
		// if isPaid is true, priceInCents must be > 0
		check('ensure_price_if_paid', sql`${table.isPaid} = false OR ${table.priceInCents} > 0`),
		// opensAt must be before closesAt if both are set
		check(
			'ensure_opens_before_closes',
			sql`${table.opensAt} IS NULL OR ${table.closesAt} IS NULL OR ${table.opensAt} < ${table.closesAt}`
		)
	]
);

export type Test = typeof tests.$inferSelect;

// ----- Questions (belong directly to a test for simplicity) -----
export const testQuestions = pgTable(
	'test_questions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		testId: uuid('test_id')
			.notNull()
			.references(() => tests.id, { onDelete: 'cascade' }),
		order: integer('order').notNull().default(0), // display order inside the test
		type: questionType('type').notNull().$type<QuestionTypeEnum>(),
		stem: text('stem').notNull(), // the question prompt
		points: real('points').notNull().default(1.0), // max allowed 100.00

		// Minimal type-specific config:
		// single/multiple: { options: [{id,text}], correct: ["id1","id2"], shuffle?: true }
		// text: { sampleAnswer: string, maxLength: number }
		config: jsonb('config').notNull().$type<QuestionConfig>(),

		...timestamps
	},
	(t) => [uniqueIndex('questions_test_order_uk').on(t.testId, t.order)]
);

export type TestQuestion = typeof testQuestions.$inferSelect;

// ----- Attempts (each student taking a test) -----
export const testAttempts = pgTable(
	'test_attempts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		testId: uuid('test_id')
			.notNull()
			.references(() => tests.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		attemptNumber: integer('attempt_number').notNull(), // e.g. 1, 2, 3...
		status: attemptStatus('status')
			.$type<AttemptStatusEnum>()
			.default(AttemptStatusEnum.Started)
			.notNull(),
		startedAt: timestamp('started_at', { withTimezone: true, mode: 'date', precision: 3 })
			.defaultNow()
			.notNull(),
		submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date', precision: 3 }),
		gradedAt: timestamp('graded_at', { withTimezone: true, mode: 'date', precision: 3 }),
		totalScore: real('total_score').notNull().default(0), // max allowed 100000.00

		reviewerObservations: text('reviewer_observations'), // teacher comments after grading

		...timestamps
	},
	(table) => [
		// enforces uniqueness of attempts per user per test
		uniqueIndex('attempts_test_user_attempt_number_uk').on(
			table.testId,
			table.userId,
			table.attemptNumber
		)
	]
);

export type TestAttempt = typeof testAttempts.$inferSelect;

// ----- Answers (student responses + points) -----
export const testAnswers = pgTable(
	'test_answers',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		attemptId: uuid('attempt_id')
			.notNull()
			.references(() => testAttempts.id, { onDelete: 'cascade' }),
		questionId: uuid('question_id')
			.notNull()
			.references(() => testQuestions.id, { onDelete: 'cascade' }),

		// Response payload:
		// single/multiple: { selected: ["id1","id2"] }
		// text: { text: "..." }
		response: jsonb('response').$type<AnswerResponse>(), // null = not answered yet

		awardedScore: real('awarded_score').notNull().default(0), // per-question points given
		answeredAt: timestamp('answered_at', { withTimezone: true, mode: 'date', precision: 3 }) // the actual time when the user interacted with the question
	},
	(t) => [
		index('answers_attempt_idx').on(t.attemptId),
		uniqueIndex('answers_attempt_question_uk').on(t.attemptId, t.questionId)
	]
);

export type TestAnswer = typeof testAnswers.$inferSelect;

export const testsRelations = relations(tests, ({ many, one }) => ({
	paidEntries: many(paidTestEntries),

	author: one(users, {
		fields: [tests.authorId],
		references: [users.id],
		relationName: 'test_author'
	}),

	lastEditedBy: one(users, {
		fields: [tests.lastEditedById],
		references: [users.id],
		relationName: 'test_last_edited_by'
	}),

	subject: one(subjects, {
		fields: [tests.subjectId],
		references: [subjects.id]
	}),

	classGrade: one(classGrades, {
		fields: [tests.classGradeId],
		references: [classGrades.id]
	}),

	questions: many(testQuestions),
	attempts: many(testAttempts)
}));

export const questionsRelations = relations(testQuestions, ({ one, many }) => ({
	test: one(tests, { fields: [testQuestions.testId], references: [tests.id] }),
	answers: many(testAnswers)
}));

export const attemptsRelations = relations(testAttempts, ({ one, many }) => ({
	test: one(tests, { fields: [testAttempts.testId], references: [tests.id] }),
	user: one(users, { fields: [testAttempts.userId], references: [users.id] }),
	answers: many(testAnswers)
}));

export const answersRelations = relations(testAnswers, ({ one }) => ({
	attempt: one(testAttempts, { fields: [testAnswers.attemptId], references: [testAttempts.id] }),
	question: one(testQuestions, { fields: [testAnswers.questionId], references: [testQuestions.id] })
}));
