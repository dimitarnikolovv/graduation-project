import { error, redirect } from '@sveltejs/kit';
import { users } from '$lib/server/db/schema/auth';
import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserAndRole } from '$lib/server/auth';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

function generateQueryFromParams(searchParams: URLSearchParams) {
	const name = searchParams.get('name')?.trim();
	const email = searchParams.get('email')?.trim();
	const id = searchParams.get('id')?.trim();
	const roles = searchParams.getAll('role') as RolesEnum[];

	const query = [];

	if (email) query.push(ilike(users.email, `%${email}%`));
	if (name) query.push(or(ilike(users.firstName, `%${name}%`), ilike(users.lastName, `%${name}%`)));
	if (id) query.push(eq(users.id, id));
	if (roles.length > 0) query.push(inArray(users.role, roles));

	return query.length > 0 ? and(...query) : undefined;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewUsers)) {
		error(403, 'Access denied. You do not have permission to view this page.');
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '40');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1')); // Ensure valid page

	try {
		const retunedUsers = await db.query.users.findMany({
			orderBy: desc(users.createdAt),
			limit,
			offset: (page - 1) * limit,
			columns: {
				passwordHash: false
			},
			where: generateQueryFromParams(url.searchParams)
		});

		const totalItems = await db.$count(users, generateQueryFromParams(url.searchParams));

		const totalPages = Math.ceil(totalItems / limit);

		return {
			users: retunedUsers,
			limit,
			page,
			totalItems,
			totalPages
		};
	} catch (err) {
		console.log(err);
		return {
			users: [],
			limit,
			page: 1,
			totalItems: 0,
			totalPages: 0
		};
	}
};
