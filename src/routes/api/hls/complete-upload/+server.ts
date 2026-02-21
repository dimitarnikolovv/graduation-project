import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { videos } from '$lib/server/db/schema/videos';
import { eq } from 'drizzle-orm';
import { VideoStatusEnum } from '$lib/types/enums';
import { hlsCompleteUploadSchema } from './schema.js';
import z from 'zod';

export const POST = async ({ request }) => {
	const parsedBody = hlsCompleteUploadSchema.safeParse(await request.json());

	if (!parsedBody.success) {
		return json(z.treeifyError(parsedBody.error), { status: 400 });
	}

	const { videoId } = parsedBody.data;

	const [video] = await db
		.update(videos)
		.set({
			status: VideoStatusEnum.uploaded
		})
		.where(eq(videos.id, videoId))
		.returning();

	if (!video) {
		return json({ success: false, error: 'Video not found' }, { status: 404 });
	}

	return json({ success: true });
};
