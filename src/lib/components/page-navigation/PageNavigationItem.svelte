<script lang="ts">
	import { page } from '$app/state';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import type { CrossfadeParams, TransitionConfig } from 'svelte/transition';
	import { getContext } from 'svelte';
	import { PUBLIC_HOST } from '$env/static/public';

	type Context = {
		send: (
			node: Element,
			params: CrossfadeParams & {
				key: string | number;
			}
		) => () => TransitionConfig;
		receive: (
			node: Element,
			params: CrossfadeParams & {
				key: string | number;
			}
		) => () => TransitionConfig;
	};

	const { send, receive } = getContext<Context>('crossfade');

	// Function go generate the url with the current search params except the limit and page
	const generateUrl = (path: string) => {
		const url = new URL(path, PUBLIC_HOST);

		const searchParams = new URLSearchParams(page.url.search); // Avoid mutating the original URLSearchParams
		searchParams.delete('limit');
		searchParams.delete('page');

		if (searchParams.size === 0) {
			return url.toString();
		}

		url.search = searchParams.toString();

		return url.toString();
	};

	type AdditionalProps = {
		href: string;
		preserveSearchParams?: boolean;
		isActiveFn?: () => boolean;
	};

	let {
		class: className,
		children,
		href,
		isActiveFn,
		preserveSearchParams = true, // Added new property
		...restProps
	}: HTMLAttributes<HTMLAnchorElement> & AdditionalProps = $props();

	let isActive = $derived(isActiveFn ? isActiveFn() : page.url.pathname === href);

	// Use preserveSearchParams to conditionally generate the URL
	const finalHref = preserveSearchParams ? generateUrl(href) : href;
</script>

<a
	class={cn(
		isActive && 'text-foreground',
		`ring-offset-background hover:text-foreground focus-visible:ring-ring relative isolate inline-flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 xl:justify-center`,
		className
	)}
	{...restProps}
	data-sveltekit-noscroll
	href={finalHref}
>
	{#if isActive}
		<div
			class="bg-background absolute inset-0 -z-10 rounded-md transition-all"
			in:send={{ key: 'active-nav-item' }}
			out:receive={{ key: 'active-nav-item' }}
		></div>
	{/if}

	{@render children?.()}
</a>
