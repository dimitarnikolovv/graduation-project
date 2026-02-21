import {
	countOfPublishedLessonsInGradeBySubject,
	countOfPublishedLessonsInSubjects
} from '$lib/server/db-querying/lessons';
import {
	getAllClassGrades,
	getAllSubjects,
	getClassGradeBySlug,
	getSubjectBySlug
} from '$lib/server/db-querying/subjects';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { fetchAllExpandedLessonGroups } from '$lib/server/db-querying/lessonGroups';

export const load: LayoutServerLoad = async ({ params }) => {
	const subject = await getSubjectBySlug(params.subject_slug);

	if (!subject) {
		error(404, 'Не намерихме този предмет.');
	}

	const grade = await getClassGradeBySlug(params.grade_slug);

	if (!grade) {
		error(404, 'Не намерихме този клас.');
	}

	const groups = await fetchAllExpandedLessonGroups({
		classGradeId: grade.id,
		subjectId: subject.id
	});

	const subjects = await getAllSubjects();
	const classGrades = await getAllClassGrades();

	const lessonCountInGrades = await countOfPublishedLessonsInGradeBySubject(subject.id, {
		countOnlyWithGroup: true
	});

	const lessonCountInSubjects = await countOfPublishedLessonsInSubjects({
		countOnlyWithGroup: true
	});

	const title = `Уроци по ${subject.name} за ${grade.name} | ${DEFAULT_SEO_TITLE}`;

	return {
		groups,
		title,
		subject,
		grade,
		subjects,
		classGrades,
		countOfLessonsInGrade: lessonCountInGrades,
		countOfLessonsInSubject: lessonCountInSubjects
	};
};
