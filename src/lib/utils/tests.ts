import type { Test } from '$lib/server/db/schema/tests';
import { QuestionTypeEnum } from '$lib/types/enums';
import type { ChoiceConfig } from '$lib/types/tests';
import { isPast, isFuture, differenceInSeconds } from 'date-fns';

// ============================================================================
// GRADING HELPERS
// ============================================================================

/**
 * Grades a single choice question (SingleChoice or MultipleChoice).
 *
 * Grading logic:
 * - SingleChoice: Full points if the selected option matches the correct option
 * - MultipleChoice: Full points if ALL selected options match ALL correct options
 *   (same options, regardless of order, no extra, no missing)
 *
 * @param questionType - The type of question (SingleChoice or MultipleChoice)
 * @param config - The question config containing correct answers
 * @param selectedIds - Array of option IDs the student selected
 * @param maxPoints - Maximum points for this question
 * @returns Points awarded (maxPoints if correct, 0 if incorrect)
 */
export function gradeChoiceQuestion(
	questionType: QuestionTypeEnum,
	config: ChoiceConfig,
	selectedIds: string[],
	maxPoints: number
): number {
	// Get correct answer IDs (stored as numbers in config)
	const correctIds = config.correct.map((id) => id.toString());

	// Normalize selected IDs to strings for comparison
	const normalizedSelected = selectedIds.map((id) => id.toString());

	if (questionType === QuestionTypeEnum.SingleChoice) {
		// SingleChoice: Must have exactly one selection matching the correct answer
		if (normalizedSelected.length !== 1 || correctIds.length !== 1) {
			return 0;
		}
		return normalizedSelected[0] === correctIds[0] ? maxPoints : 0;
	}

	if (questionType === QuestionTypeEnum.MultipleChoice) {
		// MultipleChoice: All correct options must be selected, no extra selections allowed
		if (normalizedSelected.length !== correctIds.length) {
			return 0;
		}

		// Sort both arrays and compare
		const sortedSelected = [...normalizedSelected].sort();
		const sortedCorrect = [...correctIds].sort();

		const isCorrect = sortedSelected.every((id, index) => id === sortedCorrect[index]);
		return isCorrect ? maxPoints : 0;
	}

	// Unknown question type - no points
	return 0;
}

/**
 * Checks if a question config is a ChoiceConfig (has correct property).
 *
 * @param config - The question config to check
 * @returns True if this is a ChoiceConfig
 */
export function isChoiceConfig(config: unknown): config is ChoiceConfig {
	return (
		typeof config === 'object' &&
		config !== null &&
		'correct' in config &&
		Array.isArray((config as ChoiceConfig).correct)
	);
}

type PartialTest = Pick<Test, 'opensAt' | 'closesAt'>;

export type TestAvailabilityStatus = 'available' | 'not_yet_open' | 'closed' | 'always_available';

export type TestAvailability = {
	status: TestAvailabilityStatus;
	canTakeTest: boolean;
	opensAt: Date | null;
	closesAt: Date | null;
	hasOpened: boolean;
	hasClosed: boolean;
	secondsUntilOpen: number | null;
	secondsUntilClose: number | null;
};

/**
 * Gets detailed availability information for a test
 */
export function getTestAvailability(test: PartialTest): TestAvailability {
	const now = new Date();

	// No time restrictions - always available
	if (!test.opensAt && !test.closesAt) {
		return {
			status: 'always_available',
			canTakeTest: true,
			opensAt: null,
			closesAt: null,
			hasOpened: true,
			hasClosed: false,
			secondsUntilOpen: null,
			secondsUntilClose: null
		};
	}

	const hasOpened = test.opensAt ? isPast(test.opensAt) : true;
	const hasClosed = test.closesAt ? isPast(test.closesAt) : false;

	let status: TestAvailabilityStatus;
	if (!hasOpened) {
		status = 'not_yet_open';
	} else if (hasClosed) {
		status = 'closed';
	} else {
		status = 'available';
	}

	const secondsUntilOpen =
		test.opensAt && isFuture(test.opensAt) ? differenceInSeconds(test.opensAt, now) : null;

	const secondsUntilClose =
		test.closesAt && isFuture(test.closesAt) ? differenceInSeconds(test.closesAt, now) : null;

	return {
		status,
		canTakeTest: hasOpened && !hasClosed,
		opensAt: test.opensAt,
		closesAt: test.closesAt,
		hasOpened,
		hasClosed,
		secondsUntilOpen,
		secondsUntilClose
	};
}

/**
 * Simple check if a test is currently available for taking
 */
export function checkIfTestIsActive(test: PartialTest): boolean {
	const availability = getTestAvailability(test);
	return availability.canTakeTest;
}

/**
 * Formats seconds into a human-readable time string (Bulgarian)
 * Re-exported from datetime.ts for convenience
 */
export { formatSecondsDuration as formatTimeRemaining } from './datetime';
