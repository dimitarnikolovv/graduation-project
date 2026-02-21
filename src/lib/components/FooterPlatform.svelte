<script lang="ts">
	import { cn } from '$lib/utils';
	import GridPattern from './GridPattern.svelte';

	type Props = {
		useGrid?: boolean;
		class?: string;
	};
	let { useGrid = false, class: className = '' }: Props = $props();
</script>

<footer class={cn('relative isolate overflow-y-hidden', className)}>
	{#if useGrid}
		<GridPattern
			interactive={true}
			yOffset={0}
			class="absolute inset-x-0 -z-10 h-100 w-full mask-[linear-gradient(to_bottom,white_50%,transparent_60%)] fill-neutral-50 stroke-neutral-950/5 md:mask-[linear-gradient(to_bottom_left,white_40%,transparent_50%)]"
		/>
	{/if}
	<div class="mx-auto max-w-7xl overflow-hidden px-6 pt-20 pb-4 sm:pt-24 lg:px-8">
		<p class="text-muted-foreground mt-10 text-center text-sm/6">
			Всички права запазени &copy;
			{new Date().getFullYear()}
		</p>
	</div>
</footer>
