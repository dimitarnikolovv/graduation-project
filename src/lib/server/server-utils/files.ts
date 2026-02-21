import { eq } from 'drizzle-orm';
import { db, type Transaction } from '../db';
import { files } from '../db/schema/files';
import { videos } from '../db/schema/videos';
import { s3 } from '../s3';
import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	ListObjectsV2Command,
	PutObjectCommand
} from '@aws-sdk/client-s3';
import { PRIVATE_S3_BUCKET_NAME } from '$env/static/private';
import { HLS_UPLOAD_FOLDER } from '$lib/s3';
import { generateId } from '$lib/utils/general';

export async function deleteUploadedVideo(videoId: string) {
	const foundVideo = await db.query.videos.findFirst({
		where: eq(videos.id, videoId),
		with: {
			posterFile: true,
			chaptersFile: true
		}
	});

	if (!foundVideo) {
		throw new Error(`File with id ${videoId} not found`);
	}

	// handle video deletion

	// List all objects in the directory videos/hls/videoId/
	const listRes = await s3.send(
		new ListObjectsV2Command({
			Bucket: PRIVATE_S3_BUCKET_NAME,
			Prefix: `${HLS_UPLOAD_FOLDER}/${foundVideo.id}/`
		})
	);

	const keys = (listRes.Contents || []).map((obj) => ({ Key: obj.Key! }));

	if (keys.length > 0) {
		await s3.send(
			new DeleteObjectsCommand({
				Bucket: PRIVATE_S3_BUCKET_NAME,
				Delete: { Objects: keys }
			})
		);
	}

	if (foundVideo.posterFile) {
		await s3.send(
			new DeleteObjectCommand({
				Bucket: PRIVATE_S3_BUCKET_NAME,
				Key: foundVideo.posterFile.fileKey
			})
		);

		await db.delete(files).where(eq(files.id, foundVideo.posterFile.id));
	}

	if (foundVideo.chaptersFile) {
		await s3.send(
			new DeleteObjectCommand({
				Bucket: PRIVATE_S3_BUCKET_NAME,
				Key: foundVideo.chaptersFile.fileKey
			})
		);

		await db.delete(files).where(eq(files.id, foundVideo.chaptersFile.id));
	}

	// Delete video record from the database
	await db.delete(videos).where(eq(videos.id, foundVideo.id));
}

export async function deleteUploadedFile(fileId: string, tx?: Transaction) {
	const dbToUse = tx ?? db;

	const foundFile = await dbToUse.query.files.findFirst({
		where: eq(files.id, fileId)
	});

	if (!foundFile) {
		throw new Error(`File with id ${fileId} not found`);
	}

	await s3.send(
		new DeleteObjectCommand({
			Bucket: PRIVATE_S3_BUCKET_NAME,
			Key: foundFile.fileKey
		})
	);

	// Delete file record from the database
	await dbToUse.delete(files).where(eq(files.id, foundFile.id));
}

export async function uploadFileToS3(
	file: File,
	options: {
		basePath: string;
		displayName: string;
		uploadedById: string;
	}
) {
	const fileId = generateId();

	const fileExtension = file.name.split('.').pop();

	if (!fileExtension) {
		throw new Error('File must have an extension');
	}

	const key = `${options.basePath}/${fileId}.${fileExtension}`;

	await s3.send(
		new PutObjectCommand({
			Bucket: PRIVATE_S3_BUCKET_NAME,
			Key: key,
			Body: (await file.arrayBuffer()) as unknown as Buffer,
			ContentType: file.type
		})
	);

	await db.insert(files).values({
		id: fileId,
		displayName: options.displayName,
		originalName: file.name,
		contentType: file.type,
		size: file.size,
		uploadedById: options.uploadedById,
		fileKey: key
	});

	return { key, fileId };
}
