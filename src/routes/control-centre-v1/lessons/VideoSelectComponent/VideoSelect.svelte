<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Video from './Video.svelte';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import Filters from './filters.svelte';
	import type { ClassGrade, Subject } from '$lib/server/db/schema/subjects';
	import { getVideos } from './data.remote';
	import type { ExpandedVideo } from '$lib/types/videos';

	type Props = {
		selectedVideoId: string | null;

		subjects: Subject[];
		classGrades: ClassGrade[];
		disabled: boolean;

		onVideoSelect?: (video: ExpandedVideo) => void;
	};

	let {
		selectedVideoId = $bindable(null),

		onVideoSelect,

		subjects,
		classGrades,
		disabled
	}: Props = $props();

	let page = $state(1);
	let limit = $state(6);
	let searchParams = $state(new URLSearchParams());

	const { videos, totalItems, totalPages } = $derived(
		await getVideos({
			page,
			limit,
			searchParams
		})
	);

	const handlePageChange = async (newPage: number | undefined) => {
		if (!newPage) return;
		if (newPage > totalPages || newPage < 1) return;

		page = newPage;
	};
</script>

<div class="mt-4 grid gap-4">
	<Filters {subjects} {classGrades} bind:searchParams />

	<PaginationResultsInfo {page} {limit} {totalItems} {totalPages} />

	{#if !(videos && videos.length > 0)}
		<div
			class="flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
		>
			<div class="flex flex-col items-center gap-4 text-center">
				<h3 class="text-2xl font-bold tracking-tight">Няма намерени видеа</h3>
			</div>
		</div>
	{:else}
		<div class="grid gap-3 max-lg:gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
			{#each videos as video (video.id)}
				<Video {video} {onVideoSelect} bind:selectedVideoId {disabled} />
			{/each}
		</div>

		<Pagination.Root
			count={totalItems}
			{page}
			perPage={limit}
			onPageChange={async (p) => {
				await handlePageChange(p);
			}}
		>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton onclick={() => handlePageChange(currentPage ? currentPage : 1)}>
							<ChevronLeft class="w-4"></ChevronLeft> <span class="hidden sm:inline">Назад</span>
						</Pagination.PrevButton>
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link {page} isActive={currentPage === page.value}>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton onclick={() => handlePageChange(currentPage ? currentPage : 1)}>
							<span class="hidden sm:inline">Напред</span>
							<ChevronRight class="w-4"></ChevronRight>
						</Pagination.NextButton>
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	{/if}
</div>
