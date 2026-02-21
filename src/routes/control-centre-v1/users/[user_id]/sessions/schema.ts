import { z } from 'zod';

export const deleteSessionSchema = z.object({
	sessionId: z.string(),
	userId: z.string()
});

export type DeleteSessionSchema = z.infer<typeof deleteSessionSchema>;

export const deleteAllSessionsSchema = z.object({
	userId: z.string()
});

export type DeleteAllSessionSchema = z.infer<typeof deleteAllSessionsSchema>;
