import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '$lib/server/s3';
import { PRIVATE_S3_BUCKET_NAME } from '$env/static/private';
import { error } from '@sveltejs/kit';
import { extname, dirname } from 'node:path';
import type { RequestHandler } from './$types';
import { PUBLIC_HOST } from '$env/static/public';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { videos } from '$lib/server/db/schema/videos';
import { CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS } from '$lib/utils/constants';

// const cacheControl = {
// 	ResponseCacheControl: `public, max-age=${CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS}, immutable`,
// 	ResponseExpires: new Date(Date.now() + CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS * 1000)
// };

export const GET: RequestHandler = async ({ params }) => {
	const { fileKey, videoId } = params;

	const ext = extname(fileKey);

	try {
		// Basic auth for private videos
		const video = await db.query.videos.findFirst({
			where: eq(videos.id, videoId)
		});

		if (!video) {
			throw error(404, 'Video not found');
		}

		// if (video.isPaid) {
		// 	// TODO: improve auth check and check if the user has permission to view the video, eg
		// 	// is enrolled in the course, or the video is shared with them, etc.
		// 	if (!locals.user) {
		// 		throw error(401, 'Unauthorized');
		// 	}
		// }
	} catch (e: unknown) {
		console.error('Auth check failed:', e);

		throw error(403, 'Access denied.');
	}

	// Handle .m3u8 playlists
	if (ext === '.m3u8') {
		try {
			const res = await s3.send(
				new GetObjectCommand({
					Bucket: PRIVATE_S3_BUCKET_NAME,
					Key: fileKey
					// ...cacheControl
				})
			);

			if (!res.Body) throw error(404, 'Playlist not found');

			const rawText = await res.Body.transformToString();
			const basePath = dirname(fileKey);

			const lines = rawText.split('\n');
			const rewritten = await Promise.all(
				lines.map(async (line) => {
					// Keep comments and empty lines
					if (line.trim() === '' || line.startsWith('#')) return line;

					// .ts files -> sign with presigned URL
					if (line.endsWith('.ts')) {
						const tsKey = `${basePath}/${line}`;
						const signed = await getSignedUrl(
							s3,
							new GetObjectCommand({
								Bucket: PRIVATE_S3_BUCKET_NAME,
								Key: tsKey
								// ...cacheControl
							}),
							{ expiresIn: CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS }
						);
						return signed;
					}

					// .m3u8 files -> rewrite to point to this API
					if (line.endsWith('.m3u8')) {
						const innerKey = `${basePath}/${line}`;
						return new URL(`${PUBLIC_HOST}/api/hls/stream/${videoId}/${innerKey}`).toString();
					}

					// Fallback (unchanged)
					return line;
				})
			);

			return new Response(rewritten.join('\n'), {
				headers: {
					// 'Content-Type': 'application/vnd.apple.mpegurl',
					// 'Cache-Control': `public, max-age=${CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS}, immutable`,
					// Etag: fileKey,
					// Expires: new Date(Date.now() + CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS * 1000).toUTCString()
				}
			});
		} catch (e) {
			console.error('Failed to rewrite .m3u8 file:', e);
			throw error(404, 'Could not fetch playlist');
		}
	}

	// Handle .vtt files
	if (ext === '.vtt') {
		try {
			const res = await s3.send(
				new GetObjectCommand({
					Bucket: PRIVATE_S3_BUCKET_NAME,
					Key: fileKey
					// No caching for VTT files
				})
			);

			if (!res.Body) throw error(404, 'VTT file not found');

			const vttRaw = await res.Body.transformToString();
			const basePath = dirname(fileKey);

			const rewritten = vttRaw
				.split('\n')
				.map((line) => {
					if (line.trim().endsWith('.jpg')) {
						const imgKey = `${basePath}/${line.trim()}`;
						const signedUrl = new URL(
							`${PUBLIC_HOST}/api/hls/stream/${videoId}/${imgKey}`
						).toString();

						return signedUrl;
					}
					return line;
				})
				.join('\n');

			return new Response(rewritten, {
				headers: {
					'Content-Type': 'text/vtt',
					'Cache-Control': 'no-store'
				}
			});
		} catch (e) {
			console.error('Failed to rewrite .vtt file:', e);
			throw error(404, 'Could not fetch VTT file');
		}
	}

	// All other files -> redirect to presigned URL
	try {
		const signedUrl = await getSignedUrl(
			s3,
			new GetObjectCommand({
				Bucket: PRIVATE_S3_BUCKET_NAME,
				Key: fileKey
				// ...cacheControl
			}),
			{ expiresIn: CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS }
		);

		return new Response(null, {
			status: 302,
			headers: {
				Location: signedUrl
				// 'Cache-Control': `public, max-age=${CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS}, immutable`,
				// Etag: fileKey,
				// Expires: new Date(Date.now() + CACHE_CONTROL_HLS_EXPIRES_IN_SECONDS * 1000).toUTCString()
			}
		});
	} catch (e) {
		console.error('Failed to sign file redirect:', e);
		throw error(404, 'Could not generate stream URL');
	}
};
