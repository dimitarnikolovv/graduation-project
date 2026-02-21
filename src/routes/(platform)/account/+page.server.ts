import {
	getStudentLessonStats,
	getRecentlyAccessedLessons
} from '$lib/server/db-querying/studentLessons';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	// Fetch user statistics and recent lessons in parallel
	const [stats, recentLessons] = await Promise.all([
		getStudentLessonStats(userId),
		getRecentlyAccessedLessons(userId, 5)
	]);

	return {
		stats,
		recentLessons,
		title: `Профил | ${DEFAULT_SEO_TITLE}`
	};
};
