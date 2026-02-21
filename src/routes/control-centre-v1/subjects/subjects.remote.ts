import { command, getRequestEvent } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { lessonGroups } from '$lib/server/db/schema/lessonGroups';
import { lessons } from '$lib/server/db/schema/lessons';
import { subjects } from '$lib/server/db/schema/subjects';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error, isHttpError } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import z from 'zod';

const deleteSubjectSchema = z.object({
	id: z.int().positive()
});

export const deleteSubjectRemote = command(deleteSubjectSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditEvents)) {
		error(403, 'Отказан достъп.');
	}

	try {
		// Check if there is a lesson associated with this subject
		const associatedLesson = await db.query.lessons.findFirst({
			where: eq(lessons.subjectId, id)
		});

		if (associatedLesson) {
			error(
				409,
				'Предметът не може да бъде изтрит, тъй като има свързани уроци, които го използват.'
			);
		}

		// Check if there is a lesson group associated with this subject
		const associatedLessonGroup = await db.query.lessonGroups.findFirst({
			where: eq(lessonGroups.subjectId, id)
		});

		if (associatedLessonGroup) {
			error(
				409,
				'Предметът не може да бъде изтрит, тъй като има свързани групи от уроци, които го използват.'
			);
		}

		await db.delete(subjects).where(eq(subjects.id, id));
	} catch (err) {
		console.log(err);

		if (isHttpError(err, 409)) {
			error(409, err.body.message);
		}

		error(500, 'Възникна грешка при изтриването на предмета.');
	}
});

const massDeleteSubjectsSchema = z.object({
	ids: z.int().positive().array().min(1, { error: 'Изберете поне един предмет' })
});

export const massDeleteSubjectsRemote = command(massDeleteSubjectsSchema, async ({ ids }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditEvents)) {
		error(403, 'Отказан достъп.');
	}

	try {
		if (ids.length === 0) {
			error(400, 'Няма избрани предмети за изтриване.');
		}

		// Delete the subjects matching the IDs
		await db.delete(subjects).where(inArray(subjects.id, ids));
	} catch (err) {
		console.log(err);
		error(500, 'Възникна грешка при изтриването на предметите.');
	}
});
