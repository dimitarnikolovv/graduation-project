import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { deleteAdminSchema } from './schema';
import { error } from '@sveltejs/kit';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { users } from '$lib/server/db/schema/auth';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewAdmins)) {
		error(403, 'Отказан достъп. Нямате нужните права, за да посетите тази страница.');
	}

	const deleteAdminForm = await superValidate(zod4(deleteAdminSchema));

	const limit = parseInt(url.searchParams.get('limit') ?? '30');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));

	try {
		const foundAdminUsers = await db.query.users.findMany({
			limit,
			offset: (page - 1) * limit,
			where: eq(users.role, RolesEnum.admin),
			orderBy: [asc(users.firstName), asc(users.lastName)]
		});

		const totalItems = await db.$count(users, eq(users.role, RolesEnum.admin));

		const totalPages = Math.ceil(totalItems / limit);

		return {
			users: foundAdminUsers,
			limit,
			page,
			totalItems,
			totalPages,
			deleteAdminForm
		};
	} catch (err) {
		console.log(err);

		return {
			users: [],
			page: 1,
			limit,
			totalItems: 0,
			totalPages: 0,
			deleteAdminForm
		};
	}
};

export const actions: Actions = {
	deleteAdmin: async (event) => {
		const { locals } = event;

		const form = await superValidate(event.request, zod4(deleteAdminSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditAdmins)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const admin = await db.query.users.findFirst({ where: eq(users.id, form.data.id) });

			const adminsCount = await db.$count(users, eq(users.role, RolesEnum.admin));

			if (adminsCount === 1) {
				return fail(400, { form, message: 'Не можете да изтриете единствения администратор.' });
			}

			if (admin) {
				await db.delete(users).where(eq(users.id, form.data.id));

				return { form, message: 'Администраторът беше успешно изтрит.' };
			}

			return fail(404, { form, message: 'Администраторът не беше намерен.' });
		} catch (err) {
			console.log(err);
			return fail(500, { form, message: 'Възникна грешка при изтриването на администратора.' });
		}
	}
};
