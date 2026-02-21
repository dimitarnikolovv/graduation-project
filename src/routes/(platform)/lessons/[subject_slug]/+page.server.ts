import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getClassGradesForSubjectSlug, getSubjectBySlug } from '$lib/server/db-querying/subjects';

export const load: PageServerLoad = async ({ params }) => {
	const subject = await getSubjectBySlug(params.subject_slug);

	if (!subject) {
		error(404, 'Не намерихме този предмет.');
	}

	const gradesForSubject = await getClassGradesForSubjectSlug(params.subject_slug);

	const title = `Избери своя клас | ${DEFAULT_SEO_TITLE}`;

	return { gradesForSubject, title, subject };
};
