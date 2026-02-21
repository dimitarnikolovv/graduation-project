// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth').SessionValidationResult['user'];
			session: import('$lib/server/auth').SessionValidationResult['session'];
			userPermissions?: import('$lib/types/permissions').PermissionsObject;
			areCookiesAccepted: boolean | null;
		}

		interface Error {
			code?: string;
			message: string;
		}

		interface PageData {
			title?: string;
			description?: string;
			ogImage?: string;
		}
	} // interface Error {}
	// interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export {};
