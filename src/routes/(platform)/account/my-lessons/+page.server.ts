import { fetchStudentLessons } from '$lib/server/db-querying/studentLessons';
import { getAllSubjects, getAllClassGrades } from '$lib/server/db-querying/subjects';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const currentUser = locals.user;

	if (!currentUser) {
		redirect(302, '/login');
	}

	// Parse query parameters
	const limit = parseInt(url.searchParams.get('limit') ?? '12');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	// Fetch data in parallel
	const [lessonsData, subjects, classGrades] = await Promise.all([
		fetchStudentLessons({
			userId: currentUser.id,
			page,
			limit,
			searchParams: url.searchParams
		}),
		getAllSubjects(),
		getAllClassGrades()
	]);

	return {
		...lessonsData,
		subjects,
		classGrades,
		limit,
		title: `Моите уроци | ${DEFAULT_SEO_TITLE}`
	};
};
