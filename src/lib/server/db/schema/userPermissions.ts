import { json, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { relations } from 'drizzle-orm';
import type { PermissionsObject } from '../../../types/permissions';
import { UserPermissionsEnum } from '../../../types/enums';

// User Permissions Table
export const userPermissions = pgTable('user_permissions', {
	id: serial('id').primaryKey(),
	permissions: json('permissions')
		.$type<PermissionsObject>()
		.notNull()
		.default(
			Object.values(UserPermissionsEnum).reduce((acc, key) => {
				acc[key] = false;
				return acc;
			}, {} as PermissionsObject)
		),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});

export type UserPermission = typeof userPermissions.$inferSelect;

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
	user: one(users, {
		references: [users.id],
		fields: [userPermissions.userId]
	})
}));
