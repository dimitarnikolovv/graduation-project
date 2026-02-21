import { asc, eq, and, isNotNull, sql } from 'drizzle-orm';
import { classGrades, subjects } from '../db/schema/subjects';
import { db } from '../db';
import { lessons } from '../db/schema/lessons';
import { PublishedStatusEnum } from '$lib/types/enums';

type countOfLessonsOptions = {
	countOnlyWithGroup?: boolean;
};

/**
 * Fetches all subjects from the database, ordered alphabetically by name.
 * Each subject includes an extra field `countOfLessons` representing the number of lessons associated with it.
 *
 * @returns An array of subjects with their respective lesson counts.
 */
export async function getAllSubjects(options?: countOfLessonsOptions) {
	const countOnlyWithGroup = options?.countOnlyWithGroup ?? false;

	const foundSubjects = await db.query.subjects.findMany({
		orderBy: [asc(subjects.name)],
		extras: {
			countOfLessons: sql`(
					SELECT COUNT(*)::int FROM ${lessons} WHERE lessons.subject_id = subjects.id
					${countOnlyWithGroup ? sql`AND lessons.group_id IS NOT NULL` : sql``}
					)`
				.mapWith(Number)
				.as('count_of_lessons')
		}
	});

	return foundSubjects;
}

export type GetAllSubjectsResult = Awaited<ReturnType<typeof getAllSubjects>>;

/** Fetches all subjects, with published lesson counts, that have at least one published lesson associated with them.
 *
 * @returns An array of subjects with lessons.
 */
export async function getSubjectsWithPublishedLessons(options?: countOfLessonsOptions) {
	const countOnlyWithGroup = options?.countOnlyWithGroup ?? false;

	const foundSubjects = await db
		.select({
			id: subjects.id,
			name: subjects.name,
			slug: subjects.slug,
			colorFrom: subjects.colorFrom,
			colorTo: subjects.colorTo,
			countOfLessons: sql`(
					SELECT COUNT(*)::int FROM ${lessons} WHERE lessons.subject_id = subjects.id
					AND lessons.published_status = 'published'
					${countOnlyWithGroup ? sql`AND lessons.group_id IS NOT NULL` : sql``}
					)`
				.mapWith(Number)
				.as('count_of_lessons')
		})
		.from(subjects)
		.innerJoin(
			lessons,
			and(
				eq(lessons.subjectId, subjects.id),
				eq(lessons.publishedStatus, PublishedStatusEnum.published),
				countOnlyWithGroup ? isNotNull(lessons.groupId) : sql`TRUE`
			)
		)
		.groupBy(subjects.id)
		.having(sql`COUNT(${lessons.id}) > 0`)
		.orderBy(asc(subjects.name));

	return foundSubjects;
}

/**
 * Fetches a subject by its slug.
 *
 * @param slug - The slug of the subject to fetch.
 * @returns The subject object if found, otherwise undefined.
 */
export async function getSubjectBySlug(slug: string) {
	const foundSubject = await db.query.subjects.findFirst({
		where: eq(subjects.slug, slug)
	});

	return foundSubject;
}

/**
 * Fetches all class grades from the database, ordered by grade number in ascending order.
 *
 * @returns An array of class grades.
 */
export async function getAllClassGrades() {
	const foundClassGrades = await db.query.classGrades.findMany({
		orderBy: [asc(classGrades.gradeNumber)]
	});

	return foundClassGrades;
}

export type GetAllClassGradesResult = Awaited<ReturnType<typeof getAllClassGrades>>;

/** * Fetches a class grade by its slug.
 *
 * @param slug - The slug of the class grade to fetch.
 * @returns The class grade object if found, otherwise undefined.
 */
export async function getClassGradeBySlug(slug: string) {
	const foundClassGrade = await db.query.classGrades.findFirst({
		where: eq(classGrades.slug, slug)
	});

	return foundClassGrade;
}

/**
 * Fetches all class grades that have at least one lesson associated with the given subject slug.
 * The results are ordered by the grade number in ascending order.
 *
 * @param subjectSlug - The slug of the subject to filter class grades by.
 * @returns An array of class grades associated with the specified subject slug.
 */
export async function getClassGradesForSubjectSlug(subjectSlug: string) {
	const foundClassGrades = await db
		.select({
			id: classGrades.id,
			name: classGrades.name,
			slug: classGrades.slug,
			gradeNumber: classGrades.gradeNumber
		})
		.from(classGrades)
		.innerJoin(lessons, and(eq(lessons.classGradeId, classGrades.id), isNotNull(lessons.groupId)))
		.innerJoin(subjects, eq(lessons.subjectId, subjects.id))
		.where(eq(subjects.slug, subjectSlug))
		.groupBy(classGrades.id)
		.orderBy(asc(classGrades.gradeNumber));

	return foundClassGrades;
}

// ============ TESTS ============

import { tests } from '../db/schema/tests';

/**
 * Fetches all subjects that have at least one published test.
 * Each subject includes the count of published tests.
 */
export async function getSubjectsWithPublishedTests() {
	const foundSubjects = await db
		.select({
			id: subjects.id,
			name: subjects.name,
			slug: subjects.slug,
			colorFrom: subjects.colorFrom,
			colorTo: subjects.colorTo,
			countOfTests: sql`(
				SELECT COUNT(*)::int FROM ${tests} 
				WHERE tests.subject_id = subjects.id
				AND tests.published_status = 'published'
			)`
				.mapWith(Number)
				.as('count_of_tests')
		})
		.from(subjects)
		.innerJoin(
			tests,
			and(eq(tests.subjectId, subjects.id), eq(tests.publishedStatus, PublishedStatusEnum.published))
		)
		.groupBy(subjects.id)
		.having(sql`COUNT(${tests.id}) > 0`)
		.orderBy(asc(subjects.name));

	return foundSubjects;
}

export type GetSubjectsWithPublishedTestsResult = Awaited<ReturnType<typeof getSubjectsWithPublishedTests>>;

/**
 * Fetches all class grades that have at least one published test for a given subject.
 */
export async function getClassGradesForTestSubjectSlug(subjectSlug: string) {
	const foundClassGrades = await db
		.select({
			id: classGrades.id,
			name: classGrades.name,
			slug: classGrades.slug,
			gradeNumber: classGrades.gradeNumber
		})
		.from(classGrades)
		.innerJoin(
			tests,
			and(
				eq(tests.classGradeId, classGrades.id),
				eq(tests.publishedStatus, PublishedStatusEnum.published)
			)
		)
		.innerJoin(subjects, eq(tests.subjectId, subjects.id))
		.where(eq(subjects.slug, subjectSlug))
		.groupBy(classGrades.id)
		.orderBy(asc(classGrades.gradeNumber));

	return foundClassGrades;
}

export type GetClassGradesForTestSubjectSlugResult = Awaited<ReturnType<typeof getClassGradesForTestSubjectSlug>>;
