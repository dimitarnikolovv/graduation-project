<script lang="ts">
	import * as PageNav from '$lib/components/page-navigation/index';

	let { children, data } = $props();
</script>

<PageNav.Root>
	<PageNav.Item href="/control-centre-v1/tests/{data.test.id}/edit">Редактиране</PageNav.Item>
	<PageNav.Item href="/control-centre-v1/tests/{data.test.id}/preview">Преглед</PageNav.Item>
	{#if data.test.isPaid}
		<PageNav.Item href="/control-centre-v1/tests/{data.test.id}/entries">Записани</PageNav.Item>
	{/if}
</PageNav.Root>

{@render children?.()}
