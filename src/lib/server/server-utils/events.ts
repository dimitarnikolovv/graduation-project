import { PRIVATE_SMTP_SENDER } from '$env/static/private';
import { eq } from 'drizzle-orm';
import { addEmailJob } from '../cron/sendEmail';
import { db, type Transaction } from '../db';
import { paidEventEntries, type NewPaidEventEntry } from '../db/schema/paidEventEntries';
import { publicEventEntries } from '../db/schema/publicEventEntries';
import type { PublicEvent } from '../db/schema/publicEvents';

type CreatePublicEventEntryProps = {
	event: PublicEvent;
	data: {
		atendeeEmail: string;
		atendeeName: string;
	};
	tx?: Transaction;
};

export async function createPublicEventEntry(props: CreatePublicEventEntryProps) {
	const { event, data, tx } = props;

	const dbInstance = tx || db;

	const [entry] = await dbInstance
		.insert(publicEventEntries)
		.values({
			eventId: event.id,
			atendeeEmail: data.atendeeEmail,
			atendeeName: data.atendeeName
		})
		.returning();

	if (event.link) {
		const body = `Здравейте,<br/><br/>
                Благодарим Ви, че се доверихте на BRAAND.<br/><br/>


                Имате успешна регистрация за събитието "<strong>${event.name}</strong>".<br/><br/>
                Можете да го достъпите чрез следния линк:<br/><br/>
                <a href="${event.link}">${event.link}</a>
                <br/><br/>
                Поздрави,<br/>
                Екипът на BRAAND`;

		const options = {
			from: `BRAAND <${PRIVATE_SMTP_SENDER}>`,
			to: `${data.atendeeEmail}`,
			subject: 'Записване за събитие',
			html: body
		};

		await addEmailJob(options);
	}

	return {
		entry
	};
}

export async function createPaidEventEntry(props: NewPaidEventEntry, tx?: Transaction) {
	const dbInstance = tx || db;

	const [entry] = await dbInstance.insert(paidEventEntries).values(props).returning();

	return {
		entry
	};
}

type UpdatePaidEventEntryAsPaidProps = {
	entryId: string;
	transactionId?: string;
	tx?: Transaction;
};

export async function updatePaidEventEntryAsPaid({
	entryId,
	transactionId,
	tx
}: UpdatePaidEventEntryAsPaidProps) {
	const dbInstance = tx || db;

	const [updatedEntry] = await dbInstance
		.update(paidEventEntries)
		.set({
			paidAt: new Date(),
			transactionId: transactionId
		})
		.where(eq(paidEventEntries.id, entryId))
		.returning();

	const foundEvent = await dbInstance.query.paidEvents.findFirst({
		where: (t, { eq }) => eq(t.id, updatedEntry.eventId),

		columns: {
			name: true,
			id: true,
			priceInCents: true
		}
	});

	if (!foundEvent) {
		throw new Error('Event not found');
	}

	const body = `Здравейте,<br/><br/>

	            Имате успешна регистрация за събитието "<strong>${foundEvent.name}</strong>".<br/><br/>

	            <br/><br/>
	            Поздрави,<br/>
	            Екипът на BRAAND
				
	            <br/><br/>
	            <br/><br/>
				Контакти:
				<br/>
				e-mail: <a href="mailto:ekip@braand.com">ekip@braand.com</a>
				<br/>
				тел.: <a href="tel:+359000000000">+359 000 000 000</a>
				<br/>
				Facebook: <a href="https://www.facebook.com">https://www.facebook.com/</a>
				<br/>
				Instagram: <a href="https://www.instagram.com">https://www.instagram.com</a>
				`;

	const options = {
		from: `BRAAND <${PRIVATE_SMTP_SENDER}>`,
		to: updatedEntry.atendeeEmail,
		subject: 'Записване за събитие',
		html: body
	};

	await addEmailJob(options);

	return updatedEntry;
}
