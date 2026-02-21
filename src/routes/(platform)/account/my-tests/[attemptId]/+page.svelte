<script lang="ts">
	/**
	 * Attempt Results Page
	 *
	 * Displays the detailed results of a test attempt, including:
	 * - Overall score and attempt information
	 * - Each question with the student's answer compared to correct answers
	 * - Visual indicators for correct/incorrect/missed answers
	 * - Status indicators for pending manual review (text questions)
	 *
	 * This page updates automatically when teachers grade the attempt.
	 */

	import { Button } from '$lib/components/ui/button';
	import { AttemptStatusEnum, displayAttemptStatus, QuestionTypeEnum } from '$lib/types/enums';
	import { cn } from '$lib/utils';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Trophy from '@lucide/svelte/icons/trophy';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import MinusCircle from '@lucide/svelte/icons/minus-circle';
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import { DateFormatter } from '@internationalized/date';
	import ResultQuestionCard from './ResultQuestionCard.svelte';

	const { data } = $props();

	const df = new DateFormatter('bg', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	const totalQuestions = $derived(data.attempt.allQuestions.length);

	const isGraded = $derived(data.attempt.status === AttemptStatusEnum.Graded);

	const correctCount = $derived(
		data.attempt.allQuestions.filter((q) => {
			const answer = data.answerMap.get(q.id);
			return answer && answer.awardedScore === q.points && hasResponse(answer);
		}).length
	);

	/** Partially correct count (for text questions with some points but not full) */
	const partiallyCorrectCount = $derived(
		data.attempt.allQuestions.filter((q) => {
			const answer = data.answerMap.get(q.id);
			return (
				answer && answer.awardedScore > 0 && answer.awardedScore < q.points && hasResponse(answer)
			);
		}).length
	);

	const incorrectCount = $derived(
		data.attempt.allQuestions.filter((q) => {
			const answer = data.answerMap.get(q.id);
			// For choice questions: wrong if has answer but not full points
			if (q.type === QuestionTypeEnum.SingleChoice || q.type === QuestionTypeEnum.MultipleChoice) {
				return answer && answer.awardedScore < q.points && hasResponse(answer);
			}
			// For text/file upload questions: wrong only if graded with 0 points (and attempt is graded)
			if ((q.type === QuestionTypeEnum.Text || q.type === QuestionTypeEnum.FileUpload) && isGraded) {
				return answer && answer.awardedScore === 0 && hasResponse(answer);
			}
			return false;
		}).length
	);

	const pendingReviewCount = $derived(
		data.attempt.allQuestions.filter((q) => {
			const answer = data.answerMap.get(q.id);
			// Text and FileUpload questions are pending review only if:
			// - They have a response AND
			// - The attempt is not fully graded AND
			// - They haven't been individually graded (score is still 0)
			return (
				(q.type === QuestionTypeEnum.Text || q.type === QuestionTypeEnum.FileUpload) &&
				hasResponse(answer) &&
				!isGraded &&
				(answer?.awardedScore ?? 0) === 0
			);
		}).length
	);

	const unansweredCount = $derived(
		data.attempt.allQuestions.filter((q) => {
			const answer = data.answerMap.get(q.id);
			return !answer || !hasResponse(answer);
		}).length
	);

	const scorePercentage = $derived(
		data.attempt.test.maxScore > 0
			? Math.round((data.attempt.totalScore / data.attempt.test.maxScore) * 100)
			: 0
	);

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	function hasResponse(answer: { response: unknown } | null | undefined): boolean {
		if (!answer || !answer.response) return false;
		const resp = answer.response as { selected?: string[]; text?: string; fileIds?: string[] };
		if ('selected' in resp) return (resp.selected?.length ?? 0) > 0;
		if ('text' in resp) return !!resp.text;
		if ('fileIds' in resp) return (resp.fileIds?.length ?? 0) > 0;
		return false;
	}
</script>

<!-- Header -->
<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
	<div class="flex items-center gap-3">
		<Button variant="outline" size="icon" class="h-9 w-9 shrink-0" href="/account/my-tests">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<div>
			<div class="text-xs text-muted-foreground">
				Резултати от опит #{data.attempt.attemptNumber}
			</div>
			<h1 class="text-lg font-semibold md:text-2xl">{data.attempt.test.title}</h1>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<!-- Score badge -->
		<div
			class={cn(
				'rounded-full px-4 py-1.5 text-sm font-bold',
				scorePercentage >= 80
					? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
					: scorePercentage >= 50
						? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
						: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
			)}
		>
			{data.attempt.totalScore.toFixed(1)} / {data.attempt.test.maxScore} точки
		</div>

		<!-- Status badge -->
		<div
			class={cn(
				'rounded-full px-4 py-1.5 text-sm font-semibold',
				isGraded
					? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
					: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
			)}
		>
			{displayAttemptStatus(data.attempt.status)}
		</div>
	</div>
</div>

<!-- Score Overview -->
<div
	class="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
>
	<div
		class={cn(
			'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
			(pendingReviewCount > 0 || partiallyCorrectCount > 0) && 'lg:grid-cols-5',
			pendingReviewCount > 0 && partiallyCorrectCount > 0 && 'lg:grid-cols-6'
		)}
	>
		<!-- Total Score -->
		<div class="text-center">
			<Trophy class="mx-auto mb-2 h-8 w-8 text-amber-500" />
			<div
				class={cn(
					'text-3xl font-bold',
					scorePercentage >= 80
						? 'text-green-600 dark:text-green-400'
						: scorePercentage >= 50
							? 'text-amber-600 dark:text-amber-400'
							: 'text-red-600 dark:text-red-400'
				)}
			>
				{scorePercentage}%
			</div>
			<div class="text-sm text-muted-foreground">Общ резултат</div>
		</div>

		<!-- Correct -->
		<div class="text-center">
			<CheckCircle class="mx-auto mb-2 h-8 w-8 text-green-500" />
			<div class="text-3xl font-bold text-green-600 dark:text-green-400">{correctCount}</div>
			<div class="text-sm text-muted-foreground">Верни</div>
		</div>

		<!-- Partially Correct (only shown if there are partially correct answers) -->
		{#if partiallyCorrectCount > 0}
			<div class="text-center">
				<CheckCircle class="mx-auto mb-2 h-8 w-8 text-amber-500" />
				<div class="text-3xl font-bold text-amber-600 dark:text-amber-400">
					{partiallyCorrectCount}
				</div>
				<div class="text-sm text-muted-foreground">Частично верни</div>
			</div>
		{/if}

		<!-- Incorrect -->
		<div class="text-center">
			<XCircle class="mx-auto mb-2 h-8 w-8 text-red-500" />
			<div class="text-3xl font-bold text-red-600 dark:text-red-400">{incorrectCount}</div>
			<div class="text-sm text-muted-foreground">Грешни</div>
		</div>

		<!-- Unanswered -->
		<div class="text-center">
			<MinusCircle class="mx-auto mb-2 h-8 w-8 text-gray-400" />
			<div class="text-3xl font-bold text-gray-600 dark:text-gray-400">{unansweredCount}</div>
			<div class="text-sm text-muted-foreground">Без отговор</div>
		</div>

		<!-- Pending Review (only shown if there are text questions pending review) -->
		{#if pendingReviewCount > 0}
			<div class="text-center">
				<Hourglass class="mx-auto mb-2 h-8 w-8 text-purple-500" />
				<div class="text-3xl font-bold text-purple-600 dark:text-purple-400">
					{pendingReviewCount}
				</div>
				<div class="text-sm text-muted-foreground">Очакват проверка</div>
			</div>
		{/if}
	</div>

	<!-- Dates -->
	<div
		class="mt-6 flex flex-wrap justify-center gap-6 border-t border-gray-200 pt-4 text-sm text-muted-foreground dark:border-gray-700"
	>
		<div>
			<span class="font-medium">Започнат:</span>
			{df.format(new Date(data.attempt.startedAt))}
		</div>
		{#if data.attempt.submittedAt}
			<div>
				<span class="font-medium">Предаден:</span>
				{df.format(new Date(data.attempt.submittedAt))}
			</div>
		{/if}
		{#if data.attempt.gradedAt}
			<div>
				<span class="font-medium">Оценен:</span>
				{df.format(new Date(data.attempt.gradedAt))}
			</div>
		{/if}
	</div>

	<!-- Pending review notice -->
	{#if !isGraded && pendingReviewCount > 0}
		<div
			class="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
		>
			<strong>Забележка:</strong> Тестът съдържа {pendingReviewCount}
			{pendingReviewCount === 1 ? 'въпрос' : 'въпроса'}, които очакват ръчна проверка
			от преподавател. Резултатът може да се промени след проверката.
		</div>
	{/if}
</div>

<!-- Questions List -->
<div class="space-y-6">
	<h2 class="text-xl font-semibold">Подробни резултати</h2>

	{#each data.attempt.allQuestions as question, index (question.id)}
		{@const answer = data.answerMap.get(question.id) ?? null}
		<ResultQuestionCard
			{question}
			questionNumber={index + 1}
			{answer}
			isAttemptGraded={isGraded}
			filesMap={data.filesMap}
		/>
	{/each}
</div>

<!-- Footer -->
<div class="mt-8 flex justify-center">
	<Button variant="outline" href="/account/my-tests">
		<ArrowLeft class="mr-2 h-4 w-4" /> Назад към моите тестове
	</Button>
</div>
