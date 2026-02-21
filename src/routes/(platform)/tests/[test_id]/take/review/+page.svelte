<script lang="ts">
	/**
	 * Test Review Page
	 *
	 * This page allows students to review all their answers before final submission.
	 * It displays:
	 * - A summary of the attempt with submit/edit buttons
	 * - All questions with their current answers
	 * - Visual indicators for answered/unanswered questions
	 *
	 * After submission, redirects to the results page for detailed score breakdown.
	 */

	import { goto } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { AttemptStatusEnum, displayAttemptStatus } from '$lib/types/enums';
	import type { AnswerResponse } from '$lib/types/tests';
	import { toast } from 'svelte-sonner';
	import { submitAttemptRemote } from '../test.remote';
	import ReviewQuestionCard from './_components/ReviewQuestionCard.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	/** Page data from +page.server.ts containing test, attempt, and all questions */
	const { data } = $props();

	// ============================================================================
	// STATE VARIABLES
	// ============================================================================

	/**
	 * Whether the submission is currently in progress.
	 * Used to disable submit buttons and show loading state.
	 */
	let submitting = $state(false);

	/**
	 * Current status of the attempt.
	 * Updated after successful submission.
	 */
	let status = $state<AttemptStatusEnum>(data.attempt.status as AttemptStatusEnum);

	/**
	 * Map of question IDs to their answer responses.
	 * Used to display the student's answers in the review cards.
	 */
	let answers = $state<Map<string, AnswerResponse | null>>(normalizeAnswerMap(data.answerMap));

	/**
	 * Base link to the test-taking page.
	 */
	const testLink = `/tests/${data.test.id}/take`;

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/**
	 * Count of questions that have been answered.
	 * Displayed in the header to show progress.
	 */
	const answeredCount = $derived(
		Array.from(answers.values()).filter((val) => {
			if (!val) return false;
			if ('selected' in val) return (val.selected?.length ?? 0) > 0;
			if ('text' in val) return !!val.text;
			if ('fileIds' in val) return (val.fileIds?.length ?? 0) > 0;
			return false;
		}).length
	);

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	/**
	 * Normalizes the answer map received from the server into a consistent Map structure.
	 * Handles different formats that may come from serialization.
	 *
	 * @param raw - The raw answer data from the server
	 * @returns A normalized Map of questionId -> AnswerResponse
	 */
	function normalizeAnswerMap(raw: unknown): Map<string, AnswerResponse | null> {
		const map = new Map<string, AnswerResponse | null>();
		if (!raw) return map;

		if (raw instanceof Map) {
			raw.forEach((value, key) => {
				map.set(key, (value as { response?: AnswerResponse })?.response ?? null);
			});
		} else if (Array.isArray(raw)) {
			for (const [key, value] of raw as [string, unknown][]) {
				map.set(key, (value as { response?: AnswerResponse })?.response ?? null);
			}
		} else if (typeof raw === 'object') {
			for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
				map.set(key, (value as { response?: AnswerResponse })?.response ?? null);
			}
		}

		return map;
	}

	// ============================================================================
	// ACTION HANDLERS
	// ============================================================================

	/**
	 * Submits the test attempt via remote function.
	 * After successful submission, redirects to the attempt-specific results page.
	 */
	async function submitAttempt() {
		// Guard: Don't submit if already submitting or attempt is not in Started status
		if (submitting || status !== AttemptStatusEnum.Started) return;

		submitting = true;
		try {
			const result = await submitAttemptRemote({ attemptId: data.attempt.id });

			// Check if attempt was already submitted by the system (cron job)
			if (result && 'alreadySubmitted' in result && result.alreadySubmitted) {
				toast.info(result.message, {
					description: 'Ще бъдете пренасочени към резултатите.'
				});
			} else {
				toast.success('Опитът беше предаден успешно!');
			}

			status = AttemptStatusEnum.Submitted;

			// Redirect to attempt-specific results page (updates when teacher grades)
			await goto(`/account/my-tests/${data.attempt.id}`);
		} catch (error) {
			console.error('Failed to submit attempt', error);
			toast.error('Неуспешно предаване. Опитайте отново.');
		} finally {
			submitting = false;
		}
	}

	/**
	 * Navigates back to the test-taking page to continue editing answers.
	 */
	function goBackToTest() {
		void goto(`/tests/${data.test.id}/take`);
	}
</script>

<svelte:head>
	<title>{data.test.title} | Преглед на отговори</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- Sticky Header: Shows back button, title, progress, status, and submit button -->
<div
	class="bg-background ignore-main-margin sticky top-14 z-40 flex flex-wrap items-center justify-between gap-4 py-1.5 lg:top-17"
>
	<div class="flex items-center gap-3">
		<!-- Back button to test-taking page -->
		<Button variant="outline" size="icon" class="h-9 w-9 shrink-0" href={testLink}>
			<span class="sr-only">Назад</span>
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<div class="text-xs text-muted-foreground">Преглед на отговори</div>
			<h1 class="text-lg font-semibold md:text-2xl">{data.test.title}</h1>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<!-- Answered questions counter -->
		<div
			class="rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
		>
			Отговорени: {answeredCount}/{data.questions.length}
		</div>

		<!-- Attempt status badge -->
		<div
			class="rounded-full px-4 py-1.5 text-sm font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
		>
			{displayAttemptStatus(status)}
		</div>

		<!-- Submit button -->
		<button
			type="button"
			class={buttonVariants({ size: 'sm' })}
			onclick={() => void submitAttempt()}
			disabled={submitting}
		>
			{#if submitting}
				Предаване...
			{:else}
				Предай теста
			{/if}
		</button>
	</div>
</div>

<!-- Main Content -->
<div class="grid gap-4">
	<!-- Confirmation Panel: Summary with action buttons -->
	<div
		class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<div class="text-sm text-muted-foreground">Потвърдете и предайте опита</div>
				<div class="text-xl font-semibold">Опит #{data.attempt.attemptNumber}</div>
			</div>
			<div class="flex gap-2">
				<!-- Button to go back and edit answers -->
				<Button variant="secondary" href={testLink}>Редактирай отговори</Button>
				<!-- Final submit button -->
				<button
					type="button"
					class={buttonVariants({ size: 'sm' })}
					onclick={() => void submitAttempt()}
					disabled={submitting}
				>
					{#if submitting}
						Предаване...
					{:else}
						Предай теста
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Questions List: Shows all questions with their answers -->
	<div class="grid gap-3">
		{#each data.questions as question, index (question.id)}
			<ReviewQuestionCard
				{question}
				questionNumber={index + 1}
				response={answers.get(question.id) ?? null}
				{testLink}
				limit={data.test.questionsPerPage}
				filesMap={data.filesMap}
			/>
		{/each}
	</div>
</div>
