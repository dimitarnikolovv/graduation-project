import { command, getRequestEvent } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { lessonGroups } from '$lib/server/db/schema/lessonGroups';
import { lessons } from '$lib/server/db/schema/lessons';
import { classGrades } from '$lib/server/db/schema/subjects';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error, isHttpError } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import z from 'zod';

const deleteClassGradeSchema = z.object({
	id: z.int().positive()
});

export const deleteClassGradeRemote = command(deleteClassGradeSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteClassGrades)) {
		error(403, 'Отказан достъп.');
	}

	try {
		// Check if there is a lesson associated with this classGrade
		const associatedLesson = await db.query.lessons.findFirst({
			where: eq(lessons.classGradeId, id)
		});

		if (associatedLesson) {
			error(409, 'Класът не може да бъде изтрит, тъй като има свързани уроци, които го използват.');
		}

		// Check if there is a lesson group associated with this classGrade
		const associatedLessonGroup = await db.query.lessonGroups.findFirst({
			where: eq(lessonGroups.classGradeId, id)
		});

		if (associatedLessonGroup) {
			error(
				409,
				'Класът не може да бъде изтрит, тъй като има свързани групи уроци, които го използват.'
			);
		}

		await db.delete(classGrades).where(eq(classGrades.id, id));
	} catch (err) {
		console.log(err);

		if (isHttpError(err, 409)) {
			error(409, err.body.message);
		}

		error(500, 'Възникна грешка при изтриването на класа.');
	}
});

const massDeleteClassGradesSchema = z.object({
	ids: z.int().positive().array().min(1, { error: 'Изберете поне един клас' })
});

export const massDeleteClassGradesRemote = command(massDeleteClassGradesSchema, async ({ ids }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteClassGrades)) {
		error(403, 'Отказан достъп.');
	}

	try {
		if (ids.length === 0) {
			error(400, 'Няма избрани класове за изтриване.');
		}

		// Delete the classGrades matching the IDs
		await db.delete(classGrades).where(inArray(classGrades.id, ids));
	} catch (err) {
		console.log(err);
		error(500, 'Възникна грешка при изтриването на класовете.');
	}
});
