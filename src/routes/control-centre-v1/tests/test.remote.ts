import { command, getRequestEvent } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { tests } from '$lib/server/db/schema/tests';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import z from 'zod';

const deleteTestSchema = z.object({
	id: z.string()
});

export const deleteTestRemote = command(deleteTestSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteTests)) {
		error(403, 'Нямате нужните права за изтриване на тестове.');
	}

	try {
		await db.delete(tests).where(eq(tests.id, id));
	} catch (err) {
		console.log('Error deleting test:', err);
		error(500, 'Възникна грешка при изтриването на теста.');
	}
});

const toggleFeaturedSchema = z.object({
	id: z.string()
});

export const toggleTestFeaturedRemote = command(toggleFeaturedSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.EditTests)) {
		error(403, 'Нямате нужните права за редакция на тестове.');
	}

	try {
		// First, get the current highest featuredOrder
		const maxOrderResult = await db.query.tests.findFirst({
			where: (t, { eq }) => eq(t.isFeatured, true),
			orderBy: (t, { desc }) => [desc(t.featuredOrder)],
			columns: {
				featuredOrder: true
			}
		});

		const newOrder = maxOrderResult ? maxOrderResult.featuredOrder + 1 : 1;

		await db
			.update(tests)
			.set({
				isFeatured: sql`NOT ${tests.isFeatured}`,
				featuredOrder: newOrder
			})
			.where(eq(tests.id, id));
	} catch (err) {
		console.log('Error toggling test featured:', err);
		error(500, 'Възникна грешка при отбелязването на теста като избран.');
	}
});
