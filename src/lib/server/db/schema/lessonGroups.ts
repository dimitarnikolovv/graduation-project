import { integer, pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm/relations';
import { lessons } from './lessons';
import { classGrades, subjects } from './subjects';

export const lessonGroups = pgTable(
	'lesson_groups',
	{
		id: serial('id').primaryKey(),
		name: text('name').notNull().unique(),
		order: integer('order').notNull().default(1), // Order of the chapter

		classGradeId: integer('class_grade_id')
			.references(() => classGrades.id, { onDelete: 'restrict' })
			.notNull(),
		subjectId: integer('subject_id')
			.references(() => subjects.id, { onDelete: 'restrict' })
			.notNull()
	},
	(table) => [
		// Ensure unique chapter order within the same subject and class grade
		uniqueIndex('lesson_chapter_unique_order_per_subject_class_grade_idx').on(
			table.subjectId,
			table.classGradeId,
			table.order
		)
	]
);

export const lessonGroupsRelations = relations(lessonGroups, ({ one, many }) => ({
	lessons: many(lessons),
	// tests: many(tests),

	classGrade: one(classGrades, {
		fields: [lessonGroups.classGradeId],
		references: [classGrades.id]
	}),
	subject: one(subjects, {
		fields: [lessonGroups.subjectId],
		references: [subjects.id]
	})
}));

export type LessonGroup = typeof lessonGroups.$inferSelect;
