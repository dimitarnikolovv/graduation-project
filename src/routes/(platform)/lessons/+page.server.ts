import { getSubjectsWithPublishedLessons } from '$lib/server/db-querying/subjects';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const subjects = await getSubjectsWithPublishedLessons({
		countOnlyWithGroup: true
	});

	const title = `Предмети | ${DEFAULT_SEO_TITLE}`;

	return { subjects, title };
};
