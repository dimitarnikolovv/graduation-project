<script lang="ts">
	/**
	 * Test Start Page
	 *
	 * This page displays a summary of the test before the student begins.
	 * Shows test details, rules, and allows starting or resuming the test.
	 */

	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { displayAttemptStatus, AttemptStatusEnum } from '$lib/types/enums';
	import Clock from '@lucide/svelte/icons/clock';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Target from '@lucide/svelte/icons/target';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Play from '@lucide/svelte/icons/play';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import History from '@lucide/svelte/icons/history';
	import Trophy from '@lucide/svelte/icons/trophy';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Lock from '@lucide/svelte/icons/lock';
	import Unlock from '@lucide/svelte/icons/unlock';
	import Timer from '@lucide/svelte/icons/timer';
	import { DateFormatter } from '@internationalized/date';
	import { formatTimeRemaining } from '$lib/utils/tests';
	import { onMount, onDestroy } from 'svelte';
	import { formatTimeLimit } from '$lib/utils/datetime.js';

	const { data } = $props();

	// Initialize countdown state from server data (captured once, then updated locally)
	// The initial values are intentionally captured once and decremented locally for the countdown
	// svelte-ignore state_referenced_locally
	let secondsUntilOpen = $state<number | null>(data.testAvailability.secondsUntilOpen);
	// svelte-ignore state_referenced_locally
	let secondsUntilClose = $state<number | null>(data.testAvailability.secondsUntilClose);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	// Update countdown timers every second
	onMount(() => {
		if (secondsUntilOpen !== null || secondsUntilClose !== null) {
			countdownInterval = setInterval(() => {
				if (secondsUntilOpen !== null && secondsUntilOpen > 0) {
					secondsUntilOpen--;
					if (secondsUntilOpen <= 0) {
						// Test just opened, reload to update availability
						window.location.reload();
					}
				}
				if (secondsUntilClose !== null && secondsUntilClose > 0) {
					secondsUntilClose--;
					if (secondsUntilClose <= 0) {
						// Test just closed, reload to update availability
						window.location.reload();
					}
				}
			}, 1000);
		}
	});

	onDestroy(() => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	});

	const df = new DateFormatter('bg', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	// Calculate remaining time for active attempt (derived from current data)
	const remainingTime = $derived.by(() => {
		if (!data.activeAttempt || data.test.timeLimitSec === 0) return null;

		const startedAt = new Date(data.activeAttempt.startedAt).getTime();
		const now = Date.now();
		const elapsed = Math.floor((now - startedAt) / 1000);
		const remaining = data.test.timeLimitSec - elapsed;

		if (remaining <= 0) return 'Изтекло';

		const minutes = Math.floor(remaining / 60);
		const seconds = remaining % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	});

	// Derived values from data
	const hasActiveAttempt = $derived(!!data.activeAttempt);
	const completedAttempts = $derived(
		data.previousAttempts.filter(
			(a) => a.status === AttemptStatusEnum.Submitted || a.status === AttemptStatusEnum.Graded
		)
	);

	// Test availability helpers (derived from data)
	const availability = $derived(data.testAvailability);
	const hasSchedule = $derived(availability.opensAt !== null || availability.closesAt !== null);
</script>

<svelte:head>
	<title>{data.test.title} | BRAAND</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 py-8">
	<!-- Header Section -->
	<div class="text-center">
		<h1 class="text-3xl font-bold tracking-tight md:text-4xl">{data.test.title}</h1>
		<p class="mt-2 text-muted-foreground">
			Преди да започнете, моля прегледайте информацията за теста
		</p>
	</div>

	<!-- Main Info Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<!-- Questions Count -->
		<Card.Root class="border-blue-200/60 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30">
			<Card.Content>
				<div class="flex items-center gap-4">
					<div class="rounded-xl bg-blue-500/10 p-3">
						<ListChecks class="h-6 w-6 text-blue-600 dark:text-blue-400" />
					</div>
					<div class="text-xl lg:text-sm font-medium">Въпроси</div>
				</div>

				<div class="mx-auto text-2xl font-bold text-center mt-4">
					{data.questionsCount}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Time Limit -->
		<Card.Root
			class="border-amber-200/60 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30"
		>
			<Card.Content>
				<div class="flex items-center gap-4">
					<div class="rounded-xl bg-amber-500/10 p-3">
						<Clock class="h-6 w-6 text-amber-600 dark:text-amber-400" />
					</div>
					<div class="text-xl lg:text-sm font-medium">Време</div>
				</div>

				{#if data.test.timeLimitSec === 0}
					<div class="mx-auto text font-bold text-center mt-4">Без ограничение</div>
				{:else}
					<div class="mx-auto text-2xl font-bold text-center mt-4">
						{formatTimeLimit(data.test.timeLimitSec)}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Max Score -->
		<Card.Root
			class="border-green-200/60 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/30"
		>
			<Card.Content>
				<div class="flex items-center gap-4">
					<div class="rounded-xl bg-green-500/10 p-3">
						<Target class="h-6 w-6 text-green-600 dark:text-green-400" />
					</div>
					<div class="text-xl lg:text-sm font-medium">Максимални точки</div>
				</div>

				<div class="mx-auto text-2xl font-bold text-center mt-4">
					{data.test.maxScore}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Allowed Attempts -->
		<Card.Root
			class="border-purple-200/60 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/30"
		>
			<Card.Content>
				<div class="flex items-center gap-4">
					<div class="rounded-xl bg-purple-500/10 p-3">
						<RotateCcw class="h-6 w-6 text-purple-600 dark:text-purple-400" />
					</div>
					<div class="text-xl lg:text-sm font-medium">Позволени опити</div>
				</div>

				<div class="mx-auto text-2xl font-bold text-center mt-4">
					{data.test.allowedAttempts === 0 ? '∞' : data.test.allowedAttempts}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Test Availability Schedule -->
	{#if hasSchedule}
		<Card.Root
			class={availability.canTakeTest
				? 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/30'
				: 'border-orange-200/60 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/30'}
		>
			<Card.Header class="pb-3">
				<Card.Title class="flex items-center gap-2 text-lg">
					<CalendarClock class="h-5 w-5" />
					График на теста
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 md:grid-cols-2">
					<!-- Opens At -->
					{#if availability.opensAt}
						<div class="flex items-start gap-3">
							<div
								class={`rounded-lg p-2 ${availability.hasOpened ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}
							>
								{#if availability.hasOpened}
									<Unlock class="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
								{:else}
									<Lock class="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
								{/if}
							</div>
							<div>
								<p class="text-sm font-medium text-muted-foreground">
									{availability.hasOpened ? 'Отворен от' : 'Отваря се на'}
								</p>
								<p class="font-semibold">{df.format(availability.opensAt)}</p>
								{#if secondsUntilOpen !== null && secondsUntilOpen > 0}
									<div
										class="mt-1 flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400"
									>
										<Timer class="h-3.5 w-3.5" />
										<span>след {formatTimeRemaining(secondsUntilOpen)}</span>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Closes At -->
					{#if availability.closesAt}
						<div class="flex items-start gap-3">
							<div
								class={`rounded-lg p-2 ${availability.hasClosed ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}
							>
								{#if availability.hasClosed}
									<Lock class="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
								{:else}
									<Clock class="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
								{/if}
							</div>
							<div>
								<p class="text-sm font-medium text-muted-foreground">
									{availability.hasClosed ? 'Затворен на' : 'Затваря се на'}
								</p>
								<p class="font-semibold">{df.format(availability.closesAt)}</p>
								{#if secondsUntilClose !== null && secondsUntilClose > 0}
									<div
										class="mt-1 flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400"
									>
										<Timer class="h-3.5 w-3.5 shrink-0" />
										<span>остават {formatTimeRemaining(secondsUntilClose)}</span>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Current Status Message -->
				<div class="mt-4 rounded-lg border p-3">
					{#if availability.status === 'not_yet_open'}
						<div class="flex items-center gap-2 text-orange-700 dark:text-orange-300">
							<Lock class="h-4 w-4 shrink-0" />
							<span class="text-sm font-medium">
								Тестът все още не е отворен. Моля, върнете се по-късно.
							</span>
						</div>
					{:else if availability.status === 'closed'}
						<div class="flex items-center gap-2 text-red-700 dark:text-red-300">
							<Lock class="h-4 w-4 shrink-0" />
							<span class="text-sm font-medium">
								Тестът е затворен. Не можете да започнете нов опит.
							</span>
						</div>
					{:else}
						<div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
							<Unlock class="h-4 w-4 shrink-0" />
							<span class="text-sm font-medium">Тестът е отворен и можете да го решите.</span>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Description Section -->
	{#if data.test.description}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-lg">Описание на теста</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="prose prose-sm dark:prose-invert max-w-none">
					<RenderStyledHtml>
						{@html data.test.description}
					</RenderStyledHtml>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Active Attempt Warning -->
	{#if hasActiveAttempt}
		{#if data.canContinueAttempt}
			<Card.Root class="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
				<Card.Content class="flex items-start gap-4 pt-6">
					<div class="rounded-xl bg-amber-500/20 p-3">
						<AlertTriangle class="h-6 w-6 text-amber-600 dark:text-amber-400" />
					</div>
					<div class="flex-1">
						<h3 class="font-semibold text-amber-900 dark:text-amber-100">Имате активен опит</h3>
						<p class="mt-1 text-sm text-amber-800 dark:text-amber-200">
							Започнали сте опит #{data.activeAttempt?.attemptNumber} на {df.format(
								new Date(data.activeAttempt?.startedAt ?? Date.now())
							)}.
							{#if remainingTime && remainingTime !== 'Изтекло'}
								Оставащо време: <strong>{remainingTime}</strong>
							{:else if remainingTime === 'Изтекло'}
								<strong class="text-red-600">Времето е изтекло!</strong>
							{/if}
						</p>
						<Button href="/tests/{data.test.id}/take" class="mt-4" variant="default">
							<Play class="mr-2 h-4 w-4" />
							Продължи теста
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Active attempt exists but test is not available -->
			<Card.Root class="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
				<Card.Content class="flex items-start gap-4 pt-6">
					<div class="rounded-xl bg-red-500/20 p-3">
						<Lock class="h-6 w-6 text-red-600 dark:text-red-400" />
					</div>
					<div class="flex-1">
						<h3 class="font-semibold text-red-900 dark:text-red-100">
							Опитът не може да бъде продължен
						</h3>
						<p class="mt-1 text-sm text-red-800 dark:text-red-200">
							Имате активен опит #{data.activeAttempt?.attemptNumber}, но
							{#if availability.status === 'closed'}
								тестът е затворен на {df.format(availability.closesAt!)}.
							{:else if availability.status === 'not_yet_open'}
								тестът все още не е отворен. Ще бъде достъпен от {df.format(availability.opensAt!)}.
							{:else}
								тестът не е достъпен в момента.
							{/if}
						</p>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}

	<!-- Previous Attempts History -->
	{#if completedAttempts.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-lg">
					<History class="h-5 w-5" />
					Предишни опити
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-3">
					{#each completedAttempts as attempt (attempt.id)}
						<div
							class="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4"
						>
							<div class="flex items-center gap-4">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<span class="font-semibold text-primary">#{attempt.attemptNumber}</span>
								</div>
								<div>
									<div class="flex items-center gap-2">
										<a href="/account/my-tests/{attempt.id}" class="font-medium hover:underline"
											>Опит #{attempt.attemptNumber}</a
										>
										<Badge variant="outline" class="text-xs">
											{displayAttemptStatus(attempt.status as AttemptStatusEnum)}
										</Badge>
									</div>
									<div class="flex items-center gap-3 text-sm text-muted-foreground">
										<span class="flex items-center gap-1">
											<CalendarDays class="h-3 w-3" />
											{df.format(attempt.submittedAt ?? attempt.startedAt)}
										</span>
									</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Trophy class="h-4 w-4 text-amber-500" />
								<span class="font-semibold">
									{attempt.totalScore} / {data.test.maxScore} т.
								</span>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Important Notes -->
	<Card.Root class="border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
		<Card.Header>
			<Card.Title class="text-lg">Важна информация</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="space-y-2 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
					<span>Отговорите се записват автоматично при всяка промяна</span>
				</li>
				{#if data.test.timeLimitSec > 0}
					<li class="flex items-start gap-2">
						<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
						<span>Времето започва да тече веднага след започване на теста</span>
					</li>
					<li class="flex items-start gap-2">
						<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
						<span>При изтичане на времето, тестът се предава автоматично</span>
					</li>
				{/if}
				<li class="flex items-start gap-2">
					<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
					<span>Можете да навигирате между въпросите свободно</span>
				</li>
				<li class="flex items-start gap-2">
					<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
					<span>Преди предаване ще можете да прегледате всички отговори</span>
				</li>
			</ul>
		</Card.Content>
	</Card.Root>

	<!-- Action Buttons -->
	<div class="flex flex-col items-center gap-4 pt-4">
		{#if data.canContinueAttempt}
			<!-- User has an active attempt and can continue -->
			<Button href="/tests/{data.test.id}/take" size="lg" class="w-full max-w-md text-lg">
				<Play class="mr-2 h-5 w-5" />
				Продължи теста
			</Button>
		{:else if !availability.canTakeTest}
			<!-- Test is not available due to schedule -->
			<div class="text-center">
				{#if availability.status === 'not_yet_open'}
					<div class="mb-3 flex justify-center">
						<div class="rounded-full bg-orange-100 p-4 dark:bg-orange-900/30">
							<Lock class="h-8 w-8 text-orange-600 dark:text-orange-400" />
						</div>
					</div>
					<p class="mb-2 text-lg font-medium text-orange-600 dark:text-orange-400">
						Тестът все още не е отворен
					</p>
					<p class="text-sm text-muted-foreground">
						Тестът ще бъде достъпен от {df.format(availability.opensAt!)}
					</p>
					{#if secondsUntilOpen !== null && secondsUntilOpen > 0}
						<p class="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400">
							Остават: {formatTimeRemaining(secondsUntilOpen)}
						</p>
					{/if}
				{:else if availability.status === 'closed'}
					<div class="mb-3 flex justify-center">
						<div class="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
							<Lock class="h-8 w-8 text-red-600 dark:text-red-400" />
						</div>
					</div>
					<p class="mb-2 text-lg font-medium text-red-600 dark:text-red-400">Тестът е затворен</p>
					<p class="text-sm text-muted-foreground">
						Тестът беше затворен на {df.format(availability.closesAt!)}
					</p>
				{/if}
			</div>
		{:else if !data.hasAttemptsRemaining}
			<!-- Test is available but user has no attempts left -->
			<div class="text-center">
				<div class="mb-3 flex justify-center">
					<div class="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
						<RotateCcw class="h-8 w-8 text-red-600 dark:text-red-400" />
					</div>
				</div>
				<p class="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
					Достигнали сте максималния брой опити
				</p>
				<p class="text-sm text-muted-foreground">Не можете да започнете нов опит за този тест.</p>
			</div>
		{:else}
			<!-- Test is available and user can start -->
			<Button href="/tests/{data.test.id}/take" size="lg" class="w-full max-w-md text-lg">
				<Play class="mr-2 h-5 w-5" />
				Започни тест
				{#if data.nextAttemptNumber > 1}
					<span class="ml-2 text-sm opacity-80">(Опит #{data.nextAttemptNumber})</span>
				{/if}
			</Button>
			{#if secondsUntilClose !== null && secondsUntilClose > 0 && secondsUntilClose < 3600}
				<!-- Warning if test closes soon (less than 1 hour) -->
				<p class="text-center text-sm text-amber-600 dark:text-amber-400">
					<AlertTriangle class="mr-1 inline h-4 w-4" />
					Внимание: Тестът се затваря след {formatTimeRemaining(secondsUntilClose)}
				</p>
			{/if}
		{/if}

		<Button variant="outline" onclick={() => history.back()} class="w-full max-w-md">Назад</Button>
	</div>
</div>
