<script lang="ts">
	/**
	 * Attempts Layout Component
	 *
	 * Provides the tabbed navigation for pending vs graded attempts.
	 */

	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { cn } from '$lib/utils';
	import * as PageNav from '$lib/components/page-navigation/index';
	import AttemptFilters from './_components/AttemptFilters.svelte';

	let { children, data } = $props();

	/** Check if the current path matches the given href */
	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<!-- Header -->
<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex items-center justify-between gap-4 py-1.5"
>
	<div class="flex items-center gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1/tests">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад към тестове</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Опити за оценяване</h1>
	</div>
</div>

<PageNav.Root>
	<PageNav.Item class="max-xl:flex-row-reverse" href="/control-centre-v1/tests/attempts/pending">
		Очакващи оценка
	</PageNav.Item>

	<PageNav.Item class="max-xl:flex-row-reverse" href="/control-centre-v1/tests/attempts/graded">
		Оценени
	</PageNav.Item>
</PageNav.Root>

<!-- Filters -->
<AttemptFilters tests={data.tests} />

<div class="flex-1 space-y-6">
	{@render children?.()}
</div>
