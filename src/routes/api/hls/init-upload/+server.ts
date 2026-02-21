import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { videos } from '$lib/server/db/schema/videos';
import { generateId } from '$lib/utils/general';
import { RolesEnum, VideoStatusEnum } from '$lib/types/enums.js';
import { hlsInitUploadSchema, type HlsInitUploadSchema } from './schema.js';
import z from 'zod';
import { HLS_UPLOAD_FOLDER } from '$lib/s3.js';
import { checkIfUserAndRole } from '$lib/server/auth.js';

async function initUpload(body: HlsInitUploadSchema, userId: string) {
	const { size, type, webkitRelativePath, hasThumbnails, vttFileRelativePath, displayName } = body;

	// Uploads only the master playlist file

	// The format of the uploaded folder is expected to be:
	// <id>-hls
	// 	-> /master.m3u8
	// 	-> /output_0/playlist_0.m3u8, ...segment files
	// 	-> /output_1/playlist_1.m3u8, ...segment files
	// 	-> /output_2/playlist_2.m3u8, ...segment files
	// 	-> /thumbnails.vtt (optional)
	// 	-> /thumbnails/ (optional)

	const originalName = webkitRelativePath.split('/')[0]; // Extract the original name from the path

	const relativePath = webkitRelativePath.split('/').slice(1).join('/');

	if (!originalName) {
		throw new Error(
			'Invalid folder structure. Expected format: \n<originalName>-hls \n\t-> /master.m3u8 \n\t-> /output_0/playlist_0.m3u8, ...segment files \n\t-> /output_1/playlist_1.m3u8, ...segment files \n\t-> /output_2/playlist_2.m3u8, ...segment files \n\t-> /thumbnails.vtt (optional) \n\t-> /thumbnails/ (optional)'
		);
	}

	const vttFileRelativePathWithoutFolderName = vttFileRelativePath?.split('/').slice(1).join('/');

	const videoId = generateId();

	const pathToUpload = `${HLS_UPLOAD_FOLDER}/${videoId}`;

	const fileKey = `${pathToUpload}/${relativePath}`;

	const vttFileKey =
		hasThumbnails && vttFileRelativePathWithoutFolderName
			? `${pathToUpload}/${vttFileRelativePathWithoutFolderName}`
			: undefined;

	await db.insert(videos).values({
		fileKey,
		id: videoId,
		originalName,
		displayName,
		contentType: type,
		size,
		thumbnailsKey: vttFileKey,
		status: VideoStatusEnum.processing,
		uploadedById: userId
	});

	return { videoId, pathToUpload };
}

export type HlsInitUploadResponse = Awaited<ReturnType<typeof initUpload>>;

export const POST = async ({ request, locals }) => {
	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const parsedBody = hlsInitUploadSchema.safeParse(await request.json());

	if (!parsedBody.success) {
		return json(z.treeifyError(parsedBody.error), { status: 400 });
	}

	try {
		const res = await initUpload(parsedBody.data, locals.user.id);

		return json(res);
	} catch (e) {
		console.error('Failed to initialize HLS upload:', e);

		return json({ error: e }, { status: 400 });
	}
};
