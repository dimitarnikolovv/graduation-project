<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

{#snippet inputLoader()}
	<div class="grid gap-2">
		<Skeleton class="h-5 w-32" />
		<Skeleton class="h-9 w-full" />
	</div>
{/snippet}

{#snippet testCardLoader()}
	<Card.Root class="group flex h-full flex-col transition-shadow hover:shadow-md">
		<Card.Header class="flex flex-1 flex-col">
			<Skeleton class="h-6 w-3/4" />

			<Skeleton class="mt-2 h-16 w-full" />
		</Card.Header>

		<Card.Content>
			<div class="space-y-3">
				<!-- Subject and Class Grade -->
				<div class="flex flex-wrap gap-2">
					<Skeleton class="h-5 w-28" />
					<Skeleton class="h-5 w-16" />
					<Skeleton class="h-5 w-26" />
					<Skeleton class="h-5 w-20" />
				</div>

				<!-- Author and Last Edited Info -->
				<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
					<Skeleton class="h-4 w-36" />
					<Skeleton class="h-4 w-46" />
					<Skeleton class="h-4 w-46" />
					<Skeleton class="h-4 w-32" />
				</div>
			</div>
		</Card.Content>

		<Card.Footer>
			<div class="flex w-full items-center justify-between">
				<Skeleton class="h-6 w-18" />

				<Skeleton class="h-9 w-20" />
			</div>
		</Card.Footer>
	</Card.Root>
{/snippet}

<svelte:boundary>
	{@render children?.()}

	{#snippet pending()}
		<!-- Filters -->
		<div class="rounded-lg border border-dashed p-6">
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
				{@render inputLoader()}
				{@render inputLoader()}
				{@render inputLoader()}
				{@render inputLoader()}
				{@render inputLoader()}

				<div class="grid gap-4 sm:col-span-full sm:grid-cols-2">
					{@render inputLoader()}
					{@render inputLoader()}
				</div>
			</div>

			<div class="mt-6 flex w-full items-center justify-between">
				<Skeleton class="h-9 w-24" />
				<Skeleton class="h-9 w-24" />
			</div>
		</div>

		<!-- Pagination Results Info -->
		<div class="mt-4 flex items-center justify-end gap-2">
			<Skeleton class="h-5 w-40" />
		</div>

		<!-- Videos Grid -->
		<div class="grid gap-3 max-lg:gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
			{#each Array(6) as _, index}
				{@render testCardLoader()}
			{/each}
		</div>

		<!-- Pagination -->
		<div class="mt-4 flex items-center justify-center gap-1">
			<Skeleton class="h-9 w-20" />
			<Skeleton class="h-9 w-9" />
			<Skeleton class="h-9 w-9" />
			<Skeleton class="h-9 w-20" />
		</div>
	{/snippet}

	{#snippet failed(_error, reset)}
		<div
			class="mt-4 flex h-48 w-full items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
		>
			<div class="flex flex-col items-center gap-4 text-center">
				<h3 class="text-2xl font-bold tracking-tight">Грешка при зареждане на тестовете</h3>
				<Button onclick={reset} variant="outline">Опитай отново</Button>
			</div>
		</div>
	{/snippet}
</svelte:boundary>
