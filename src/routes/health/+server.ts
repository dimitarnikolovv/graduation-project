import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

let isShuttingDown = false;

process.on('SIGTERM', () => {
	console.warn('Received SIGTERM, marking server as shutting down...');

	isShuttingDown = true;
});

async function checkHealth(): Promise<{ status: number; message: string }> {
	if (isShuttingDown) {
		return { status: 503, message: 'Service Unavailable - Server is shutting down' };
	}

	try {
		await db.execute(sql`SELECT 1`);

		return { status: 200, message: 'OK' };
	} catch (error) {
		console.error('Health check failed:', error);
		return { status: 503, message: 'Service Unavailable - Database connection failed' };
	}
}

export const GET: RequestHandler = async () => {
	const health = await checkHealth();

	return json(
		{ status: health.status, message: health.message },
		{
			status: health.status,
			headers: {
				'Cache-Control': 'no-store',
				Connection: 'close',
				'Access-Control-Allow-Origin': '*'
			}
		}
	);
};
