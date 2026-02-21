<script lang="ts">
	/**
	 * Attempt Grading Page
	 *
	 * Allows teachers/admins to review and grade a student's test attempt.
	 * Shows all questions with the student's answers and allows manual grading
	 * of text questions.
	 */

	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { AttemptStatusEnum, displayAttemptStatus } from '$lib/types/enums';
	import { cn } from '$lib/utils';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import CheckCircle from '@lucide/svelte/icons/check-circle-2';
	import User from '@lucide/svelte/icons/user';
	import FileText from '@lucide/svelte/icons/file-text';
	import Clock from '@lucide/svelte/icons/clock';
	import Trophy from '@lucide/svelte/icons/trophy';
	import { toast } from 'svelte-sonner';
	import { markAttemptAsGradedRemote } from '../../attempts.remote';
	import GradeQuestionCard from './_components/GradeQuestionCard.svelte';
	import { DateFormatter } from '@internationalized/date';

	const { data } = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let totalScore = $state(data.attempt.totalScore);
	let status = $state<AttemptStatusEnum>(data.attempt.status as AttemptStatusEnum);
	let marking = $state(false);

	// ============================================================================
	// DERIVED
	// ============================================================================

	const scorePercentage = $derived(
		data.attempt.test.maxScore > 0 ? Math.round((totalScore / data.attempt.test.maxScore) * 100) : 0
	);

	const isGraded = $derived(status === AttemptStatusEnum.Graded);

	// ============================================================================
	// HELPERS
	// ============================================================================

	function formatDate(date: Date | string | null): string {
		if (!date) return '—';

		const df = new DateFormatter('bg-BG', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
		return df.format(new Date(date));
	}

	function handleScoreUpdate(newTotalScore: number) {
		totalScore = newTotalScore;
	}

	// ============================================================================
	// ACTIONS
	// ============================================================================

	async function markAsGraded() {
		if (isGraded || marking) return;

		marking = true;
		try {
			await markAttemptAsGradedRemote({ attemptId: data.attempt.id });
			status = AttemptStatusEnum.Graded;
			toast.success('Опитът е маркиран като оценен.');
		} catch (err) {
			console.error('Failed to mark as graded', err);
			toast.error('Грешка при маркиране като оценен.');
		} finally {
			marking = false;
		}
	}

	function goBack() {
		void goto('/control-centre-v1/tests/attempts/pending');
	}
</script>

<!-- Header -->
<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 py-0.5"
>
	<div class="flex items-center gap-3">
		<Button variant="outline" size="icon" class="h-9 w-9 shrink-0" onclick={goBack}>
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<div>
			<div class="text-xs text-muted-foreground">Оценяване на опит</div>
			<h1 class="text-lg font-semibold md:text-xl">{data.attempt.test.title}</h1>
		</div>
	</div>

	{#if !isGraded}
		<Button onclick={markAsGraded} disabled={marking} class="gap-1" size="sm">
			<CheckCircle class="h-4 w-4" />
			{marking ? 'Маркиране...' : 'Маркирай като оценен'}
		</Button>
	{/if}
</div>

<div class="flex items-center gap-4 mb-6">
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
		{totalScore.toFixed(1)} / {data.attempt.test.maxScore} точки
	</div>

	<!-- Status badge -->
	<div
		class={cn(
			'rounded-full px-4 py-1.5 text-sm font-semibold',
			isGraded
				? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
				: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
		)}
	>
		{displayAttemptStatus(status)}
	</div>
</div>

<!-- Info cards -->
<div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<!-- Student info -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<div class="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
			<User class="h-4 w-4" />
			Ученик
		</div>
		<div class="font-semibold text-gray-900 dark:text-gray-100">
			{data.attempt.user.firstName}
			{data.attempt.user.lastName}
		</div>
		<div class="text-xs text-muted-foreground">{data.attempt.user.email}</div>
	</div>

	<!-- Test info -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<div class="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
			<FileText class="h-4 w-4" />
			Опит
		</div>
		<div class="font-semibold text-gray-900 dark:text-gray-100">
			#{data.attempt.attemptNumber}
		</div>
		<div class="text-xs text-muted-foreground">
			{data.attempt.allQuestions.length} въпроса
		</div>
	</div>

	<!-- Submitted at -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<div class="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
			<Clock class="h-4 w-4" />
			Предаден
		</div>
		<div class="font-semibold text-gray-900 dark:text-gray-100">
			{formatDate(data.attempt.submittedAt)}
		</div>
	</div>

	<!-- Score -->
	<div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<div class="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
			<Trophy class="h-4 w-4" />
			Резултат
		</div>
		<div
			class={cn(
				'text-xl font-bold',
				scorePercentage >= 80
					? 'text-green-600 dark:text-green-400'
					: scorePercentage >= 50
						? 'text-amber-600 dark:text-amber-400'
						: 'text-red-600 dark:text-red-400'
			)}
		>
			{scorePercentage}%
		</div>
		<div class="text-xs text-muted-foreground">
			{totalScore.toFixed(1)} / {data.attempt.test.maxScore}
		</div>
	</div>
</div>

<!-- Questions -->
<div class="space-y-6">
	{#each data.attempt.allQuestions as question, index (question.id)}
		{@const answer = data.answerMap.get(question.id) ?? null}
		<GradeQuestionCard
			{question}
			questionNumber={index + 1}
			{answer}
			filesMap={data.filesMap}
			onScoreUpdate={handleScoreUpdate}
		/>
	{/each}
</div>

<!-- Footer actions -->
<div
	class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
>
	<div class="text-sm text-muted-foreground">
		{#if isGraded}
			<span class="flex items-center gap-2 text-green-600 dark:text-green-400">
				<CheckCircle class="h-4 w-4" />
				Този опит е напълно оценен.
			</span>
		{:else}
			След като приключите с оценяването, маркирайте опита като оценен.
		{/if}
	</div>

	<div class="flex gap-2">
		<Button variant="outline" onclick={goBack}>Назад към списъка</Button>
		{#if !isGraded}
			<Button onclick={markAsGraded} disabled={marking} class="gap-1">
				<CheckCircle class="h-4 w-4" />
				{marking ? 'Маркиране...' : 'Маркирай като оценен'}
			</Button>
		{/if}
	</div>
</div>
