import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { fetchExpandedVideo } from '$lib/server/db-querying/videos';
import { fail, superValidate, withFiles } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { deleteFileSchema, editVideoSchema } from './schema';
import { deleteUploadedFile, uploadFileToS3 } from '$lib/server/server-utils/files';
import { db } from '$lib/server/db';
import { videos } from '$lib/server/db/schema/videos';
import { eq } from 'drizzle-orm';
import { getAllClassGrades, getAllSubjects } from '$lib/server/db-querying/subjects';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return redirect(302, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditVideos)) {
		error(403, 'Отказан достъп.');
	}

	const video = await fetchExpandedVideo(params.videoId);

	if (!video) {
		error(404, `Видео с ID ${params.videoId} не беше намерено.`);
	}

	const foundSubjects = await getAllSubjects();
	const foundClassGrades = await getAllClassGrades();

	const editVideoForm = await superValidate(zod4(editVideoSchema));

	const deleteFileForm = await superValidate(zod4(deleteFileSchema));

	return {
		video,
		editVideoForm,
		deleteFileForm,
		subjects: foundSubjects,
		classGrades: foundClassGrades
	};
};

export const actions: Actions = {
	async editVideo({ request, locals, params }) {
		const form = await superValidate(request, zod4(editVideoSchema));

		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditVideos)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form: withFiles(form), message: 'Формата е невалидна.' });
		}

		try {
			const video = await fetchExpandedVideo(params.videoId);

			if (!video) {
				return fail(404, { form, message: 'Видео не беше намерено.' });
			}

			let posterFileId: string | undefined;
			let chaptersFileId: string | undefined;

			// Check if there is a poster file present
			if (form.data.posterFile) {
				// If there is a poster file we need to check if the video already has one
				// and delete it before creating the new one

				if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.UploadFiles)) {
					return fail(403, {
						form: withFiles(form),
						message:
							'Постерът не беше качен поради отказан достъп. Нямате права за качване на файлове.'
					});
				}

				if (video.posterFileId) {
					await deleteUploadedFile(video.posterFileId);
				}

				// Create the new poster file
				// Upload the file to S3
				const posterFile = form.data.posterFile;
				const { fileId } = await uploadFileToS3(posterFile, {
					basePath: `posters/video-${video.id}`,
					displayName: posterFile.name,
					uploadedById: locals.user.id
				});

				posterFileId = fileId;
			}

			if (form.data.chaptersFile) {
				// If there is a chapters file we need to check if the video already has one
				// and delete it before creating the new one

				if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.UploadFiles)) {
					return fail(403, {
						form: withFiles(form),
						message:
							'Файлът с глави не беше качен поради отказан достъп. Нямате права за качване на файлове.'
					});
				}

				if (video.chaptersFileId) {
					await deleteUploadedFile(video.chaptersFileId);
				}

				// Create the new chapters file
				// Upload the file to S3
				const chaptersFile = form.data.chaptersFile;
				const { fileId } = await uploadFileToS3(chaptersFile, {
					basePath: `chapters/video-${video.id}`,
					displayName: chaptersFile.name,
					uploadedById: locals.user.id
				});

				chaptersFileId = fileId;
			}

			// Update the video record in the database
			await db
				.update(videos)
				.set({
					displayName: form.data.displayName,
					posterFileId,
					chaptersFileId,
					subjectId: form.data.subjectId,
					classGradeId: form.data.classGradeId
				})
				.where(eq(videos.id, video.id));

			return { form: withFiles(form), message: 'Видео беше успешно редактирано.' };
		} catch (err) {
			console.error(err);
			return fail(500, {
				form: withFiles(form),
				message: 'Възникна грешка при редактиране на видеото.'
			});
		}
	},

	async deletePoster({ request, locals, params }) {
		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteFiles)) {
			error(403, 'Отказан достъп.');
		}

		const form = await superValidate(request, zod4(deleteFileSchema));

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const video = await fetchExpandedVideo(params.videoId);

			if (!video) {
				return fail(404, { form, message: 'Видео не беше намерено.' });
			}

			if (!video.posterFileId) {
				return fail(404, { form, message: 'Видео няма качен постер.' });
			}

			if (video.posterFileId !== form.data.id) {
				return fail(403, { form, message: 'Постерът не принадлежи на това видео.' });
			}

			await deleteUploadedFile(form.data.id);

			return { form, message: 'Постерът беше успешно изтрит.' };
		} catch (err) {
			console.error(err);
			return fail(500, {
				form,
				message: 'Възникна грешка при изтриване на постера.'
			});
		}
	},

	deleteChapters: async ({ request, locals, params }) => {
		if (!locals.user || !checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return redirect(302, '/login');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteFiles)) {
			error(403, 'Отказан достъп.');
		}

		const form = await superValidate(request, zod4(deleteFileSchema));

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const video = await fetchExpandedVideo(params.videoId);

			if (!video) {
				return fail(404, { form, message: 'Видео не беше намерено.' });
			}

			if (!video.chaptersFileId) {
				return fail(404, { form, message: 'Видео няма качен файл с глави.' });
			}

			if (video.chaptersFileId !== form.data.id) {
				return fail(403, { form, message: 'Файлът с глави не принадлежи на това видео.' });
			}

			await deleteUploadedFile(form.data.id);

			return { form, message: 'Файлът с глави беше успешно изтрит.' };
		} catch (err) {
			console.error(err);
			return fail(500, {
				form,
				message: 'Възникна грешка при изтриване на файла с глави.'
			});
		}
	}
};
