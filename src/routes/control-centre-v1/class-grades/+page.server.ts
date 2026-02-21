import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { checkIfUserAndRole } from '$lib/server/auth';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { updateClassGradeSchema, newClassGradeSchema } from './schema';
import { db } from '$lib/server/db';
import { and, asc, eq, or, ne } from 'drizzle-orm';
import { classGrades } from '$lib/server/db/schema/subjects';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		redirect(307, '/login');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.ViewClassGrades)) {
		error(403, 'Отказан достъп. Нямате нужните права, за да посетите тази страница.');
	}

	const limit = parseInt(url.searchParams.get('limit') ?? '30');
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1')); // Ensure valid page

	const newClassGradeForm = await superValidate(zod4(newClassGradeSchema));
	const updateClassGradeForm = await superValidate(zod4(updateClassGradeSchema));

	try {
		const returnedClassGrades = await db.query.classGrades.findMany({
			limit,
			offset: (page - 1) * limit,
			orderBy: [asc(classGrades.gradeNumber)]
		});

		const totalItems = await db.$count(classGrades);

		const totalPages = Math.ceil(totalItems / limit);

		return {
			newClassGradeForm,
			updateClassGradeForm,
			classGrades: returnedClassGrades,
			limit,
			page: page,
			totalItems,
			totalPages
		};
	} catch (err) {
		console.log(err);
		return {
			newClassGradeForm,
			updateClassGradeForm,
			classGrades: [],
			limit,
			page: 1,
			totalItems: 0,
			totalPages: 0
		};
	}
};

export const actions: Actions = {
	createClassGrade: async (event) => {
		const { locals, request } = event;

		const form = await superValidate(request, zod4(newClassGradeSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.CreateClassGrades)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const foundClassGrade = await db.query.classGrades.findFirst({
				where: or(
					eq(classGrades.name, form.data.name),
					eq(classGrades.slug, form.data.slug),
					eq(classGrades.gradeNumber, form.data.gradeNumber)
				)
			});

			if (foundClassGrade) {
				return fail(409, {
					form,
					message: 'Съществува клас със същите име, URL slug или номер на класа.'
				});
			}

			await db.insert(classGrades).values(form.data);

			return { form, message: 'Класът беше успешно добавен.' };
		} catch (err) {
			console.log(err);
			return fail(500, { form, message: 'Възникна грешка при добавянето на класа.' });
		}
	},

	updateClassGrade: async (event) => {
		const { locals, request } = event;

		const form = await superValidate(request, zod4(updateClassGradeSchema));

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditClassGrades)) {
			return fail(403, { form, message: 'Отказан достъп.' });
		}

		if (!form.valid) {
			return fail(400, { form, message: 'Формата е невалидна.' });
		}

		try {
			const foundClassGrade = await db.query.classGrades.findFirst({
				where: and(
					ne(classGrades.id, form.data.id), // Excludes the current classGrade
					or(
						eq(classGrades.name, form.data.name),
						eq(classGrades.slug, form.data.slug),
						eq(classGrades.gradeNumber, form.data.gradeNumber)
					)
				)
			});

			if (foundClassGrade) {
				return fail(409, {
					form,
					message: 'Съществува клас със същите име, URL slug или номер на класа.'
				});
			}

			await db.update(classGrades).set(form.data).where(eq(classGrades.id, form.data.id));

			return { form, message: 'Класът беше успешно редактиран.' };
		} catch (err) {
			console.log(err);
			return fail(500, { form, message: 'Възникна грешка при редактирането на класа.' });
		}
	}
};
