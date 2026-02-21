import z from 'zod';

export const hlsPresignSchema = z.object({
	files: z.array(
		z.object({
			originalName: z.string(), // e.g. "intro.m3u8"
			type: z.string(), // e.g. "application/vnd.apple.mpegurl"
			key: z.string() // e.g. "videos/hls/lesson-123/intro.m3u8"
		})
	)
});

export type HlsPresignSchema = z.infer<typeof hlsPresignSchema>;
