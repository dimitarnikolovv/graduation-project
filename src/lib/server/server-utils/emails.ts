import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import PasswordResetTemplate from '$lib/components/email-templates/PasswordResetTemplate';
import { render } from '@react-email/render';
import { addEmailJob } from '../cron/sendEmail';
import { escapeHtml } from '$lib/utils/general';
import {
	PRIVATE_SMTP_HOST,
	PRIVATE_SMTP_PASS,
	PRIVATE_SMTP_PORT,
	PRIVATE_SMTP_SENDER,
	PRIVATE_SMTP_USER
} from '$env/static/private';
import { PUBLIC_HOST } from '$env/static/public';

export async function sendEmail(options: SMTPTransport.Options) {
	try {
		const transporter = nodemailer.createTransport({
			host: PRIVATE_SMTP_HOST,
			port: Number(PRIVATE_SMTP_PORT),
			secure: true,
			auth: {
				user: PRIVATE_SMTP_USER,
				pass: PRIVATE_SMTP_PASS
			}
		});

		await transporter.verify();

		// throws if sending fails
		const info = await transporter.sendMail(options);
		return info;
	} catch (err) {
		console.error('Failed to send email:', err);

		if (err instanceof Error) {
			// preserve original stack + message
			throw err;
		}

		// fallback for non-Error values
		throw new Error('Failed to send email: ' + String(err));
	}
}

export async function sendAdminCredentials(email: string, password: string) {
	const link = `${PUBLIC_HOST}/login`;

	const escapedPassword = escapeHtml(password);

	const body = `
    <h1>Данни за административен профил</h1> <p>Този имейл може да бъде използван за достъпване на административния панел на платформата "BRAAND":</p> <a href="${link}">Към панела</a> <p>Парола за вход: ${escapedPassword}</p>
	`;

	const options = {
		from: `BRAAND <${PRIVATE_SMTP_SENDER}>`,
		to: `${email}`,
		subject: 'Данни за административен профил',
		html: body
	};

	await addEmailJob(options);
}

export async function sendResetPasswordEmail(email: string, token: string) {
	const resetLink = new URL(`/reset-password/${token}`, PUBLIC_HOST);
	const body = await render(PasswordResetTemplate({ resetLink: resetLink.toString() }));

	const options = {
		from: `BRAAND <${PRIVATE_SMTP_SENDER}>`,
		to: `${email}`,
		subject: 'Възстановяване на парола',
		html: body
	};

	await addEmailJob(options);
}
