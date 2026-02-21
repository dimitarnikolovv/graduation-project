import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PRIVATE_REDIS_CONNECTION_URL } from '$env/static/private';
import { db } from '../db';
import { testAttempts, tests } from '../db/schema/tests';
import { AttemptStatusEnum } from '$lib/types/enums';
import { eq, and, sql, gt } from 'drizzle-orm';
import { gradeAndSubmitTestAttempt } from '../server-utils/tests';

if (!PRIVATE_REDIS_CONNECTION_URL) {
	throw new Error('PRIVATE_REDIS_CONNECTION_URL is not defined');
}

const connection = new IORedis(PRIVATE_REDIS_CONNECTION_URL, { maxRetriesPerRequest: null });

const submitExpiredTestsQueue = new Queue('submitExpiredTestAttemptsQueue', {
	connection
});

await submitExpiredTestsQueue.upsertJobScheduler('submitExpiredTestAttempts', {
	// Every 1 minute
	pattern: '*/1 * * * *'
});

new Worker(
	'submitExpiredTestAttemptsQueue',
	async () => {
		// console.log('submit expired test attempts job started');
		// Update all test attempts that are started, where the test have a time limit and have exceeded the time limit
		try {
			const startedAttempts = await db
				.select({
					attemptId: testAttempts.id,
					testId: testAttempts.testId,
					startedAt: testAttempts.startedAt,
					timeLimitSec: tests.timeLimitSec,
					userId: testAttempts.userId
				})
				.from(testAttempts)
				.where(
					and(
						eq(testAttempts.status, AttemptStatusEnum.Started),
						gt(tests.timeLimitSec, 0),
						sql`${testAttempts.startedAt} + INTERVAL '1 second' * ${tests.timeLimitSec} < NOW()`
					)
				)
				.innerJoin(tests, eq(testAttempts.testId, tests.id));

			// console.log(`Found ${startedAttempts.length} expired test attempts to submit`);
			// console.log('startedAttempts:', startedAttempts);

			for (const attempt of startedAttempts) {
				try {
					const result = await gradeAndSubmitTestAttempt(attempt.attemptId, attempt.userId);

					if (result) {
						console.log(`Successfully submitted expired test attempt with ID ${attempt.attemptId}`);
					} else {
						console.log(`Could not find test attempt with ID ${attempt.attemptId} to submit`);
					}
				} catch (err) {
					console.log(`Error submitting expired test attempt with ID ${attempt.attemptId}:`, err);
				}
			}
		} catch (err) {
			console.log(err);
		}

		// Update all test attempts that are started, where the test has an open and close time and the close time has passed

		try {
			const timeBasedExpiredAttempts = await db
				.select({
					attemptId: testAttempts.id,
					testId: testAttempts.testId,
					userId: testAttempts.userId
				})
				.from(testAttempts)
				.where(
					and(
						eq(testAttempts.status, AttemptStatusEnum.Started),
						sql`NOW() > ${tests.closesAt} AND ${tests.closesAt} IS NOT NULL`
					)
				)
				.innerJoin(tests, eq(testAttempts.testId, tests.id));

			// console.log(
			// 	`Found ${timeBasedExpiredAttempts.length} time-based expired test attempts to submit`
			// );
			// console.log('timeBasedExpiredAttempts:', timeBasedExpiredAttempts);

			for (const attempt of timeBasedExpiredAttempts) {
				try {
					const result = await gradeAndSubmitTestAttempt(attempt.attemptId, attempt.userId);

					if (result) {
						console.log(`Successfully submitted expired test attempt with ID ${attempt.attemptId}`);
					} else {
						console.log(`Could not find test attempt with ID ${attempt.attemptId} to submit`);
					}
				} catch (err) {
					console.log(`Error submitting expired test attempt with ID ${attempt.attemptId}:`, err);
				}
			}
		} catch (err) {
			console.log(err);
		}

		// console.log('submit expired test attempts job finished');
	},
	{ connection }
);
