import { query } from '$app/server';
import { searchForUser } from '$lib/server/db-querying/users';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

const searchForUserRemoteSchema = z.object({
	searchTerm: z.string(),
	limit: z.number().optional(),
	page: z.number().optional()
});

export const searchForUserRemote = query(
	searchForUserRemoteSchema,
	async ({ searchTerm, limit, page }) => {
		try {
			const result = await searchForUser({
				searchTerm,
				page,
				limit
			});

			return result;
		} catch (err) {
			console.error('Error searching for lessons:', err);
			error(500, 'Грешка при търсене на уроци');
		}
	}
);
