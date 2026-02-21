import type { UserPermissionsEnum } from '$lib/types/enums';
import type { PermissionsObject } from '$lib/types/permissions';

export function checkIfUserHasPermission(
	userPermissions: PermissionsObject | undefined | null,
	targetPermission: UserPermissionsEnum | UserPermissionsEnum[]
): boolean {
	if (!userPermissions || !Object.keys(userPermissions).length) {
		return false; // No permissions defined
	}

	if (Array.isArray(targetPermission)) {
		if (targetPermission.length === 0) {
			return false; // No permissions to check against
		}

		// All permissions must be true
		return targetPermission.every((permission) => userPermissions[permission] === true);
	}

	return userPermissions[targetPermission] === true;
}
