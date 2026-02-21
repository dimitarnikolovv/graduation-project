import { desc, eq, ilike, or } from 'drizzle-orm';
import { users } from '../db/schema/auth';
import { db } from '../db';

type SearchForUserParams = {
	searchTerm: string;
	page?: number;
	limit?: number;
};

export async function searchForUser(params: SearchForUserParams) {
	const { searchTerm, page = 1, limit = 10 } = params;

	const query = or(
		ilike(users.firstName, `%${searchTerm}%`),
		ilike(users.lastName, `%${searchTerm}%`),
		eq(users.id, searchTerm),
		ilike(users.email, `%${searchTerm}%`)
	);

	const results = await db.query.users.findMany({
		columns: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			role: true
		},

		where: query,
		limit: limit,
		offset: (page - 1) * limit,
		orderBy: [desc(users.firstName), desc(users.lastName)]
	});

	const totalItems = await db.$count(users, query);

	const totalPages = Math.ceil(totalItems / limit);

	return { results, totalItems, totalPages };
}

export type SearchForUserResult = Awaited<ReturnType<typeof searchForUser>>;
