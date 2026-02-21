<script lang="ts">
	/**
	 * Test Taking Page
	 *
	 * This page allows students to take a test. It handles:
	 * - Displaying questions with pagination
	 * - Countdown timer for time-limited tests
	 * - Navigation between questions
	 * - Review button to preview answers before submission
	 *
	 * Answer saving logic is handled by the QuestionCard component.
	 */

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { AttemptStatusEnum, displayAttemptStatus } from '$lib/types/enums';
	import type { AnswerResponse } from '$lib/types/tests';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Info from '@lucide/svelte/icons/info';
	import { toast } from 'svelte-sonner';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import CountdownTimer from './_components/CountdownTimer.svelte';
	import QuestionCard from './_components/QuestionCard.svelte';
	import QuestionNavigation from './_components/QuestionNavigation.svelte';
	import TestSummary from './_components/TestSummary.svelte';
	import { PUBLIC_HOST } from '$env/static/public';
	import { submitAttemptRemote } from './test.remote';

	/** Page data from +page.server.ts containing test, attempt, questions, etc. */
	const { data } = $props();

	// ============================================================================
	// STATE VARIABLES
	// ============================================================================

	/**
	 * Current status of the test attempt.
	 * Changes when the attempt is submitted or expires.
	 */
	let attemptStatus = $state<AttemptStatusEnum>(data.attempt.status as AttemptStatusEnum);

	/**
	 * Set of question IDs that have been answered.
	 * Updated by QuestionCard components via onAnswerChange callback.
	 */
	let answeredQuestionIds = $state<Set<string>>(initializeAnsweredSet(data.answerMap));

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/**
	 * Whether the attempt is locked (submitted, graded, or otherwise not editable).
	 * When true, all input fields should be disabled.
	 */
	let isAttemptLocked = $derived(attemptStatus !== AttemptStatusEnum.Started);

	/**
	 * Array of all question IDs in the test (across all pages).
	 * Used by QuestionNavigation to show answered status for questions not on the current page.
	 */
	let allQuestionIds = $derived(data.allQuestionIds);

	/**
	 * Count of questions that have been answered.
	 */
	let answeredCount = $derived(answeredQuestionIds.size);

	/**
	 * Link to the review page for this test attempt.
	 */
	const reviewPageLink = `/tests/${data.test.id}/take/review`;

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	/**
	 * Checks if an answer response has content.
	 */
	function hasAnswerContent(response: AnswerResponse | null | undefined): boolean {
		if (!response) return false;
		if ('selected' in response) return (response.selected?.length ?? 0) > 0;
		if ('text' in response) return !!response.text;
		if ('fileIds' in response) return (response.fileIds?.length ?? 0) > 0;
		return false;
	}

	/**
	 * Initializes the set of answered question IDs from the answer map.
	 * answerMap is Map<questionId, Answer[]> where Answer has a response property.
	 */
	function initializeAnsweredSet(answerMap: typeof data.answerMap): Set<string> {
		const set = new Set<string>();
		answerMap.forEach((answers, questionId) => {
			const response = answers[0]?.response as AnswerResponse | undefined;
			if (hasAnswerContent(response)) {
				set.add(questionId);
			}
		});
		return set;
	}

	/**
	 * Gets the initial answer for a question from the answer map.
	 */
	function getInitialAnswer(questionId: string): AnswerResponse | null {
		const answers = data.answerMap.get(questionId);
		if (!answers || answers.length === 0) return null;
		return (answers[0]?.response as AnswerResponse) ?? null;
	}

	/**
	 * Checks if a question has been answered.
	 * Used by QuestionNavigation to show answered indicators.
	 */
	function isAnswered(questionId: string): boolean {
		return answeredQuestionIds.has(questionId);
	}

	/**
	 * Called by QuestionCard when an answer changes.
	 * Updates the tracked answered state for navigation/summary.
	 */
	function handleAnswerChange(questionId: string, hasAnswer: boolean) {
		answeredQuestionIds = new Set(answeredQuestionIds);
		if (hasAnswer) {
			answeredQuestionIds.add(questionId);
		} else {
			answeredQuestionIds.delete(questionId);
		}
	}

	// ============================================================================
	// NAVIGATION HANDLERS
	// ============================================================================

	/**
	 * Handles page navigation within the test.
	 * Updates URL search params and navigates to the new page.
	 */
	function handlePageChange(newPage: number | undefined, hash?: string) {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('page', newPage.toString());

		let url = `${page.url.pathname}?${searchParams.toString()}`;

		if (hash) {
			url += `#${hash}`;
		}

		void goto(url);
	}

	/**
	 * Called when the countdown timer expires (either time limit or test close time).
	 * Shows a warning toast and auto-submits the test.
	 */
	async function handleTimerExpire() {
		toast.warning('Времето за теста изтече! Тестът ще бъде предаден автоматично.');

		attemptStatus = AttemptStatusEnum.Submitted;

		try {
			const result = await submitAttemptRemote({ attemptId: data.attempt.id });

			// Check if attempt was already submitted by the system (cron job)
			if (result && 'alreadySubmitted' in result && result.alreadySubmitted) {
				toast.info(result.message);
			} else {
				toast.success('Тестът беше предаден успешно!');
			}

			// Redirect to attempt-specific results page (updates when teacher grades)
			await goto(`/account/my-tests/${data.attempt.id}`);
		} catch (error) {
			console.error('Failed to submit attempt', error);
			toast.error('Неуспешно предаване. Опитайте отново.');
		}
	}
</script>

<svelte:head>
	<title>{data.test.title} | BRAAND</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<!-- Sticky Header: Shows test title, timer, status, and review button -->
<div
	class="bg-background ignore-main-margin lg:sticky z-40 flex flex-wrap items-center justify-between gap-4 py-1.5 lg:top-17"
>
	<div class="flex items-center gap-3">
		<!--
		<Button variant="outline" size="icon" class="h-9 w-9 shrink-0" href="/tests">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button> -->

		<div>
			<div class="text-xs text-muted-foreground">Опит #{data.attempt.attemptNumber}</div>
			<h1 class="text-lg font-semibold md:text-2xl">{data.test.title}</h1>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<!-- Countdown timer (shown when test has time limit or closes at a specific time) -->
		{#if data.test.timeLimitSec > 0 || data.test.closesAt}
			<CountdownTimer
				timeLimitSec={data.test.timeLimitSec}
				startedAt={data.attempt.startedAt}
				closesAt={data.test.closesAt}
				onExpire={handleTimerExpire}
			/>
		{/if}

		<!-- Attempt status badge -->
		<div
			class={cn(
				'rounded-full px-4 py-1.5 text-sm font-semibold',
				isAttemptLocked
					? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
					: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
			)}
		>
			{displayAttemptStatus(attemptStatus)}
		</div>

		<!-- Review answers button -->
		<Button variant="secondary" href={reviewPageLink} disabled={isAttemptLocked}>
			Преглед на отговори
		</Button>
	</div>
</div>

<!-- Progress Bar: Shows current page and legend -->
<div
	class="mb-8 rounded-2xl border border-blue-200/60 bg-blue-50/70 p-5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30"
>
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<div class="text-sm font-medium text-blue-800 dark:text-blue-200">Прогрес</div>
			<div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
				Страница {data.page} / {data.totalPages}
			</div>
			<div class="text-xs text-muted-foreground">
				Отговорите се записват автоматично за всеки въпрос.
			</div>
		</div>

		<!-- Status legend -->
		<div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
			<span
				class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-900"
			>
				<div class="size-2 rounded-full bg-green-500"></div>
				Записан отговор
			</span>
			<span
				class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm dark:bg-slate-900"
			>
				<div class="size-2 rounded-full bg-orange-500"></div>
				Очаква отговор
			</span>
		</div>
	</div>
</div>

<!-- Main Content: Questions and sidebar layout -->
<div class="flex w-full gap-x-8 2xl:gap-x-14">
	<!-- Questions Column -->
	<div class="w-full">
		<!-- Test description/instructions (if provided) -->
		{#if data.test.description}
			<div
				class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="mb-2 flex items-center gap-2 text-sm font-semibold">
					<Info class="h-4 w-4 text-blue-600 dark:text-blue-400" />
					Инструкции
				</div>
				<div class="text-sm leading-relaxed text-muted-foreground">
					<RenderStyledHtml renderAsInlineBlock={true}>
						{@html data.test.description}
					</RenderStyledHtml>
				</div>
			</div>
		{/if}

		{#if data.questions && data.questions.length > 0}
			<!-- Mobile Question Navigation (hidden on xl screens) -->
			<div class="mb-8 xl:hidden">
				<QuestionNavigation
					totalItems={data.totalItems}
					limit={data.limit}
					currentPage={data.page}
					{allQuestionIds}
					{isAnswered}
					onPageChange={handlePageChange}
				/>
			</div>

			<!-- Questions List -->
			<div class="space-y-8">
				{#each data.questions as question, index (question.id)}
					<QuestionCard
						{question}
						questionNumber={(data.page - 1) * data.limit + index + 1}
						attemptId={data.attempt.id}
						initialAnswer={getInitialAnswer(question.id)}
						disabled={isAttemptLocked}
						onAnswerChange={handleAnswerChange}
					/>
				{/each}
			</div>
		{:else}
			<!-- Empty state when no questions -->
			<div
				class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-muted-foreground dark:border-gray-700 dark:bg-gray-800"
			>
				Няма въпроси за този тест.
			</div>
		{/if}
	</div>

	<!-- Desktop Sticky Sidebar (hidden on screens smaller than xl) -->
	<div class="hidden w-80 shrink-0 xl:block">
		<div class="sticky top-40 space-y-4 lg:top-44">
			<!-- Question navigation grid -->
			<QuestionNavigation
				totalItems={data.totalItems}
				limit={data.limit}
				currentPage={data.page}
				{allQuestionIds}
				{isAnswered}
				onPageChange={handlePageChange}
			/>

			<!-- Test summary with stats and review button -->
			<TestSummary
				totalItems={data.totalItems}
				maxScore={data.test.maxScore}
				allowedAttempts={data.test.allowedAttempts}
				attemptNumber={data.attempt.attemptNumber}
				timeLimitSec={data.test.timeLimitSec}
				{attemptStatus}
				{answeredCount}
				disabled={isAttemptLocked}
				reviewLink={reviewPageLink}
			/>
		</div>
	</div>
</div>

<!-- Bottom Pagination: Allows navigation between question pages -->
<Pagination.Root
	class="my-8"
	count={data.totalItems}
	page={data.page}
	perPage={data.limit}
	onPageChange={async (p) => {
		handlePageChange(p);
	}}
>
	{#snippet children({ pages, currentPage })}
		<Pagination.Content>
			<Pagination.Item>
				<Pagination.PrevButton
					class="mr-2 rounded-full border"
					onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}
				>
					<ChevronLeft class="w-4"></ChevronLeft>
					<span class="hidden sm:inline">Назад</span>
				</Pagination.PrevButton>
			</Pagination.Item>
			{#each pages as pg (pg.key)}
				{#if pg.type === 'ellipsis'}
					<Pagination.Item>
						<Pagination.Ellipsis />
					</Pagination.Item>
				{:else}
					<Pagination.Item>
						<Pagination.Link
							page={pg}
							class={cn(
								'rounded-full border',
								currentPage === pg.value && 'bg-foreground! text-background!'
							)}
							isActive={currentPage === pg.value}
						>
							{pg.value}
						</Pagination.Link>
					</Pagination.Item>
				{/if}
			{/each}
			<Pagination.Item>
				{#if currentPage === data.totalPages}
					<Button href={reviewPageLink} class="ml-2 rounded-full border" disabled={false}>
						<span class="hidden sm:inline">Предай</span>
						<ChevronRight class="w-4"></ChevronRight>
					</Button>
				{:else}
					<Pagination.NextButton
						class="ml-2 rounded-full border"
						disabled={currentPage === data.totalPages}
						onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}
					>
						<span class="hidden sm:inline">Напред</span>
						<ChevronRight class="w-4"></ChevronRight>
					</Pagination.NextButton>
				{/if}
			</Pagination.Item>
		</Pagination.Content>
	{/snippet}
</Pagination.Root>
