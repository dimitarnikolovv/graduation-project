<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import * as Pagination from '$lib/components/ui/pagination';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import LessonGroupsTable from './lesson-groups-table.svelte';

	let { data } = $props();

	const handlePageChange = async (newPage: number | undefined) => {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search); // Avoid mutating the original URLSearchParams
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
		<h1 class="text-lg font-semibold md:text-2xl">Раздели</h1>
	</div>

	{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.CreateLessonGroups)}
		<Button size="sm" href="/control-centre-v1/lesson-groups/create" class="flex items-center gap-2"
			><CirclePlus class="h-5 w-5 max-md:h-4 max-md:w-4" /> Добави раздел</Button
		>
	{/if}
</div>

{#if !(data.groups && data.groups.length > 0)}
	<div class="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
		<div class="flex flex-col items-center gap-1 text-center">
			<h3 class="text-2xl font-bold tracking-tight">Няма намерени раздели</h3>

			{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.CreateLessonGroups)}
				<Button href="/control-centre-v1/lesson-groups/create" class="mt-4">Добави раздел</Button>
			{/if}
		</div>
	</div>
{:else}
	<div class="">
		{#key data.groups}
			<LessonGroupsTable groups={data.groups} userPermissions={data.userPermissions}
			></LessonGroupsTable>
		{/key}
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
