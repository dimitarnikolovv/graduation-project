import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { fetchPublishedTestById } from '$lib/server/db-querying/tests';
import { checkIfUserHasAccessToTest } from '$lib/server/server-utils/tests';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	const currentUser = locals.user;

	const foundTest = await fetchPublishedTestById(params.test_id);

	if (!foundTest) {
		error(404, `Тестът не беше намерен.`);
	}

	if (!currentUser) {
		redirect(302, `/tests/purchase/${foundTest.id}`);
	}

	// Check if the user is allowed to take this test, eg. has active subscription if the test requires it etc

	const isUserAllowedToTakeTest = await checkIfUserHasAccessToTest({
		userId: currentUser.id,
		testId: foundTest.id
	});

	if (!isUserAllowedToTakeTest) {
		redirect(302, `/tests/purchase/${foundTest.id}`);
	}

	return {
		foundTest
	};
};
