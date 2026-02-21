import { command, getRequestEvent, query } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import z from 'zod';
import { asString, generateCsv } from 'export-to-csv';
import { paidTestEntries } from '$lib/server/db/schema/paidTestEntries';
import { tests } from '$lib/server/db/schema/tests';

const deletePaidTestEntrySchema = z.object({
	id: z.uuid()
});

export const deletePaidTestEntryRemote = command(deletePaidTestEntrySchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditTests)) {
		error(403, 'Отказан достъп.');
	}

	try {
		await db.delete(paidTestEntries).where(eq(paidTestEntries.id, id));
	} catch (err) {
		console.error('Error deleting entry:', err);
		error(500, 'Възникна грешка при изтриването на участника.');
	}
});

const downloadPaidTestEntriesSchema = z.object({
	testId: z.uuid(),
	format: z.enum(['csv', 'txt']).default('csv'),
	target: z.enum(['paid', 'unpaid', 'all']).default('all')
});

export const downloadPaidTestEntriesRemote = query(
	downloadPaidTestEntriesSchema,
	async ({ testId, format, target }) => {
		const { locals } = getRequestEvent();

		if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
			error(403, 'Отказан достъп.');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewTests)) {
			error(403, 'Нямате нужните права за преглед на публични събития.');
		}

		// Get test details
		const test = await db.query.tests.findFirst({
			where: eq(tests.id, testId)
		});

		if (!test) {
			error(404, 'Тестът не беше намерен.');
		}

		function buildEntryFilter() {
			const query = [eq(paidTestEntries.testId, testId)];
			if (target === 'paid') {
				query.push(isNotNull(paidTestEntries.paidAt));
			} else if (target === 'unpaid') {
				query.push(isNull(paidTestEntries.paidAt));
			}

			return and(...query);
		}

		const entryFilter = buildEntryFilter();

		// Get all entries (no pagination for download)
		const entries = await db.query.paidTestEntries.findMany({
			where: entryFilter,

			columns: {
				createdAt: true,
				userId: true
			},
			with: {
				user: {
					columns: {
						passwordHash: false
					}
				}
			},
			orderBy: (t, { asc }) => [asc(t.createdAt)]
		});

		let content: string = '';
		let contentType: string;
		let filename: string;

		if (format === 'csv') {
			const csv = generateCsv({
				useKeysAsHeaders: true
			})(
				entries.map((entry) => ({
					email: entry.user.email,
					name: entry.user.firstName + ' ' + entry.user.lastName,
					userId: entry.userId,
					createdAt: entry.createdAt.toISOString()
				}))
			);

			content = asString(csv);

			contentType = 'text/csv';
			filename = `${test.title.replace(/[ ]/gi, '_')}_emails.csv`;
		} else {
			// TXT format - one email per line
			content = entries.map((entry) => entry.user.email).join('\n');
			contentType = 'text/plain';
			filename = `${test.title.replace(/[ ]/gi, '_')}_emails.txt`;
		}

		return {
			content: content,
			contentType: contentType,
			filename: filename
		};
	}
);

const markPaidTestEntryAsPaidSchema = z.object({
	entryId: z.uuid()
});

export const markPaidTestEntryAsPaidRemote = command(
	markPaidTestEntryAsPaidSchema,
	async ({ entryId }) => {
		const { locals } = getRequestEvent();

		if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
			error(403, 'Отказан достъп.');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditTests)) {
			error(403, 'Отказан достъп.');
		}

		try {
			const [updatedEntry] = await db
				.update(paidTestEntries)
				.set({
					paidAt: new Date()
				})
				.where(eq(paidTestEntries.id, entryId))
				.returning();

			return {
				updatedEntry
			};
		} catch (err) {
			console.error('Error marking entry as paid:', err);
			error(500, 'Възникна грешка при отбелязването на участника като платил.');
		}
	}
);
