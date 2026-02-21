import { json } from '@sveltejs/kit';
import { deleteUploadedVideo } from '$lib/server/server-utils/files.js';
import { checkIfUserAndRole } from '$lib/server/auth.js';
import { RolesEnum } from '$lib/types/enums.js';

export const POST = async ({ request, locals }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { videoId } = await request.json();

	if (!videoId) {
		return json({ error: 'Missing videoId' }, { status: 400 });
	}

	try {
		await deleteUploadedVideo(videoId);

		return json({ success: true });
	} catch (e) {
		console.error('Failed to cancel upload:', e);
		return json({ error: 'Failed to cancel upload' }, { status: 500 });
	}
};
