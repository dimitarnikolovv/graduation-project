import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail, superValidate, withFiles } from 'sveltekit-superforms';
import { createPublicEventSchema } from '../schema';
import { db } from '$lib/server/db';
import { uploadFileToS3 } from '$lib/server/server-utils/files';
import { paidEvents } from '$lib/server/db/schema/paidEvents';
import { realPriceToPriceInCents } from '$lib/utils/prices';
import { EVENTS_POSTERS_FOLDER } from '$lib/s3';

export const load: PageServerLoad = async ({ locals }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateEvents)) {
		error(403, 'Отказан достъп.');
	}

	const createPublicEventForm = await superValidate(zod4(createPublicEventSchema));

	return {
		createPublicEventForm
	};
};

export const actions: Actions = {
	createEvent: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createPublicEventSchema));

		const localUser = locals.user;

		if (!localUser || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateEvents)) {
			return fail(403, { form: withFiles(form), message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form: withFiles(form), message: 'Формата е невалидна.' });
		}

		try {
			let posterFileId: string | null = null;

			await db.transaction(async (tx) => {
				// Upload poster if provided
				if (form.data.posterFile) {
					const { fileId } = await uploadFileToS3(form.data.posterFile, {
						basePath: EVENTS_POSTERS_FOLDER,
						displayName: form.data.name,
						uploadedById: localUser.id
					});
					posterFileId = fileId;
				}

				await tx.insert(paidEvents).values({
					name: form.data.name,
					description: form.data.description,
					attributes: form.data.attributes,
					priceInCents: realPriceToPriceInCents(form.data.price),
					date: form.data.date,
					isRedirecting: form.data.isRedirecting,
					redirectUrl: form.data.redirectUrl,
					redirectButtonText: form.data.redirectButtonText,
					posterFileId
				});
			});

			return { form: withFiles(form), message: 'Събитието беше създадено успешно.' };
		} catch (err) {
			console.error('Error creating public event:', err);
			return fail(500, {
				form: withFiles(form),
				message: 'Възникна грешка при създаването на събитието.'
			});
		}
	}
};
