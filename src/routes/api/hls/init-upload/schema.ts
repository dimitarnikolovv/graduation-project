import { z } from 'zod';

export const hlsInitUploadSchema = z
	.object({
		size: z.number().min(0), // Size in bytes
		displayName: z.string(), // e.g. "My Video"
		type: z.string(), // e.g. "application/vnd.apple.mpegurl"
		webkitRelativePath: z.string(), // e.g. "<originalName>-hls/master.m3u8"
		hasThumbnails: z.boolean().optional(), // Whether thumbnails are included
		vttFileRelativePath: z.string().optional() // Path to the .vtt file if thumbnails are included
	})
	.check(({ value, issues }) => {
		const { hasThumbnails, vttFileRelativePath } = value;

		if (hasThumbnails && !vttFileRelativePath) {
			issues.push({
				code: 'custom',
				message: 'If hasThumbnails is true, vttFileRelativePath must be provided',
				input: vttFileRelativePath,
				path: ['vttFileRelativePath']
			});
		}
	});

export type HlsInitUploadSchema = z.infer<typeof hlsInitUploadSchema>;
