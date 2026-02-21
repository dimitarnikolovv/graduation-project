import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { getDomain } from 'tldts';
import { sessions, users, type Session, type User } from './db/schema/auth';
import { RolesEnum } from '$lib/types/enums';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { generateId, omitFieldsFromObject } from '$lib/utils/general';
import { PUBLIC_HOST } from '$env/static/public';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';

export const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'session_grad_proj';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Omit<Session, 'createdAt' | 'updatedAt' | 'deletedAt'> = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(sessions).values(session);
	return session;
}

export async function validateSessionToken(token: string, requiredRoles?: RolesEnum[]) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const sessionResult = await db.query.sessions.findFirst({
		with: {
			user: {
				columns: {
					passwordHash: false
				}
			}
		},
		where: eq(sessions.id, sessionId)
	});

	if (!sessionResult) {
		return { session: null, user: null };
	}

	const session = omitFieldsFromObject(sessionResult, ['user']);

	const user = sessionResult.user;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();

	if (sessionExpired) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;

	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, session.id));
	}

	if (requiredRoles?.length && user.role !== RolesEnum.admin) {
		if (user.role && !requiredRoles.includes(user.role)) {
			return { session: null, user: null }; // Deny access if role does not match
		}
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export const sessionCookieConfig = {
	expires: new Date(Date.now() + DAY_IN_MS * 30),
	path: '/',
	httpOnly: true,
	domain: getDomain(new URL(PUBLIC_HOST).toString()) || undefined,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const
};

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		...sessionCookieConfig,
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: sessionCookieConfig.path
	});
}

export function checkIfUserAndRole(locals: App.Locals, role: RolesEnum[] | RolesEnum) {
	if (!locals.user || !locals.user.role) return false;

	if (Array.isArray(role)) {
		return role.includes(locals.user.role) ? true : false;
	}

	return locals.user.role === role ? true : false;
}

export function checkIfUser(locals: App.Locals) {
	return locals.user ? true : false;
}

export type UserRegistrationData = {
	email: string;
	role?: RolesEnum;
	password: string;
	firstName: string;
	lastName: string;
};

export async function registerUser(data: UserRegistrationData) {
	const userId = generateId();
	const passwordHash = await hash(data.password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	// create a user record
	const [createdUser] = await db
		.insert(users)
		.values({
			id: userId,
			email: data.email,
			passwordHash,
			role: data.role,
			firstName: data.firstName,
			lastName: data.lastName
		})
		.returning();

	return createdUser;
}

type LoginAndRedirectParams = {
	event: RequestEvent;
	user: Pick<User, 'id' | 'role'>;
};

export async function loginAndRedirectUser(params: LoginAndRedirectParams) {
	const { event, user } = params;

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);

	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	switch (user.role) {
		case RolesEnum.student:
			return redirect(302, '/account/my-lessons');
		case RolesEnum.admin:
			return redirect(302, '/control-centre-v1');
		case RolesEnum.teacher:
			return redirect(302, '/control-centre-v1');
		case RolesEnum.parent:
			return redirect(302, '/account/parenting');
		default:
			return redirect(302, '/account');
	}
}
