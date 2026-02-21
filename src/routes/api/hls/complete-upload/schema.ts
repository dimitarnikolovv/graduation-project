import z from 'zod';

export const hlsCompleteUploadSchema = z.object({
	videoId: z.string() // The ID of the video being completed
});

export type HlsCompleteUploadSchema = z.infer<typeof hlsCompleteUploadSchema>;
