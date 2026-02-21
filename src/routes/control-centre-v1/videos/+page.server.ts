import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { fetchExpandedVideos } from '$lib/server/db-querying/videos';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewVideos)) {
		return error(403, { message: 'Нямате нужните права за преглед на видеа.' });
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '20');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	const { results: videos, totalItems } = await fetchExpandedVideos({
		page,
		limit,
		searchParams: url.searchParams
	});

	const totalPages = Math.ceil(totalItems / limit);

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	return {
		videos,
		totalItems,
		page: page,
		limit,
		totalPages,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};
