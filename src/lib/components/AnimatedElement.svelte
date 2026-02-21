<script lang="ts">
	import { cn } from '$lib/utils';
	import { inview } from '$lib/utils/inview';
	import type { Snippet } from 'svelte';
	import { fly, type FlyParams } from 'svelte/transition';

	let isInView: boolean = $state(false);

	type Props = {
		class?: string;
		children?: Snippet;
		params?: FlyParams;
		rootMargin?: string;
	};

	let { class: className = '', children, params, rootMargin = '-20%' }: Props = $props();
</script>

<!-- SEO FIXER -->

<div
	class={cn('', className)}
	use:inview={{ unobserveOnEnter: true, rootMargin }}
	oninview_enter={() => (isInView = true)}
>
	{#if isInView}
		<div in:fly={params} class="flex">
			{@render children?.()}
		</div>
	{:else}
		<!-- SEO FIX -->
		<div class="flex opacity-0">
			{@render children?.()}
		</div>
	{/if}
</div>
