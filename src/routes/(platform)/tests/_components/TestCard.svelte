<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import Target from '@lucide/svelte/icons/target';
	import Clock from '@lucide/svelte/icons/clock';
	import Star from '@lucide/svelte/icons/star';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { sliceLongText } from '$lib/utils/general';
	import { priceInCentsToRealPrice } from '$lib/utils/prices';
	import { cn } from '$lib/utils';
	import type {
		FetchFeaturedTestsResult,
		FetchPaidTestsResult,
		FetchFreeTestsResult
	} from '$lib/server/db-querying/tests';
	import { formatTimeLimit } from '$lib/utils/datetime';

	type Props = {
		test:
			| FetchFeaturedTestsResult[number]
			| FetchPaidTestsResult['results'][number]
			| FetchFreeTestsResult['results'][number];
	};

	let { test }: Props = $props();
</script>

<Card.Root
	class={cn(
		'dark:hover:border-primary/40 group flex h-full flex-col gap-0 overflow-hidden border py-0 transition-all hover:scale-[101%] hover:shadow-md',
		test.isFeatured && 'border-amber-300 dark:border-amber-700'
	)}
>
	<a href="/tests/{test.id}/start" class="flex h-full flex-col">
		<Card.Header class="flex-1 gap-2 px-4 pt-4">
			<!-- Badges row -->
			<div class="flex flex-wrap items-center gap-2">
				{#if test.isFeatured}
					<Badge
						variant="secondary"
						class="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
					>
						<Star class="h-3 w-3 fill-amber-500 stroke-amber-500" />
						Препоръчан
					</Badge>
				{/if}

				{#if test.isPaid}
					<Badge
						variant="outline"
						class="border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
					>
						{priceInCentsToRealPrice(test.priceInCents).toLocaleString('bg-BG', {
							style: 'currency',
							currency: 'EUR'
						})}
					</Badge>
				{:else}
					<Badge
						variant="outline"
						class="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
					>
						Безплатен
					</Badge>
				{/if}
			</div>

			<!-- Title -->
			<Card.Title class="line-clamp-2 text-lg leading-tight">
				{test.title}
			</Card.Title>

			<!-- Description -->
			{#if test.description}
				<Card.Description class="line-clamp-2 text-sm">
					{sliceLongText(test.description, 100)}
				</Card.Description>
			{/if}
		</Card.Header>

		<Card.Content class="px-4 pb-3 mt-3">
			<!-- Stats -->
			<div class="text-muted-foreground flex flex-wrap gap-3 text-sm">
				{#if test.timeLimitSec > 0}
					<span class="flex items-center gap-1">
						<Clock class="h-3 w-3" />
						{formatTimeLimit(test.timeLimitSec)}
					</span>
				{/if}
				<span class="flex items-center gap-1">
					<ListTodo class="h-3 w-3" />
					{test.questionsCount} въпроса
				</span>
				<span class="flex items-center gap-1">
					<Target class="h-3 w-3" />
					{test.maxScore} точки
				</span>
			</div>
		</Card.Content>

		<!-- Footer -->
		<div
			class="bg-muted group-hover:bg-primary group-hover:text-primary-foreground mt-auto flex items-center justify-between gap-2 px-4 py-3 text-sm transition-colors"
		>
			<span class="font-medium">Започни тест</span>
			<ArrowRight class="h-4 w-4" />
		</div>
	</a>
</Card.Root>
