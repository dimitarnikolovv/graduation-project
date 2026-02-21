import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { updateLessonGroupSchema, createLessonGroupSchema } from './schema';
import { fetchPaginatedLessonGroups } from '$lib/server/db-querying/lessonGroups';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewLessonGroups)) {
		error(403, 'Отказан достъп. Нямате нужните права, за да посетите тази страница.');
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '30');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1')); // Ensure valid page

	const newLessonGroupForm = await superValidate(zod4(createLessonGroupSchema));
	const updateLessonGroupForm = await superValidate(zod4(updateLessonGroupSchema));

	try {
		const {
			results: groups,
			totalItems,
			totalPages
		} = await fetchPaginatedLessonGroups({ page, limit });

		return {
			newLessonGroupForm,
			updateLessonGroupForm,
			groups,
			limit,
			page: page,
			totalItems,
			totalPages
		};
	} catch (err) {
		console.log(err);
		return {
			newLessonGroupForm,
			updateLessonGroupForm,
			groups: [],
			limit,
			page: 1,
			totalItems: 0,
			totalPages: 0
		};
	}
};
