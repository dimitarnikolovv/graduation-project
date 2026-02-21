import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { updateSubjectSchema, newSubjectSchema } from './schema';
import { db } from '$lib/server/db';
import { and, asc, eq, or, ne } from 'drizzle-orm';
import { subjects } from '$lib/server/db/schema/subjects';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewSubjects)) {
		error(403, 'Отказан достъп. Нямате нужните права, за да посетите тази страница.');
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '30');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1')); // Ensure valid page

	const newSubjectForm = await superValidate(zod4(newSubjectSchema));
	const updateSubjectForm = await superValidate(zod4(updateSubjectSchema));

	try {
		const returnedSubjects = await db.query.subjects.findMany({
			limit,
			offset: (page - 1) * limit,
			orderBy: [asc(subjects.name)]
		});

		const totalItems = await db.$count(subjects);

		const totalPages = Math.ceil(totalItems / limit);

		return {
			newSubjectForm,
			updateSubjectForm,
			subjects: returnedSubjects,
			limit,
			page: page,
			totalItems,
			totalPages
		};
	} catch (err) {
		console.log(err);
		return {
			newSubjectForm,
			updateSubjectForm,
			subjects: [],
			limit,
			page: 1,
			totalItems: 0,
			totalPages: 0
		};
	}
};

export const actions: Actions = {
	createSubject: async (event) => {
		const { locals, request } = event;

		const form = await superValidate(request, zod4(newSubjectSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateSubjects)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const foundSubject = await db.query.subjects.findFirst({
				where: or(eq(subjects.name, form.data.name), eq(subjects.slug, form.data.slug))
			});

			if (foundSubject) {
				return fail(409, { form, message: 'Съществува предмет със същите име или URL slug.' });
			}

			await db.insert(subjects).values(form.data);

			return { form, message: 'Предметът беше успешно добавен.' };
		} catch (err) {
			console.log(err);
			return fail(500, { form, message: 'Възникна грешка при добавяне на предмета.' });
		}
	},

	updateSubject: async (event) => {
		const { locals, request } = event;

		const form = await superValidate(request, zod4(updateSubjectSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditSubjects)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const foundSubject = await db.query.subjects.findFirst({
				where: and(
					ne(subjects.id, form.data.id), // Excludes the current subject
					or(eq(subjects.name, form.data.name), eq(subjects.slug, form.data.slug))
				)
			});

			if (foundSubject) {
				return fail(409, { form, message: 'Съществува предмет с такова име или URL slug.' });
			}

			await db.update(subjects).set(form.data).where(eq(subjects.id, form.data.id));

			return { form, message: 'Предметът беше успешно редактиран.' };
		} catch (err) {
			console.log(err);
			return fail(500, { form, message: 'Възникна грешка при редактиране на предмета.' });
		}
	}
};
