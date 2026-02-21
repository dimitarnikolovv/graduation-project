import {
	PRIVATE_CREATE_DEFAULT_ADMIN,
	PRIVATE_DEFAULT_ADMIN_EMAIL,
	PRIVATE_DEFAULT_ADMIN_PASSWORD
} from '$env/static/private';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema/auth';
import { hash } from '@node-rs/argon2';
import { generateId } from '$lib/utils/general';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { userPermissions } from '../db/schema/userPermissions';

async function setDefaultAdminPermissions(userId: string) {
	const existingPermissions = await db.query.userPermissions.findFirst({
		where: eq(userPermissions.userId, userId)
	});

	const allPermissions = Object.values(UserPermissionsEnum).reduce(
		(acc, perm) => {
			acc[perm] = true;
			return acc;
		},
		{} as Record<UserPermissionsEnum, boolean>
	);

	if (existingPermissions) {
		// Update existing permissions to ensure all are set to true
		await db
			.update(userPermissions)
			.set({ permissions: allPermissions })
			.where(eq(userPermissions.userId, userId));

		return;
	}

	// Set all permissions
	await db.insert(userPermissions).values({
		userId,
		permissions: allPermissions
	});
}

export async function createDefaultAdminUser() {
	const createDefaultAdmin = PRIVATE_CREATE_DEFAULT_ADMIN === 'TRUE';
	const defaultAdminEmail = PRIVATE_DEFAULT_ADMIN_EMAIL;
	const defaultAdminPassword = PRIVATE_DEFAULT_ADMIN_PASSWORD;

	if (!createDefaultAdmin || !defaultAdminEmail || !defaultAdminPassword) {
		console.log('Default admin creation is disabled or not properly configured.');
		return;
	}

	try {
		const existingAdmin = await db.query.users.findFirst({
			where: eq(users.email, defaultAdminEmail)
		});

		if (existingAdmin) {
			console.log('Default admin user already exists.');

			// If the admin exist, just update the permissions to ensure they are correct
			await setDefaultAdminPermissions(existingAdmin.id);
			return;
		}
	} catch (err) {
		console.error('Error checking for existing default admin user:', err);
		return;
	}

	const userId = generateId();
	const passwordHash = await hash(defaultAdminPassword, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	try {
		await db.insert(users).values({
			id: userId,
			email: defaultAdminEmail,
			firstName: 'Default',
			lastName: 'Admin',
			passwordHash,
			role: RolesEnum.admin,
			createdAt: new Date()
		});

		console.log(`Default admin user created with email: ${defaultAdminEmail}`);

		await setDefaultAdminPermissions(userId);
	} catch (err) {
		console.error('Error creating default admin user:', err);
	}
}
