import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
	checkIfUser,
	checkIfUserAndRole,
	deleteSessionTokenCookie,
	sessionCookieName,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/auth';
import { RolesEnum } from '$lib/types/enums';
import { db } from '$lib/server/db';
import { userPermissions } from '$lib/server/db/schema/userPermissions';
import { eq } from 'drizzle-orm';
import {
	createPermissionsForUser,
	ensureUpToDatePermissions
} from '$lib/server/server-utils/access-control';

import { createDefaultAdminUser } from '$lib/server/server-utils/default-admin';

// Import corn
import '$lib/server/cron';

createDefaultAdminUser();

const populateGeneralSettings: Handle = async ({ event, resolve }) => {
	// Populate Google Analytics and Facebook Pixel IDs from the database

	const acceptCookiesCookie = event.cookies.get('accept-cookies');

	if (!acceptCookiesCookie) {
		event.locals.areCookiesAccepted = null;
	} else {
		event.locals.areCookiesAccepted = acceptCookiesCookie === 'true' ? true : false;
	}

	return resolve(event);
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(sessionCookieName);

	// If no session token is present, set user and session to null and continue
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	let requiredRole: RolesEnum[] = [];

	// Define roles based on the route
	if (event.url.pathname.startsWith('/control-centre')) {
		requiredRole = [RolesEnum.admin, RolesEnum.teacher];
	} else if (event.url.pathname.startsWith('/account')) {
		requiredRole = [RolesEnum.student, RolesEnum.parent];
	}

	// Validate session token and role
	const { session, user } = await validateSessionToken(sessionToken, requiredRole);

	if (session) {
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		console.log(event.url.pathname);

		deleteSessionTokenCookie(event);
	}

	// If the user is deleted, redirect to account deactivated page
	if (
		user?.deletedAt &&
		!event.url.pathname.startsWith('/account-deactivated') &&
		!event.url.pathname.startsWith('/logout')
	) {
		return redirect(302, '/account-deactivated');
	}

	event.locals.user = user;
	event.locals.session = session;

	if (user?.role === RolesEnum.admin || user?.role === RolesEnum.teacher) {
		// Fetch user permissions if the user is an admin or teacher
		const existingPermissions = await db.query.userPermissions.findFirst({
			where: eq(userPermissions.userId, user.id)
		});

		if (existingPermissions) {
			// This is nessessary to ensure that all permissions are present in the object
			// When introducing new permissions, this will ensure that the user has this permissions set to false
			const updatedPermissions = await ensureUpToDatePermissions(existingPermissions);

			event.locals.userPermissions = updatedPermissions.permissions;
		} else {
			// create default permissions
			const createdPermissions = await createPermissionsForUser(user.id);

			event.locals.userPermissions = createdPermissions.permissions;
		}
	}

	return resolve(event);
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { locals } = event;

	if (
		!checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher]) &&
		event.url.pathname.startsWith('/control-centre')
	) {
		return redirect(302, '/');
	}

	if (!checkIfUser(locals) && event.url.pathname.startsWith('/account')) {
		return redirect(302, '/login');
	}

	return resolve(event);
};

export const handle = sequence(populateGeneralSettings, handleAuth, authGuard);
