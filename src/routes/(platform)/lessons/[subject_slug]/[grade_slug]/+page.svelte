<script lang="ts">
	import Smile from '@lucide/svelte/icons/smile';
	import LessonCard from '../../LessonCard.svelte';

	let { data } = $props();
</script>

{#if data.groups.length === 0}
	<div
		class="mt-10 flex items-center justify-center rounded-lg border border-dashed px-2 py-38 shadow-sm"
	>
		<div class="flex flex-col items-center gap-4 text-center">
			<h3 class="text-2xl font-bold tracking-tight">Няма намерени уроци</h3>
			<Smile class="text-muted-foreground h-12 w-12" />
		</div>
	</div>
{:else}
	{#each data.groups as group}
		<section class="isolate">
			<h2
				class="bg-background ignore-main-margin sticky top-14 z-10 flex border-y py-2 text-2xl font-semibold lg:top-17"
			>
				<div
					class="bg-accent flex size-8 items-center justify-center rounded-full p-0.5 text-center font-mono text-xs font-bold"
				>
					{group.order}
				</div>
				&nbsp {group.name}
			</h2>

			{#if group.lessons.length > 0}
				<div
					class="mx-auto mt-4 mb-10 grid w-full gap-x-5 gap-y-2 @xl/inset:grid-cols-2 @4xl/inset:grid-cols-3 @6xl/inset:grid-cols-4 @min-[90rem]/inset:grid-cols-5"
				>
					{#each group.lessons as lesson}
						<LessonCard {lesson} fluid={true} />
					{/each}
				</div>
			{:else}
				<div
					class="my-5 flex items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-xs"
				>
					<div class="flex flex-col items-center gap-4 text-center">
						<h3 class="text-2xl font-bold tracking-tight">Очаквайте скоро</h3>
						<Smile class="text-muted-foreground h-12 w-12" />
					</div>
				</div>
			{/if}
		</section>
	{/each}
{/if}
