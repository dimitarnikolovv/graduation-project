import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '$lib/server/s3';
import { PRIVATE_S3_BUCKET_NAME } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CACHE_CONTROL_FILES_EXPIRES_IN_SECONDS } from '$lib/utils/constants';

export const GET: RequestHandler = async ({ params }) => {
	const { fileKey } = params;

	// if (!locals.user) throw error(403, 'Unauthorized');
	if (!fileKey) throw error(400, 'Missing file key');

	try {
		const signedUrl = await getSignedUrl(
			s3,
			new GetObjectCommand({
				Bucket: PRIVATE_S3_BUCKET_NAME,
				Key: fileKey,
				ResponseCacheControl: `public, max-age=${CACHE_CONTROL_FILES_EXPIRES_IN_SECONDS}, immutable`,
				ResponseExpires: new Date(Date.now() + CACHE_CONTROL_FILES_EXPIRES_IN_SECONDS * 1000)
			}),
			{ expiresIn: CACHE_CONTROL_FILES_EXPIRES_IN_SECONDS } // 5 days
		);

		return new Response(null, {
			status: 302,
			headers: {
				Location: signedUrl,
				// Cache for 5 days
				'Cache-Control': `public, max-age=${CACHE_CONTROL_FILES_EXPIRES_IN_SECONDS}, immutable`,
				Etag: fileKey,
				Expires: new Date(Date.now() + CACHE_CONTROL_FILES_EXPIRES_IN_SECONDS * 1000).toUTCString()
			}
		});
	} catch (e) {
		console.error('Failed to sign file redirect:', e);
		throw error(404, 'Could not generate stream URL');
	}
};
