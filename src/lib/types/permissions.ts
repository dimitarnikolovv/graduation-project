import { UserPermissionsEnum } from './enums';

export type PermissionsObject = {
	[permission in UserPermissionsEnum]: boolean;
};
