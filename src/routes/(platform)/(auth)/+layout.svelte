<script lang="ts">
	import GridPattern from '$lib/components/GridPattern.svelte';

	let { children } = $props();
</script>

<div class="my-6 p-2 sm:p-4">
	<GridPattern
		interactive={true}
		yOffset={-3}
		class="absolute inset-x-0 -z-10 -mt-12 h-full max-h-[90dvh] w-full mask-[linear-gradient(to_bottom,white_80%,transparent_90%)] fill-neutral-50 stroke-neutral-950/5 sm:-mt-14 md:mask-[linear-gradient(to_bottom,white_60%,transparent_70%)] lg:-mt-16"
	/>
	{@render children()}
</div>
