<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { UserPermissionsEnum } from '$lib/types/enums.js';
	import { checkIfUserHasPermission } from '$lib/utils/access-control.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import EventCard from './EventCard.svelte';

	let { data } = $props();

	const handlePageChange = async (newPage: number | undefined) => {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};
</script>

<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex items-center justify-between gap-4 py-1.5"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Платени събития</h1>
	</div>

	{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.CreateEvents)}
		<Button size="sm" class="flex items-center gap-2" href="/control-centre-v1/paid-events/create">
			<CirclePlus class="h-5 w-5 max-md:h-4 max-md:w-4" /> Ново събитие
		</Button>
	{/if}
</div>

<PaginationResultsInfo
	page={data.page}
	limit={data.limit}
	totalItems={data.totalItems}
	totalPages={data.totalPages}
/>

{#if !(data.events && data.events.length > 0)}
	<div
		class="flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
	>
		<div class="flex flex-col items-center gap-4 text-center">
			<h3 class="text-2xl font-bold tracking-tight">Няма намерени събития</h3>

			{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.CreateEvents)}
				<Button class="flex items-center gap-2" href="/control-centre-v1/paid-events/create">
					<CirclePlus class="h-5 w-5 max-md:h-4 max-md:w-4" /> Ново събитие
				</Button>
			{/if}
		</div>
	</div>
{:else}
	<div class="grid grid-cols-1 gap-4 max-lg:gap-y-6 lg:grid-cols-2 xl:grid-cols-3">
		{#each data.events as event}
			<EventCard {event} userPermissions={data.userPermissions} />
		{/each}
	</div>

	<Pagination.Root
		count={data.totalItems}
		page={data.page}
		perPage={data.limit}
		onPageChange={async (p) => {
			await handlePageChange(p);
		}}
	>
		{#snippet children({ pages, currentPage })}
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton
						onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}
					>
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
					<Pagination.NextButton
						onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}
					>
						<span class="hidden sm:inline">Напред</span>
						<ChevronRight class="w-4"></ChevronRight>
					</Pagination.NextButton>
				</Pagination.Item>
			</Pagination.Content>
		{/snippet}
	</Pagination.Root>
{/if}
