import { command, getRequestEvent, query } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { publicEventEntries } from '$lib/server/db/schema/publicEventEntries';
import { publicEvents } from '$lib/server/db/schema/publicEvents';
import { deleteUploadedFile } from '$lib/server/server-utils/files';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import z from 'zod';
import { asString, generateCsv } from 'export-to-csv';

const deletePublicEventSchema = z.object({
	id: z.uuid()
});

export const deletePublicEventRemote = command(deletePublicEventSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return { success: false, code: 401, message: 'Отказан достъп.' };
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteEvents)) {
		return { success: false, code: 403, message: 'Отказан достъп.' };
	}

	try {
		await db.transaction(async (tx) => {
			const [deletedEvent] = await tx
				.delete(publicEvents)
				.where(eq(publicEvents.id, id))
				.returning();

			if (deletedEvent.posterFileId) {
				await deleteUploadedFile(deletedEvent.posterFileId, tx);
			}
		});

		return { success: true, code: 200, message: 'Събитието беше изтрито успешно.' };
	} catch (err) {
		console.log('Error deleting public event:', err);
		return {
			success: false,
			code: 500,
			message: 'Възникна грешка при изтриването на събитието.'
		};
	}
});

const deletePosterSchema = z.object({
	eventId: z.string().min(1, 'Event ID е задължително поле.')
});

export const deletePublicEventPosterRemote = command(deletePosterSchema, async ({ eventId }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		return { success: false, code: 401, message: 'Отказан достъп.' };
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditEvents)) {
		return { success: false, code: 403, message: 'Отказан достъп.' };
	}

	try {
		await db.transaction(async (tx) => {
			const post = await tx.query.publicEvents.findFirst({
				where: eq(publicEvents.id, eventId),
				columns: {
					id: true,
					posterFileId: true
				}
			});

			if (!post) {
				throw new Error('Събитието не беше намерено.', { cause: 404 });
			}

			if (!post.posterFileId) {
				throw new Error('Събитието няма прикачен постер.', { cause: 400 });
			}

			// Delete the file from S3
			await deleteUploadedFile(post.posterFileId);

			// Update the public event to remove the poster reference
			await tx.update(publicEvents).set({ posterFileId: null }).where(eq(publicEvents.id, post.id));
		});

		return { success: true, code: 200, message: 'Постерът беше изтрит успешно.' };
	} catch (err) {
		console.error(err);
		if (err instanceof Error && err.cause === 404) {
			return { success: false, code: 404, message: 'Събитието не беше намерено.' };
		}
		if (err instanceof Error && err.cause === 400) {
			return { success: false, code: 400, message: 'Събитието няма прикачен постер.' };
		}
		return { success: false, code: 500, message: 'Възникна грешка при изтриването на постера.' };
	}
});

const deletePublicEventEntrySchema = z.object({
	id: z.uuid(),
	eventId: z.uuid()
});

export const deletePublicEventEntryRemote = command(
	deletePublicEventEntrySchema,
	async ({ id, eventId }) => {
		const { locals } = getRequestEvent();

		if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
			return { success: false, code: 401, message: 'Отказан достъп.' };
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditEvents)) {
			return { success: false, code: 403, message: 'Отказан достъп.' };
		}

		try {
			await db
				.delete(publicEventEntries)
				.where(and(eq(publicEventEntries.id, id), eq(publicEventEntries.eventId, eventId)));

			return { success: true, code: 200, message: 'Участникът беше изтрит успешно.' };
		} catch (err) {
			console.error('Error deleting entry:', err);
			return {
				success: false,
				code: 500,
				message: 'Възникна грешка при изтриването на участника.'
			};
		}
	}
);

const downloadPublicEventEntriesSchema = z.object({
	eventId: z.uuid(),
	format: z.enum(['csv', 'txt']).default('csv')
});

export const downloadPublicEventEntriesRemote = query(
	downloadPublicEventEntriesSchema,
	async ({ eventId, format }) => {
		const { locals } = getRequestEvent();

		if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
			error(401, 'Отказан достъп.');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewEvents)) {
			error(403, 'Отказан достъп.');
		}

		// Get event details
		const event = await db.query.publicEvents.findFirst({
			where: eq(publicEvents.id, eventId)
		});

		if (!event) {
			error(404, 'Събитието не беше намерено.');
		}

		// Get all entries (no pagination for download)
		const entries = await db.query.publicEventEntries.findMany({
			where: eq(publicEventEntries.eventId, eventId),
			columns: {
				createdAt: true,
				atendeeEmail: true,
				atendeeName: true
			},
			orderBy: (publicEventEntries, { asc }) => [asc(publicEventEntries.createdAt)]
		});

		let content: string = '';
		let contentType: string;
		let filename: string;

		if (format === 'csv') {
			const csv = generateCsv({
				useKeysAsHeaders: true
			})(
				entries.map((entry) => ({
					email: entry.atendeeEmail,
					name: entry.atendeeName,
					createdAt: entry.createdAt.toISOString()
				}))
			);

			content = asString(csv);

			contentType = 'text/csv';
			filename = `${event.name.replace(/[ ]/gi, '_')}_emails.csv`;
		} else {
			// TXT format - one email per line
			content = entries.map((entry) => entry.atendeeEmail).join('\n');
			contentType = 'text/plain';
			filename = `${event.name.replace(/[ ]/gi, '_')}_emails.txt`;
		}

		return {
			content: content,
			contentType: contentType,
			filename: filename
		};
	}
);
