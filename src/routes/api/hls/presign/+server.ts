import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '$lib/server/s3';
import { PRIVATE_S3_BUCKET_NAME } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hlsPresignSchema, type HlsPresignSchema } from './schema';
import { z } from 'zod';

async function generatePresignedUrls(body: HlsPresignSchema) {
	const { files } = body;

	const urls = await Promise.all(
		files.map(async ({ originalName, type, key }) => {
			const command = new PutObjectCommand({
				Bucket: PRIVATE_S3_BUCKET_NAME,
				Key: key,
				ContentType: type || 'application/octet-stream'
			});

			const url = await getSignedUrl(s3, command, {
				expiresIn: 60 * 60 * 5 // 5 hours, only for upload, do not cache
			});
			return { originalName, key, url };
		})
	);

	return { urls };
}

export const POST: RequestHandler = async ({ request }) => {
	const parsedBody = hlsPresignSchema.safeParse(await request.json());
	if (!parsedBody.success) {
		return json(z.treeifyError(parsedBody.error), { status: 400 });
	}

	const res = await generatePresignedUrls(parsedBody.data);

	return json(res);
};

export type HlsPresignResponse = Awaited<ReturnType<typeof generatePresignedUrls>>;
