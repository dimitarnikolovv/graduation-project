<script lang="ts">
	/**
	 * My Tests Page
	 *
	 * Lists all test attempts for the current user with their scores and statuses.
	 */

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { AttemptStatusEnum, displayAttemptStatus } from '$lib/types/enums';
	import { cn } from '$lib/utils';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Clock from '@lucide/svelte/icons/clock';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Eye from '@lucide/svelte/icons/eye';
	import { DateFormatter } from '@internationalized/date';

	const { data } = $props();

	const df = new DateFormatter('bg', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	/**
	 * Handles page navigation.
	 */
	async function handlePageChange(newPage: number | undefined) {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	}

	/**
	 * Gets the appropriate icon and color for an attempt status.
	 */
	function getStatusDisplay(status: AttemptStatusEnum) {
		switch (status) {
			case AttemptStatusEnum.Started:
				return {
					Icon: Clock,
					color: 'text-amber-600 dark:text-amber-400',
					bg: 'bg-amber-100 dark:bg-amber-900/40'
				};
			case AttemptStatusEnum.Submitted:
				return {
					Icon: AlertCircle,
					color: 'text-blue-600 dark:text-blue-400',
					bg: 'bg-blue-100 dark:bg-blue-900/40'
				};
			case AttemptStatusEnum.Graded:
				return {
					Icon: CheckCircle,
					color: 'text-green-600 dark:text-green-400',
					bg: 'bg-green-100 dark:bg-green-900/40'
				};
			default:
				return {
					Icon: Clock,
					color: 'text-gray-600 dark:text-gray-400',
					bg: 'bg-gray-100 dark:bg-gray-900/40'
				};
		}
	}

	/**
	 * Calculates score percentage.
	 */
	function getScorePercentage(totalScore: number, maxScore: number): number {
		if (!maxScore) return 0;
		return Math.round((totalScore / maxScore) * 100);
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold">Моите тестове</h2>
		<p class="text-muted-foreground">Преглед на всички решени тестове и техните резултати</p>
	</div>

	{#if data.attempts && data.attempts.length > 0}
		<div class="space-y-4">
			{#each data.attempts as attempt (attempt.id)}
				{@const statusDisplay = getStatusDisplay(attempt.status as AttemptStatusEnum)}
				{@const scorePercent = getScorePercentage(attempt.totalScore, attempt.test.maxScore)}
				{@const canViewResults =
					attempt.status === AttemptStatusEnum.Submitted ||
					attempt.status === AttemptStatusEnum.Graded}

				<Card.Root class="transition-shadow hover:shadow-md">
					<Card.Content>
						<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<!-- Left: Test info -->
							<div class="flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="font-semibold text-lg">{attempt.test.title}</h3>
									<span
										class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
									>
										Опит #{attempt.attemptNumber}
									</span>
								</div>

								<div class="text-sm text-muted-foreground">
									{attempt.test.subject?.name ?? 'Няма предмет'} • {attempt.test.classGrade?.name ??
										'Няма клас'}
								</div>

								<div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
									<span>Започнат: {df.format(new Date(attempt.startedAt))}</span>
									{#if attempt.submittedAt}
										<span>Предаден: {df.format(new Date(attempt.submittedAt))}</span>
									{/if}
								</div>
							</div>

							<!-- Middle: Status and score -->
							<div class="">
								<div class="flex items-center gap-4 w-full justify-between">
									<!-- Status badge -->
									<div
										class={cn(
											'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
											statusDisplay.bg,
											statusDisplay.color
										)}
									>
										<statusDisplay.Icon class="h-4 w-4" />
										{displayAttemptStatus(attempt.status as AttemptStatusEnum)}
									</div>

									<!-- Score (if submitted/graded) -->
									{#if canViewResults}
										<div class="text-center">
											<div
												class={cn(
													'text-lg font-bold',
													scorePercent >= 80
														? 'text-green-600 dark:text-green-400'
														: scorePercent >= 50
															? 'text-amber-600 dark:text-amber-400'
															: 'text-red-600 dark:text-red-400'
												)}
											>
												{attempt.totalScore.toFixed(1)} / {attempt.test.maxScore}
											</div>
											<div class="text-xs text-muted-foreground">{scorePercent}%</div>
										</div>
									{/if}
								</div>

								<div class="mt-4 flex justify-end flex-">
									<!-- Action button -->
									{#if canViewResults}
										<Button
											variant="outline"
											size="sm"
											href="/account/my-tests/{attempt.id}"
											class="gap-1 w-full"
										>
											<Eye class="h-4 w-4" />
											Резултати
										</Button>
									{:else}
										<Button
											variant="default"
											size="sm"
											href="/tests/{attempt.testId}/start"
											class="gap-1 w-full"
										>
											Продължи
										</Button>
									{/if}
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Pagination -->

		<Pagination.Root
			count={data.totalItems}
			page={data.page}
			perPage={data.limit}
			onPageChange={async (p) => {
				await handlePageChange(p);
			}}
			class="mt-6"
		>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton
							onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}
						>
							<ChevronLeft class="w-4" />
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
								<Pagination.Link page={pg} isActive={currentPage === pg.value}>
									{pg.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton
							onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}
						>
							<span class="hidden sm:inline">Напред</span>
							<ChevronRight class="w-4" />
						</Pagination.NextButton>
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	{:else}
		<!-- Empty state -->
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<ClipboardList class="text-muted-foreground mb-4 h-16 w-16" />
				<h3 class="mb-2 text-xl font-semibold">Няма решени тестове</h3>
				<p class="text-muted-foreground mb-6 text-center">
					Все още нямате решени тестове. Разгледайте нашите уроци и тестове!
				</p>
				<Button href="/lessons">Към уроците</Button>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
