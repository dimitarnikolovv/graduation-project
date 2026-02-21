import { command, getRequestEvent, query } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { lessonGroups } from '$lib/server/db/schema/lessonGroups';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import z from 'zod';

const getNextOrderNumberParamsSchema = z.object({
	subjectId: z.int().positive(),
	classGradeId: z.int().positive(),
	groupId: z.int().positive().optional()
});

export const getNextOrderNumber = query(
	getNextOrderNumberParamsSchema,
	async ({ subjectId, classGradeId, groupId }) => {
		const result = await db.query.lessonGroups.findFirst({
			where: and(
				eq(lessonGroups.subjectId, subjectId),
				eq(lessonGroups.classGradeId, classGradeId)
			),
			orderBy: [desc(lessonGroups.order)],
			columns: {
				id: true,
				order: true
			}
		});

		if (groupId && result?.id === groupId) {
			return result.order;
		}

		return result ? result.order + 1 : 1;
	}
);

const deleteLessonGroupSchema = z.object({
	id: z.int().positive()
});

export const deleteLessonGroupRemote = command(deleteLessonGroupSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteLessonGroups)) {
		error(403, 'Отказан достъп.');
	}

	try {
		await db.delete(lessonGroups).where(eq(lessonGroups.id, id));
	} catch (err) {
		console.log(err);
		error(500, 'Възникна грешка при изтриването на раздела.');
	}
});

const massDeleteLessonGroupsSchema = z.object({
	ids: z.int().positive().array().min(1, { error: 'Изберете поне една група' })
});

export const massDeleteLessonGroupsRemote = command(
	massDeleteLessonGroupsSchema,
	async ({ ids }) => {
		const { locals } = getRequestEvent();

		if (!checkIfUserAndRole(locals, RolesEnum.admin)) {
			error(403, 'Отказан достъп.');
		}

		if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteLessonGroups)) {
			error(403, 'Отказан достъп.');
		}

		try {
			if (ids.length === 0) {
				error(400, 'Няма избрани раздели за изтриване.');
			}

			// Delete the subjects matching the IDs
			await db.delete(lessonGroups).where(inArray(lessonGroups.id, ids));
		} catch (err) {
			console.log(err);
			error(500, 'Възникна грешка при изтриването на разделите.');
		}
	}
);
