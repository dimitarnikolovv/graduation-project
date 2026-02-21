import { AttemptStatusEnum, QuestionTypeEnum } from '$lib/types/enums';
import { gradeChoiceQuestion, isChoiceConfig } from '$lib/utils/tests';
import { eq } from 'drizzle-orm';
import { db, type Transaction } from '../db';
import { testAnswers, testAttempts } from '../db/schema/tests';
import { paidTestEntries, type NewPaidTestEntry } from '../db/schema/paidTestEntries';
import { PRIVATE_SMTP_SENDER } from '$env/static/private';
import { addEmailJob } from '../cron/sendEmail';

// Check if the user has valid entry to take the test (eg. purchased if paid test)
type CheckIfUserHasAccessToTestParams = {
	userId: string;
	testId: string;
};

export async function checkIfUserHasAccessToTest(
	params: CheckIfUserHasAccessToTestParams
): Promise<boolean> {
	const { userId, testId } = params;

	const foundTest = await db.query.tests.findFirst({
		where: (table, { eq }) => eq(table.id, testId),
		columns: {
			id: true,
			isPaid: true
		}
	});

	if (!foundTest) return false;

	// Free test, everyone has access
	if (!foundTest.isPaid) return true;

	const foundPaidEntry = await db.query.paidTestEntries.findFirst({
		where: (table, { and, eq, isNotNull }) =>
			and(eq(table.userId, userId), eq(table.testId, testId), isNotNull(table.paidAt))
	});

	if (foundPaidEntry) return true;

	return false;
}

export async function gradeAndSubmitTestAttempt(attemptId: string, userId: string) {
	// Fetch the attempt with all answers and their associated questions
	const attempt = await db.query.testAttempts.findFirst({
		where: (table, { and, eq }) => and(eq(table.id, attemptId), eq(table.userId, userId)),
		with: {
			answers: {
				with: {
					question: true
				}
			}
		}
	});

	if (!attempt) {
		return null;
	}

	// Verify attempt hasn't already been submitted
	if (attempt.submittedAt || attempt.status !== AttemptStatusEnum.Started) {
		return {
			status: attempt.status,
			totalScore: attempt.totalScore,
			gradedAt: attempt.gradedAt
		};
	}

	// Grade all choice questions and calculate total score
	let totalScore = 0;
	let hasManualGradingQuestions = false;

	for (const answer of attempt.answers) {
		const question = answer.question;

		// Skip if question not found or no response
		if (!question || !answer.response) {
			continue;
		}

		// Check if this is a text or file upload question (requires manual grading)
		if (question.type === QuestionTypeEnum.Text || question.type === QuestionTypeEnum.FileUpload) {
			hasManualGradingQuestions = true;
			// Text and FileUpload questions are not auto-graded - they need manual review
			// awardedScore remains at default (0) until a teacher grades them
			continue;
		}

		// Grade choice questions (SingleChoice, MultipleChoice)
		if (
			question.type === QuestionTypeEnum.SingleChoice ||
			question.type === QuestionTypeEnum.MultipleChoice
		) {
			// Verify config is a choice config
			if (!isChoiceConfig(question.config)) {
				continue;
			}

			// Get selected options from response
			const response = answer.response as { selected?: string[] };
			const selectedIds = response.selected ?? [];

			// Grade the answer
			const awardedScore = gradeChoiceQuestion(
				question.type,
				question.config,
				selectedIds,
				question.points
			);

			// Update the answer with awarded score
			await db.update(testAnswers).set({ awardedScore }).where(eq(testAnswers.id, answer.id));

			totalScore += awardedScore;
		}
	}

	// Determine final status:
	// - If there are text/file upload questions -> Submitted (awaiting manual review by teacher)
	// - If only choice questions -> Graded (fully auto-graded)
	const finalStatus = hasManualGradingQuestions
		? AttemptStatusEnum.Submitted
		: AttemptStatusEnum.Graded;

	// Update attempt with final status and score
	const now = new Date();
	await db
		.update(testAttempts)
		.set({
			status: finalStatus,
			submittedAt: now,
			// Only set gradedAt if fully graded (no text/file upload questions needing review)
			gradedAt: hasManualGradingQuestions ? null : now,
			totalScore
		})
		.where(eq(testAttempts.id, attemptId));

	// Return the grading result for the client
	return {
		status: finalStatus,
		totalScore,
		gradedAt: hasManualGradingQuestions ? null : now
	};
}

// =================================================
// 		Handlers for test entries (paid tests)
// =================================================

export async function createPaidTestEntry(props: NewPaidTestEntry, tx?: Transaction) {
	const dbInstance = tx || db;

	const [entry] = await dbInstance.insert(paidTestEntries).values(props).returning();

	return {
		entry
	};
}

type UpdatePaidTestEntryAsPaidProps = {
	entryId: string;
	transactionId?: string;
	tx?: Transaction;
};

export async function updatePaidTestEntryAsPaid({
	entryId,
	transactionId,
	tx
}: UpdatePaidTestEntryAsPaidProps) {
	const dbInstance = tx || db;

	const [updatedEntry] = await dbInstance
		.update(paidTestEntries)
		.set({
			paidAt: new Date(),
			transactionId: transactionId
		})
		.where(eq(paidTestEntries.id, entryId))
		.returning();

	const foundTest = await dbInstance.query.tests.findFirst({
		where: (t, { eq }) => eq(t.id, updatedEntry.testId),

		columns: {
			title: true,
			id: true,
			priceInCents: true
		}
	});

	if (!foundTest) {
		throw new Error('Test not found');
	}

	const foundUser = await dbInstance.query.users.findFirst({
		where: (t, { eq }) => eq(t.id, updatedEntry.userId),
		columns: {
			email: true,
			firstName: true,
			lastName: true
		}
	});

	if (!foundUser) {
		throw new Error('User not found');
	}

	const body = `Здравейте,<br/><br/>

				Имате успешна регистрация за тест: "<strong>${foundTest.title}</strong>".<br/><br/>

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
				Instagram: <a href="https://www.instagram.com">https://www.instagram.com/</a>
				`;

	const options = {
		from: `BRAAND <${PRIVATE_SMTP_SENDER}>`,
		to: foundUser.email,
		subject: 'Записване за тест',
		html: body
	};

	await addEmailJob(options);

	return updatedEntry;
}
