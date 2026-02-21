import {
	getProgressForStudent,
	getStudentLessonStats
} from '$lib/server/db-querying/studentLessons';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const [stats, progressStats] = await Promise.all([
		getStudentLessonStats(userId),
		getProgressForStudent(userId)
	]);

	return {
		stats,
		progressStats,
		title: `Напредък | ${DEFAULT_SEO_TITLE}`
	};
};
