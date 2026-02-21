<script lang="ts">
	import { page } from '$app/state';
	import FooterPlatform from '$lib/components/FooterPlatform.svelte';
	import * as PageNav from '$lib/components/page-navigation/index';
	import { cn } from '$lib/utils';

	let { children } = $props();
</script>

<div class="container mx-auto px-4">
	<PageNav.Root class={cn('mb-8', page.params.event_id && 'max-w-4xl')}>
		<PageNav.Item
			class="justify-center"
			href="/events/public"
			isActiveFn={() => page.url.pathname.startsWith('/events/public')}
		>
			Безплатни събития
		</PageNav.Item>

		<PageNav.Item
			class="justify-center"
			href="/events/paid"
			isActiveFn={() => page.url.pathname.startsWith('/events/paid')}>Платени събития</PageNav.Item
		>
	</PageNav.Root>

	{@render children?.()}
</div>

<FooterPlatform />
