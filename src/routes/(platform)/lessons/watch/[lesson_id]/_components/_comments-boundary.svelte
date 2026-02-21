<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
	};

	const { children }: Props = $props();
</script>

{#snippet commentLoader()}
	<div class="space-y-4">
		<Skeleton class="h-20 w-full rounded-md" />
		<Skeleton class="h-20 w-full rounded-md" />
		<Skeleton class="h-20 w-full rounded-md" />
		<Skeleton class="h-20 w-full rounded-md" />
	</div>
{/snippet}

<svelte:boundary>
	{@render children?.()}

	{#snippet pending()}
		{@render commentLoader()}
	{/snippet}

	{#snippet failed(_error, reset)}
		<div
			class="mt-4 flex h-48 w-full items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
		>
			<div class="flex flex-col items-center gap-4 text-center">
				<h3 class="text-2xl font-bold tracking-tight">Грешка при зареждане на коментарите</h3>
				<Button onclick={reset} variant="outline">Опитай отново</Button>
			</div>
		</div>
	{/snippet}
</svelte:boundary>
