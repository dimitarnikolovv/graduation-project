<script lang="ts">
	import PlatformHeader from '$lib/components/PlatformHeader.svelte';

	import './custom.css';

	let { children, data } = $props();
</script>

<PlatformHeader user={data.user}></PlatformHeader>

<main class="flex flex-1 flex-col gap-4 px-2 py-4 lg:gap-6 lg:p-6">
	{@render children()}
</main>
