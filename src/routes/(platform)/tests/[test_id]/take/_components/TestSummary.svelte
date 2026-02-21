<script lang="ts">
	/**
	 * TestSummary Component
	 *
	 * Displays a summary panel with test statistics and a review button.
	 * Shows:
	 * - Total questions and max score
	 * - Number of allowed attempts and current attempt number
	 * - Time limit (if any)
	 * - Current attempt status
	 * - Count of answered questions
	 * - Button to go to review page
	 */

	import { Button } from '$lib/components/ui/button';
	import { displayAttemptStatus, type AttemptStatusEnum } from '$lib/types/enums';

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		/** Total number of questions in the test */
		totalItems: number;
		/** Maximum possible score for the test */
		maxScore: number;
		/** Number of attempts allowed (0 = unlimited) */
		allowedAttempts: number;
		/** Current attempt number (1-based) */
		attemptNumber: number;
		/** Time limit in seconds (0 = no limit) */
		timeLimitSec: number;
		/** Current status of the attempt */
		attemptStatus: AttemptStatusEnum;
		/** Number of questions the student has answered */
		answeredCount: number;
		/** Whether the review button should be disabled */
		disabled?: boolean;
		/** Optional link to the review page */
		reviewLink?: string;
	};

	let {
		totalItems,
		maxScore,
		allowedAttempts,
		attemptNumber,
		timeLimitSec,
		attemptStatus,
		answeredCount,
		disabled = false,
		reviewLink
	}: Props = $props();
</script>

<!-- Summary Panel Container -->
<div
	class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
>
	<h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Обобщение</h3>

	<!-- Stats List -->
	<ul class="space-y-2 text-sm text-muted-foreground">
		<!-- Questions and max score -->
		<li>
			<span class="font-semibold text-foreground">{totalItems}</span> въпроса • {maxScore} т.
		</li>
		<!-- Attempts info -->
		<li>
			Опити: {allowedAttempts > 0 ? allowedAttempts : '∞'} (текущ #{attemptNumber})
		</li>
		<!-- Time limit -->
		<li>
			Времеви лимит: {timeLimitSec > 0 ? `${Math.floor(timeLimitSec / 60)} мин` : 'няма'}
		</li>
		<!-- Current status -->
		<li>
			Статус: {displayAttemptStatus(attemptStatus)}
		</li>
		<!-- Progress -->
		<li>
			Отговорени: {answeredCount}/{totalItems}
		</li>
	</ul>

	<!-- Review Button -->
	<Button class="mt-4 w-full" {disabled} href={reviewLink ?? ''}>Преглед на отговори</Button>
</div>
