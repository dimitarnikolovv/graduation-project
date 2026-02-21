import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getClassGradesForTestSubjectSlug, getSubjectBySlug } from '$lib/server/db-querying/subjects';

export const load: PageServerLoad = async ({ params }) => {
	const subject = await getSubjectBySlug(params.subject_slug);

	if (!subject) {
		error(404, 'Не намерихме този предмет.');
	}

	const gradesForSubject = await getClassGradesForTestSubjectSlug(params.subject_slug);

	const title = `Тестове по ${subject.name} | ${DEFAULT_SEO_TITLE}`;

	return { gradesForSubject, title, subject };
};
