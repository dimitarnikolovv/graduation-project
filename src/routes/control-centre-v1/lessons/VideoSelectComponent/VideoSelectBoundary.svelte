<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { Snippet } from 'svelte';

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

{#snippet videoLoader()}
	<div class="grid gap-2">
		<div class="relative m-auto aspect-video w-full">
			<Skeleton class="h-full w-full rounded-md" />

			<Skeleton class="absolute top-2 left-2 h-6 w-32" />

			<Skeleton class="absolute top-2 right-2 h-6 w-32" />
		</div>

		<div class="space-y-2">
			<Skeleton class="h-9 w-full" />

			<Skeleton class="h-5 w-60" />

			<div class="text-muted-foreground flex flex-wrap justify-between text-sm">
				<div class="flex gap-2">
					<Skeleton class="h-4 w-30" />
					<Skeleton class="h-4 w-30" />
				</div>
				<Skeleton class="h-4 w-40" />
			</div>
		</div>
	</div>
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
				{@render videoLoader()}
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
				<h3 class="text-2xl font-bold tracking-tight">Грешка при зареждане на видеата</h3>
				<Button onclick={reset} variant="outline">Опитай отново</Button>
			</div>
		</div>
	{/snippet}
</svelte:boundary>
