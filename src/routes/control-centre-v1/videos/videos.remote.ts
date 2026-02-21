import { command, getRequestEvent } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { deleteUploadedVideo } from '$lib/server/server-utils/files';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import z from 'zod';

const deleteVideoSchema = z.object({
	id: z.string()
});

export const deleteVideoRemote = command(deleteVideoSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteVideos)) {
		return error(403, 'Нямате нужните права за изтриване на видеа.');
	}

	try {
		await deleteUploadedVideo(id);
	} catch (err) {
		console.log('Error deleting video:', err);

		error(500, 'Възникна грешка при изтриването на видеото.');
	}
});
