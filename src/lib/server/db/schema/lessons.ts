import { timestamps } from '../column-helpers';
import { pgTable, text, index, boolean, integer, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { relations } from 'drizzle-orm';
import { classGrades, subjects } from './subjects';
import { videos } from './videos';
import { tests } from './tests';
import { lessonGroups } from './lessonGroups';
import { studentLessons } from './studentLessons';
import { lessonComments } from './lessonComments';
import { publishedStatusEnum } from './enums';
import { PublishedStatusEnum } from '../../../types/enums';
import { lessonLikes } from './lessonLikes';

export const lessons = pgTable(
	'lessons',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(), // e.g. "Intro to Algebra"
		content: text('content'), // Main content of the lesson (html string)
		resume: text('resume').notNull(), // Short description or resume of the lesson
		isPaid: boolean('is_paid').notNull().default(false),
		publishedStatus: publishedStatusEnum('published_status')
			.notNull()
			.$type<PublishedStatusEnum>()
			.default(PublishedStatusEnum.hidden),
		videoId: text('video_id')
			.references(() => videos.id, { onDelete: 'restrict' })
			.notNull(), // Video ID
		subjectId: integer('subject_id')
			.references(() => subjects.id, { onDelete: 'restrict' })
			.notNull(), // Subject ID
		classGradeId: integer('class_grade_id')
			.references(() => classGrades.id, {
				onDelete: 'restrict'
			})
			.notNull(), // Class Grade ID (optional for filtering)
		groupId: integer('group_id').references(() => lessonGroups.id, {
			onDelete: 'set null'
		}),
		testId: uuid('test_id').references(() => tests.id, { onDelete: 'set null' }), // Optional Test ID associated with the lesson
		authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
		lastEditedById: text('last_edited_by_id').references(() => users.id, { onDelete: 'set null' }),
		order: integer('order').notNull().default(1), // Order of the lesson within the subject and class grade
		viewCount: integer('view_count').notNull().default(0), // Number of times the lesson has been viewed

		...timestamps
	},
	(table) => [
		index('lesson_author_idx').on(table.authorId),
		index('lesson_created_at_idx').on(table.createdAt),
		index('lesson_deleted_at_idx').on(table.deletedAt),
		uniqueIndex('lesson_unique_order_per_subject_class_grade_idx').on(
			table.subjectId,
			table.classGradeId,
			table.order
		)
	]
);

export type Lesson = typeof lessons.$inferSelect;

export const lessonRelations = relations(lessons, ({ one, many }) => ({
	author: one(users, {
		fields: [lessons.authorId],
		references: [users.id],
		relationName: 'lesson_author'
	}),

	lastEditedBy: one(users, {
		fields: [lessons.lastEditedById],
		references: [users.id],
		relationName: 'lesson_last_edited_by'
	}),

	video: one(videos, {
		fields: [lessons.videoId],
		references: [videos.id]
	}),

	test: one(tests, {
		fields: [lessons.testId],
		references: [tests.id]
	}),

	subject: one(subjects, {
		fields: [lessons.subjectId],
		references: [subjects.id]
	}),

	classGrade: one(classGrades, {
		fields: [lessons.classGradeId],
		references: [classGrades.id]
	}),

	group: one(lessonGroups, {
		fields: [lessons.groupId],
		references: [lessonGroups.id]
	}),

	// Students enrolled in this lesson (many-to-many via junction table)
	studentLessons: many(studentLessons),

	comments: many(lessonComments),

	likes: many(lessonLikes)
}));
