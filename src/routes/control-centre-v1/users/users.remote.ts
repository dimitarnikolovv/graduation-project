import { getRequestEvent, query } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { and, ne } from 'drizzle-orm';
import { asString, generateCsv } from 'export-to-csv';
import z from 'zod';

const downloadUsersEmailsSchema = z.object({
	format: z.enum(['csv', 'txt']).default('csv')
});

export const downloadUsersEmailsRemote = query(downloadUsersEmailsSchema, async ({ format }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewUsers)) {
		error(403, 'Нямате нужните права за преглед на публични събития.');
	}

	const query = and(ne(users.role, RolesEnum.admin), ne(users.role, RolesEnum.teacher));

	const totoalUsersCount = await db.$count(users, query);

	const limit = 300;
	let page = 0;

	const entries: string[] = [];

	while (entries.length < totoalUsersCount) {
		const usersBatch = await db.query.users.findMany({
			where: query,
			limit,
			offset: page * limit,
			columns: {
				email: true
			}
		});

		entries.push(...usersBatch.map((u) => u.email));

		page++;
	}

	let content: string = '';
	let contentType: string;
	let filename: string;

	if (format === 'csv') {
		const csv = generateCsv({
			useKeysAsHeaders: true
		})(
			entries.map((entry) => ({
				email: entry
			}))
		);

		content = asString(csv);

		contentType = 'text/csv';
		filename = `user-emails-${new Date().toLocaleDateString('bg').replace(/[. ]/g, '-')}.csv`;
	} else {
		// TXT format - one email per line
		content = entries.join('\n');
		contentType = 'text/plain';
		filename = `user-emails-${new Date().toLocaleDateString('bg').replace(/[. ]/g, '-')}.txt`;
	}

	return {
		content: content,
		contentType: contentType,
		filename: filename
	};
});
