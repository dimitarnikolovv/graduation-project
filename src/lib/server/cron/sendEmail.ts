import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { sendEmail } from '../server-utils/emails';
import { PRIVATE_REDIS_CONNECTION_URL, PRIVATE_SMTP_SENDER } from '$env/static/private';

if (!PRIVATE_REDIS_CONNECTION_URL) {
	throw new Error('PRIVATE_REDIS_CONNECTION_URL is not defined');
}

if (!PRIVATE_SMTP_SENDER) {
	throw new Error('PRIVATE_SMTP_SENDER is not defined');
}

const connection = new IORedis(PRIVATE_REDIS_CONNECTION_URL, { maxRetriesPerRequest: null });

const emailQueue = new Queue('emailQueue', {
	connection
});

await emailQueue.obliterate({ force: true });

export async function addEmailJob(options: SMTPTransport.Options) {
	// Add a job to the email queue
	await emailQueue.add('sendEmail', options, {
		removeOnComplete: true, // Remove the job from the queue once it's completed
		attempts: 3, // Retry the job up to 3 times on failure,
		backoff: { type: 'fixed', delay: 10000 } // Retry after 10 seconds
	});
}

// Worker to process email jobs
new Worker(
	'emailQueue',
	async ({ data }: { data: SMTPTransport.Options }) => {
		try {
			await sendEmail({
				from: `${data.from} <${PRIVATE_SMTP_SENDER}>`,
				to: `${data.to}`,
				subject: data.subject,
				html: data.html
			});
		} catch (error) {
			console.error('Failed to send email:', error);
			throw error; // Retry the job on failure
		}
	},
	{
		connection,
		concurrency: 5, // Process up to 5 jobs concurrently
		removeOnFail: {
			age: 24 * 3600 // keep up to 24 hours
		}
	}
);
