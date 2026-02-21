<script lang="ts">
	import * as PageNav from '$lib/components/page-navigation/index';
	import { Button } from '$lib/components/ui/button/index';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';

	let { data, children } = $props();
</script>

<div
	class="bg-background z-50 -mx-2 flex flex-wrap items-center justify-between gap-4 px-2 py-1.5 md:sticky md:top-0 md:-mx-4 md:px-4 lg:-mx-6 lg:px-6"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1/users">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">
			<div>
				{data.foundUser.firstName}
				{data.foundUser.lastName}
			</div>

			<div class="text-muted-foreground text-sm">
				<a href="mailto:{data.foundUser.email}" class="flex items-center gap-1 hover:underline">
					{data.foundUser.email}
				</a>
			</div>
		</h1>
	</div>
</div>

<!-- TODO CHANGE WITH LESSON DATA -->
<PageNav.Root>
	<PageNav.Item href="/control-centre-v1/users/{data.foundUser.id}">Профил</PageNav.Item>
	<PageNav.Item href="/control-centre-v1/users/{data.foundUser.id}/sessions">Сесии</PageNav.Item>
</PageNav.Root>

{@render children?.()}
