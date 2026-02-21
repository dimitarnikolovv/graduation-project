import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm/relations';
import { videos } from './videos';
import { lessons } from './lessons';
import { tests } from './tests';

export const subjects = pgTable('subjects', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),

	colorFrom: text('color_from'),
	colorTo: text('color_to')
});

export const subjectRelations = relations(subjects, ({ many }) => ({
	videos: many(videos),
	lessons: many(lessons),
	tests: many(tests)
}));

export type Subject = typeof subjects.$inferSelect;

export const classGrades = pgTable('class_grades', {
	id: serial('id').primaryKey(),
	gradeNumber: integer('grade_number').notNull().unique(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique()
});

export const classGradeRelations = relations(classGrades, ({ many }) => ({
	videos: many(videos),
	lessons: many(lessons),
	tests: many(tests)
}));

export type ClassGrade = typeof classGrades.$inferSelect;
