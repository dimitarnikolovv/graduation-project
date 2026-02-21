<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { setContext } from 'svelte';

	type Props = HTMLAttributes<HTMLElement> & {
		responsive?: boolean;
	};

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});

	setContext('crossfade', { send, receive });

	let { class: className, children, responsive = true, ...restProps }: Props = $props();
</script>

<nav
	class={cn(
		`bg-muted text-muted-foreground mx-auto flex w-full items-center justify-stretch overflow-x-auto rounded-lg p-1 `,
		responsive && 'auto-height max-xl:flex-col',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</nav>

<style>
	@media (max-width: 1280px) {
		nav.auto-height > :global(:nth-child(1)) ~ :global(:nth-child(n)) {
			/* Each additional child increases parent height */
			margin-top: 0.25rem;
		}

		nav.auto-height > :global(:nth-child(n)) {
			/* This will add 1.75rem height per child */
			min-height: 1.75rem;
		}
	}
</style>
