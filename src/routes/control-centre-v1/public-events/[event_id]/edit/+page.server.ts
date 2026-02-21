import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate, withFiles } from 'sveltekit-superforms';
import { updatePublicEventSchema } from '../../schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { publicEvents } from '$lib/server/db/schema/publicEvents';
import { uploadFileToS3, deleteUploadedFile } from '$lib/server/server-utils/files';
import { EVENTS_POSTERS_FOLDER } from '$lib/s3';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditEvents)) {
		error(403, 'Отказан достъп.');
	}

	const { event } = await parent();

	const updatePublicEventForm = await superValidate(zod4(updatePublicEventSchema), {
		defaults: {
			name: event.name,
			description: event.description,
			date: new Date(event.date),
			link: event.link
		}
	});

	return {
		event,
		updatePublicEventForm
	};
};

export const actions: Actions = {
	updateEvent: async ({ request, locals, params }) => {
		const form = await superValidate(request, zod4(updatePublicEventSchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditEvents)) {
			return fail(403, { form: withFiles(form), message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form: withFiles(form), message: 'Формата е невалидна.' });
		}

		try {
			// Get existing event
			const existingEvent = await db.query.publicEvents.findFirst({
				where: eq(publicEvents.id, params.event_id),
				with: {
					posterFile: true
				}
			});

			if (!existingEvent) {
				return fail(404, { form: withFiles(form), message: 'Събитието не беше намерено.' });
			}

			let posterFileId = existingEvent.posterFileId;

			// Upload new poster if provided
			if (form.data.posterFile) {
				// Delete old poster if exists
				if (existingEvent.posterFileId) {
					try {
						await deleteUploadedFile(existingEvent.posterFileId);
					} catch (err) {
						console.error('Error deleting old poster:', err);
					}
				}

				// Upload new poster
				const { fileId } = await uploadFileToS3(form.data.posterFile, {
					basePath: EVENTS_POSTERS_FOLDER,
					displayName: form.data.name,
					uploadedById: locals.user.id
				});
				posterFileId = fileId;
			}

			await db
				.update(publicEvents)
				.set({
					name: form.data.name,
					description: form.data.description,
					date: form.data.date,
					link: form.data.link,
					posterFileId
				})
				.where(eq(publicEvents.id, existingEvent.id));

			return { form: withFiles(form), message: 'Събитието беше редактирано успешно.' };
		} catch (err) {
			console.error('Error updating public event:', err);
			return fail(500, {
				form: withFiles(form),
				message: 'Възникна грешка при редактирането на събитието.'
			});
		}
	}
};
