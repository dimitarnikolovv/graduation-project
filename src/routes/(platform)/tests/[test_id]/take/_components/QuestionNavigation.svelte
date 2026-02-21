<script lang="ts">
	/**
	 * QuestionNavigation Component
	 *
	 * Displays a grid of numbered buttons for navigating between test questions.
	 * Features:
	 * - Shows all questions across all pages
	 * - Highlights the current page's questions
	 * - Shows visual indicator (green ring) for answered questions
	 * - Clicking a question navigates to its page
	 */

	import { cn } from '$lib/utils';

	// ============================================================================
	// TYPE DEFINITIONS
	// ============================================================================

	/** Minimal question metadata needed for navigation */
	type QuestionMeta = {
		id: string;
		order: number;
	};

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		/** Total number of questions in the test */
		totalItems: number;
		/** Number of questions per page */
		limit: number;
		/** Current page number (1-based) */
		currentPage: number;
		/** Array of all question IDs in order (across all pages) */
		allQuestionIds: QuestionMeta[];
		/** Function to check if a question has been answered */
		isAnswered: (questionId: string) => boolean;
		/** Callback when a page should be navigated to */
		onPageChange: (page: number | undefined, hash?: string) => void;
	};

	let { totalItems, limit, currentPage, allQuestionIds, isAnswered, onPageChange }: Props =
		$props();
</script>

<!-- Navigation Container -->
<div
	class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
>
	<h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Навигация</h3>

	<!-- Grid of question buttons (6 columns) -->
	<div class="grid grid-cols-6 gap-2">
		{#each Array.from({ length: totalItems }, (_, i) => i + 1) as questionNumber}
			<!-- Calculate which page this question is on -->
			{@const targetPage = Math.ceil(questionNumber / limit)}
			<!-- Get the question ID from the allQuestionIds array -->
			{@const questionIndex = questionNumber - 1}
			{@const questionId = allQuestionIds?.[questionIndex]?.id}
			<!-- Check if this question has been answered -->
			{@const answered = questionId ? isAnswered(questionId) : false}

			<button
				onclick={() => onPageChange(targetPage, `question-${questionNumber}`)}
				class={cn(
					'flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
					// Highlight if this question is on the current page
					targetPage === currentPage
						? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200'
						: 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
					// Add green ring if the question has been answered
					answered ? 'ring-2 ring-green-400' : ''
				)}
				aria-label={`Към въпрос ${questionNumber}`}
			>
				{questionNumber}
			</button>
		{/each}
	</div>

	<div
		class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400"
	>
		<div class="flex items-center gap-2">
			<div
				class="size-3 rounded border border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
			></div>
			<span>Текуща страница</span>
		</div>

		<div class="flex items-center gap-2">
			<div
				class="size-3 rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
			></div>
			<span>Други страници</span>
		</div>

		<div class="flex items-center gap-2">
			<div class="size-3 rounded border ring ring-green-400 bg-white dark:bg-gray-700"></div>
			/
			<div
				class="size-3 rounded border ring ring-green-400 border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
			></div>
			<span>Отговорени въпроси</span>
		</div>
	</div>
</div>
