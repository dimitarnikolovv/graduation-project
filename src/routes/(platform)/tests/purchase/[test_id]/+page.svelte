<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Clock from '@lucide/svelte/icons/clock';
	import Euro from '@lucide/svelte/icons/euro';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import Lock from '@lucide/svelte/icons/lock';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Target from '@lucide/svelte/icons/target';
	import Info from '@lucide/svelte/icons/info';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { priceInCentsToRealPrice } from '$lib/utils/prices';
	import { formatTimeLimit } from '$lib/utils/datetime';
	import { DateFormatter } from '@internationalized/date';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils.js';
	import type { SubmitFunction } from './$types.js';

	let { data, form } = $props();

	const df = new DateFormatter('bg', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	const hasSchedule = $derived(
		data.testAvailability?.opensAt != null || data.testAvailability?.closesAt != null
	);
	const availability = $derived(data.testAvailability);

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}
	});

	let disabled = $state(false);

	const handleSubmit: SubmitFunction = async () => {
		disabled = true;

		return async ({ update }) => {
			await update();
			disabled = false;
		};
	};
</script>

<svelte:head>
	<title>Купи тест | {data.foundTest.title}</title>
	<meta name="description" content={data.foundTest.description} />
</svelte:head>

<div class="mx-auto max-w-4xl">
	<Button href="/tests" variant="outline" class="mb-6">
		<ArrowLeft class="mr-2 h-4 w-4" />
		Назад към тестовете
	</Button>

	<!-- Purchase: test details + buy button -->
	<div class="mb-6">
		<h1 class="heading-font text-titles mb-4 text-3xl font-bold md:text-4xl">
			{data.foundTest.title}
		</h1>
		<p class="text-muted-foreground mb-6">
			Прегледайте внимателно подробностите за теста преди да го закупите.
		</p>
	</div>

	<Card.Root class="mb-6">
		<Card.Header>
			<Card.Title>Детайли за теста</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex items-start">
				<Euro class="text-muted-foreground mt-1 mr-3 h-5 w-5 shrink-0" />
				<div>
					<p class="font-medium">Цена</p>
					<p class="mt-1">
						{priceInCentsToRealPrice(data.foundTest.priceInCents).toLocaleString('bg', {
							style: 'currency',
							currency: 'EUR'
						})}
					</p>
				</div>
			</div>

			<div class="flex items-start">
				<Info class="text-muted-foreground mt-1 mr-3 h-5 w-5 shrink-0" />
				<div>
					<p class="font-medium">Описание</p>
					<p class="mt-1">
						{data.foundTest.description}
					</p>
				</div>
			</div>

			<div class="flex items-start">
				<TriangleAlert class="text-muted-foreground mt-1 mr-3 h-5 w-5 shrink-0" />
				<div>
					<p class="font-medium">Допълнителна информация</p>
					<p class="mt-1">
						След успешно плащане ще имате пълен достъп до теста и ще можете да го решавате от
						страницата „Започни тест“.
					</p>
				</div>
			</div>

			{#if !data.user}
				<Button
					variant="outline"
					size="lg"
					class="w-full bg-orange-500! text-white hover:bg-orange-600 focus:ring-orange-500 disabled:pointer-events-none disabled:opacity-50"
					href="/login"
					{disabled}
				>
					Купи - {priceInCentsToRealPrice(data.foundTest.priceInCents).toLocaleString('bg', {
						style: 'currency',
						currency: 'EUR'
					})}
				</Button>
				<p class="mt-2 text-center text-sm text-muted-foreground">
					След натискане на бутона "Купи" ще бъдете пренасочени към страницата за вход. Ако нямате
					акаунт, можете да си създадете такъв от страницата за <a
						href="/register"
						class="underline">регистрация</a
					>. След успешен вход ще бъдете пренасочени отбратно към настоящата страница, където ще
					можете да завършите покупката.
				</p>
			{:else}
				<form action="?/purchase" method="POST" class="space-y-4" use:enhance={handleSubmit}>
					<Button
						type="submit"
						variant="outline"
						size="lg"
						class="w-full bg-orange-500! text-white hover:bg-orange-600 focus:ring-orange-500 disabled:pointer-events-none disabled:opacity-50"
						{disabled}
					>
						Купи - {priceInCentsToRealPrice(data.foundTest.priceInCents).toLocaleString('bg', {
							style: 'currency',
							currency: 'EUR'
						})}
					</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Test info cards (same as start page) -->
	<div class="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card.Root class="border-blue-200/60 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30">
			<Card.Content>
				<div class="flex items-center gap-4">
					<div class="rounded-xl bg-blue-500/10 p-3">
						<ListChecks class="h-6 w-6 text-blue-600 dark:text-blue-400" />
					</div>
					<div class="text-xl lg:text-sm font-medium">Въпроси</div>
				</div>
				<div class="mx-auto mt-4 text-center text-2xl font-bold">
					{data.questionsCount ?? 0}
				</div>
			</Card.Content>
		</Card.Root>

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
				{#if data.foundTest.timeLimitSec === 0}
					<div class="mx-auto mt-4 text-center font-bold">Без ограничение</div>
				{:else}
					<div class="mx-auto mt-4 text-center text-2xl font-bold">
						{formatTimeLimit(data.foundTest.timeLimitSec)}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

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
				<div class="mx-auto mt-4 text-center text-2xl font-bold">
					{data.foundTest.maxScore}
				</div>
			</Card.Content>
		</Card.Root>

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
				<div class="mx-auto mt-4 text-center text-2xl font-bold">
					{data.foundTest.allowedAttempts === 0 ? '∞' : data.foundTest.allowedAttempts}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Test schedule (if applicable) -->
	{#if hasSchedule && availability}
		<Card.Root
			class={cn(
				'mb-6',
				availability.canTakeTest
					? 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/30'
					: 'border-orange-200/60 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/30'
			)}
		>
			<Card.Header class="pb-3">
				<Card.Title class="flex items-center gap-2 text-lg">
					<CalendarClock class="h-5 w-5" />
					График на теста
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4 md:grid-cols-2">
					{#if availability.opensAt}
						<div class="flex items-start gap-3">
							<div>
								<p class="text-sm font-medium text-muted-foreground">
									{availability.hasOpened ? 'Отворен от' : 'Отваря се на'}
								</p>
								<p class="font-semibold">{df.format(availability.opensAt)}</p>
							</div>
						</div>
					{/if}
					{#if availability.closesAt}
						<div class="flex items-start gap-3">
							<div>
								<p class="text-sm font-medium text-muted-foreground">
									{availability.hasClosed ? 'Затворен на' : 'Затваря се на'}
								</p>
								<p class="font-semibold">{df.format(availability.closesAt)}</p>
							</div>
						</div>
					{/if}
				</div>
				<div class="mt-4 rounded-lg border p-3">
					{#if availability.status === 'not_yet_open'}
						<p
							class="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300"
						>
							<Lock class="h-4 w-4 shrink-0" />
							След закупуване на теста ще имате достъп до него от посочената дата на отваряне.
						</p>
					{:else if availability.status === 'closed'}
						<p class="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
							<Lock class="h-4 w-4 shrink-0" />
							Тестът е затворен за нови опити.
						</p>
					{:else}
						<p
							class="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"
						>
							Тестът е отворен. След закупуване ще можете да го започнете веднага.
						</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Important information / instructions (same as start page) -->
	<Card.Root
		class="mt-6 border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
	>
		<Card.Header>
			<Card.Title class="text-lg">Важна информация</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="space-y-2 text-sm text-muted-foreground">
				<li class="flex items-start gap-2">
					<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
					<span>Отговорите се записват автоматично при всяка промяна</span>
				</li>
				{#if data.foundTest.timeLimitSec > 0}
					<li class="flex items-start gap-2">
						<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
						<span>Времето започва да тече веднага след започване на теста</span>
					</li>
					<li class="flex items-start gap-2">
						<CheckCircle class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
						<span>При изтичане на времето тестът се предава автоматично</span>
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
</div>
