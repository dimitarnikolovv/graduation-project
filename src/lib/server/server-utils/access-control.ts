import { UserPermissionsEnum } from '$lib/types/enums';
import type { PermissionsObject } from '$lib/types/permissions';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { userPermissions, type UserPermission } from '../db/schema/userPermissions';

/**
 * Ensures that the user's permissions are up to date by comparing the existing permissions
 * with the latest set of permissions defined in the UserPermissionsEnum.
 * If a permission is missing, it will be set to false.
 *
 * @param permissions The user's current permissions.
 * @returns The updated permissions.
 */
export async function ensureUpToDatePermissions(permissions: UserPermission) {
	const newPermissionsObject: PermissionsObject = Object.values(UserPermissionsEnum).reduce(
		(acc, key) => {
			acc[key] = permissions.permissions[key] ?? false;
			return acc;
		},
		{} as PermissionsObject
	);

	if (JSON.stringify(newPermissionsObject) === JSON.stringify(permissions.permissions)) {
		// If the permissions object is the same as the existing one, return early
		return permissions;
	}

	const [updatedPermissions] = await db
		.update(userPermissions)
		.set({
			permissions: {
				...newPermissionsObject
			}
		})
		.where(eq(userPermissions.userId, permissions.userId))
		.returning();

	return updatedPermissions;
}

export async function createPermissionsForUser(userId: string, permissions?: PermissionsObject) {
	const newPermissions = {
		userId,
		permissions:
			permissions ??
			Object.values(UserPermissionsEnum).reduce((acc, key) => {
				acc[key] = false;
				return acc;
			}, {} as PermissionsObject)
	};

	const [createdPermissions] = await db.insert(userPermissions).values(newPermissions).returning();

	return createdPermissions;
}

export async function checkIfUserHasAccessToLesson(userId: string, lessonId: string) {
	if (!userId) {
		return false;
	}

	if (!lessonId) {
		return false;
	}

	return true;
}
