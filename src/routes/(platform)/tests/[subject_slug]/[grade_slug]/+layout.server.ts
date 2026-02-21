import {
	countOfPublishedTestsInGradeBySubject,
	countOfPublishedTestsInSubjects,
	fetchFeaturedTests,
	fetchPaidTests,
	fetchFreeTests
} from '$lib/server/db-querying/tests';
import {
	getAllClassGrades,
	getAllSubjects,
	getClassGradeBySlug,
	getSubjectBySlug
} from '$lib/server/db-querying/subjects';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, url }) => {
	const subject = await getSubjectBySlug(params.subject_slug);

	if (!subject) {
		error(404, 'Не намерихме този предмет.');
	}

	const grade = await getClassGradeBySlug(params.grade_slug);

	if (!grade) {
		error(404, 'Не намерихме този клас.');
	}

	// Pagination params
	const limit = parseInt(url.searchParams.get('limit') ?? '24');
	const paidPage = Math.max(1, parseInt(url.searchParams.get('paidPage') ?? '1'));
	const freePage = Math.max(1, parseInt(url.searchParams.get('freePage') ?? '1'));

	// Fetch tests in order: featured first, then paid, then free
	const [featuredTests, paidTestsResult, freeTestsResult] = await Promise.all([
		fetchFeaturedTests(subject.id, grade.id),
		fetchPaidTests(subject.id, grade.id, paidPage, limit),
		fetchFreeTests(subject.id, grade.id, freePage, limit)
	]);

	const subjects = await getAllSubjects();
	const classGrades = await getAllClassGrades();

	const testCountInGrades = await countOfPublishedTestsInGradeBySubject(subject.id);
	const testCountInSubjects = await countOfPublishedTestsInSubjects();

	const title = `Тестове по ${subject.name} за ${grade.name} | ${DEFAULT_SEO_TITLE}`;

	return {
		featuredTests,
		paidTests: paidTestsResult.results,
		paidTestsTotalItems: paidTestsResult.totalItems,
		paidTestsTotalPages: paidTestsResult.totalPages,
		paidPage,
		freeTests: freeTestsResult.results,
		freeTestsTotalItems: freeTestsResult.totalItems,
		freeTestsTotalPages: freeTestsResult.totalPages,
		freePage,
		limit,
		title,
		subject,
		grade,
		subjects,
		classGrades,
		countOfTestsInGrade: testCountInGrades,
		countOfTestsInSubject: testCountInSubjects
	};
};
