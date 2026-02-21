import { writable, type Writable } from 'svelte/store';
import type { HlsPresignSchema } from '$api/hls/presign/schema';
import type { HlsPresignResponse } from '$api/hls/presign/+server';
import type { HlsInitUploadSchema } from '$api/hls/init-upload/schema';
import type { HlsInitUploadResponse } from '$api/hls/init-upload/+server';
import type { HlsCompleteUploadSchema } from '$api/hls/complete-upload/schema';

export const HLS_UPLOAD_FOLDER = 'videos/hls' as const;

export const BLOG_POSTS_POSTERS_FOLDER = 'blog-posts/posters' as const;

export const EVENTS_POSTERS_FOLDER = 'events/posters' as const;

export type UploadProgress = {
	videoId: string;
	status: 'idle' | 'uploading' | 'done' | 'error' | 'canceled';
	uploadedBytes: number;
	totalBytes: number;
	currentPart: number;
	totalParts: number;
	percentComplete: number;
};

export function createUploadProgressStore() {
	return writable<UploadProgress>({
		videoId: '',
		status: 'idle', // idle, uploading, done, error
		uploadedBytes: 0,
		totalBytes: 0,
		currentPart: 0,
		totalParts: 0,
		percentComplete: 0
	});
}

type HLSUploadOptions = {
	displayName: string;
	folder: FileList | null;
	uploadProgress: Writable<UploadProgress>;
};

const uploadControllers = new Map<string, AbortController>();

export async function cancelHLSUpload({
	videoId,
	uploadProgress
}: {
	videoId: string;
	uploadProgress: Writable<UploadProgress>;
}) {
	// abort client-side network first
	const ctrl = uploadControllers.get(videoId);
	if (ctrl) {
		ctrl.abort('user-cancelled');
		uploadControllers.delete(videoId);
	}

	// best-effort server cleanup (DB + already-uploaded objects)
	try {
		await fetch('/api/hls/cancel-upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ videoId })
		});
	} catch (e) {
		console.log(e);
	}

	uploadProgress.update((p) => ({ ...p, status: 'canceled' }));
}

export async function uploadHLSViaPresigned({
	displayName,
	folder,
	uploadProgress
}: HLSUploadOptions) {
	if (!folder || folder.length === 0) throw new Error('No files selected for upload');

	const files = Array.from(folder);

	if (files.length === 0) throw new Error('No files to upload');

	// Clear hidden files (e.g. .DS_Store on macOS)
	const hiddenFiles = files.filter((f) => f.name.startsWith('.'));

	if (files.length === hiddenFiles.length) {
		throw new Error('No valid files to upload after filtering hidden files');
	}

	files.splice(0, hiddenFiles.length);

	const masterPlaylist = files.find((f) => f.name.endsWith('master.m3u8'));
	if (!masterPlaylist) throw new Error('Missing *master.m3u8 playlist file');

	const hasThumbnails = files.some((f) => f.webkitRelativePath.includes('thumbnails/'));

	let vttFile: File | undefined;

	// If the upload contains thumbnails, check if they are in the expected format
	if (hasThumbnails) {
		vttFile = files.find((f) => f.name.endsWith('.vtt'));

		if (!vttFile) {
			throw new Error('Missing .vtt file for thumbnails in the uploaded folder');
		}

		const thumbnailFiles = files.filter(
			(f) => f.webkitRelativePath.includes('thumbnails/') && !f.name.endsWith('.vtt')
		);

		if (thumbnailFiles.length === 0) {
			throw new Error(
				'Uploaded folder contains thumbnails directory, but no thumbnail files found.'
			);
		}

		const validThumbnails = thumbnailFiles.every(
			(f) => f.name.endsWith('.jpg') || f.name.endsWith('.png') || f.name.endsWith('.jpeg')
		);

		if (!validThumbnails) {
			throw new Error('Thumbnail files must be in .jpg, .png, or .jpeg format');
		}
	}

	const totalSize = files.reduce((sum, f) => sum + f.size, 0);

	let videoId: string | null = null;

	// temporary controller for early-phase calls:
	let ctrl: AbortController | null = null;

	try {
		// Step 1: Init DB record
		// Call /api/hls/init-upload endpoint with the metadata for the .m3u8 file and the total size
		// This will return the videoId and fileKey for the master playlist

		// temp controller for init/presign:
		ctrl = new AbortController();
		const earlySignal = ctrl.signal;

		const initBody: HlsInitUploadSchema = {
			displayName,
			size: totalSize,
			type: masterPlaylist.type,
			webkitRelativePath: masterPlaylist.webkitRelativePath,
			hasThumbnails: hasThumbnails,
			vttFileRelativePath: vttFile ? vttFile.webkitRelativePath : undefined
		};

		const initRes = await fetch('/api/hls/init-upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(initBody),
			signal: earlySignal
		});

		if (!initRes.ok) {
			const error = await initRes.json();
			throw new Error(`Failed to initialize upload: ${error.message || 'Unknown error'}`);
		}

		const { videoId: returnedId, pathToUpload } = (await initRes.json()) as HlsInitUploadResponse;

		videoId = returnedId;

		const metadata = files.map((file) => {
			const key = `${pathToUpload}/${file.webkitRelativePath.split('/').slice(1).join('/')}`;

			return {
				originalName: file.name,
				webkitRelativePath: file.webkitRelativePath,
				type: file.type,
				key
			};
		});

		// replace temp controller with a dedicated one tied to this videoId
		if (ctrl) ctrl.abort(); // cancel any leftover early requests
		ctrl = new AbortController();
		uploadControllers.set(videoId, ctrl);
		const { signal } = ctrl;

		uploadProgress.set({
			videoId,
			status: 'uploading',
			currentPart: 0,
			totalParts: files.length,
			percentComplete: 0,
			uploadedBytes: 0,
			totalBytes: totalSize
		});

		// Step 2: Generate presigned URLs for each file

		const presignBody: HlsPresignSchema = {
			files: metadata
		};

		const presignRes = await fetch('/api/hls/presign', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(presignBody),
			signal
		});

		const { urls } = (await presignRes.json()) as HlsPresignResponse;

		let uploaded = 0;

		for (let i = 0; i < urls.length; i++) {
			const { key, url } = urls[i];
			const file = files.find((f) =>
				key.endsWith(f.webkitRelativePath.split('/').slice(1).join('/'))
			);

			if (!file) continue;

			uploadProgress.update((p) => ({ ...p, currentPart: i + 1 }));

			// Upload each file to the presigned URL
			const res = await fetch(url, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type || 'application/octet-stream'
				},
				signal
			});

			if (!res.ok) {
				console.log(await res.text());
				throw new Error(`Failed to upload ${file.name}: ${res.statusText}`);
			}

			uploaded += file.size;
			uploadProgress.update((p) => ({
				...p,
				uploadedBytes: uploaded,
				percentComplete: Math.round((uploaded / totalSize) * 100)
			}));
		}

		// Step 3: Finalize upload
		// Call /api/hls/complete-upload endpoint with the returned videoId to finalize the upload,
		// update the video record, and set the status to "uploaded"

		const completeUploadBody: HlsCompleteUploadSchema = {
			videoId
		};

		await fetch('/api/hls/complete-upload', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(completeUploadBody),
			signal
		});

		uploadProgress.set({
			status: 'done',
			videoId,
			currentPart: files.length,
			totalParts: files.length,
			uploadedBytes: totalSize,
			totalBytes: totalSize,
			percentComplete: 100
		});

		return metadata.map(({ originalName, webkitRelativePath, key }) => ({
			originalName,
			webkitRelativePath,
			key
		}));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (err: any) {
		// Aborted by user?
		if (err?.name === 'AbortError' || err?.message === 'user-cancelled') {
			// ensure server-side cleanup
			if (videoId) {
				try {
					await cancelHLSUpload({
						videoId,
						uploadProgress
					});
				} catch (e) {
					console.log(e);
				}
			}
			return [];
		}

		uploadProgress.update((p) => ({ ...p, status: 'error' }));
		if (videoId) {
			try {
				await fetch('/api/hls/cancel-upload', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ videoId })
				});
			} catch (e) {
				console.log(e);
			}
		}
		console.log(err);

		return [];
	} finally {
		if (videoId) uploadControllers.delete(videoId);
		if (ctrl) ctrl.abort(); // free any lingering signals
	}
}
