<script lang="ts">
	import * as PageNav from '$lib/components/page-navigation/index';

	let { children, data } = $props();
</script>

<PageNav.Root>
	<PageNav.Item href="/control-centre-v1/public-events/{data.event.id}/edit">
		Редактиране
	</PageNav.Item>
	<PageNav.Item href="/control-centre-v1/public-events/{data.event.id}/entries"
		>Записани</PageNav.Item
	>
</PageNav.Root>

{@render children?.()}
