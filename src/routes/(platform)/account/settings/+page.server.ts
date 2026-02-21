import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		title: `Настройки | ${DEFAULT_SEO_TITLE}`
	};
};
