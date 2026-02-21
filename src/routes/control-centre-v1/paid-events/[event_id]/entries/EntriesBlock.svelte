<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import * as Pagination from '$lib/components/ui/pagination/index.js';

	import EntryRow from './EntryRow.svelte';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import type { PaidEventEntry } from '$lib/server/db/schema/paidEventEntries';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	type Props = {
		entries: PaidEventEntry[];
		userPermissions?: PermissionsObject;
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};

	const {
		entries,
		userPermissions,
		page: paginationPage,
		limit,
		totalItems,
		totalPages
	}: Props = $props();

	const handlePageChange = async (newPage: number | undefined) => {
		if (newPage === undefined) return;
		if (newPage > totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};
</script>

<div class="rounded-md border thin-scrollbar-all">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-25">#</Table.Head>
				<Table.Head>Име</Table.Head>
				<Table.Head>Фамилия</Table.Head>
				<Table.Head>Имейл</Table.Head>
				<Table.Head>Телефон</Table.Head>
				<Table.Head class="max-w-25 text-center">Платен</Table.Head>
				<Table.Head class="text-center">Начин на плащане</Table.Head>
				<Table.Head>ID на транзакция</Table.Head>
				<Table.Head class="text-right">Записан на</Table.Head>
				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditEvents)}
					<Table.Head class="w-25"></Table.Head>
				{/if}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each entries as entry, index}
				<EntryRow {entry} {index} page={paginationPage} {limit} {userPermissions} />
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<Pagination.Root
	count={totalItems}
	page={paginationPage}
	perPage={limit}
	onPageChange={async (p) => {
		await handlePageChange(p);
	}}
>
	{#snippet children({ pages, currentPage })}
		<Pagination.Content>
			<Pagination.Item>
				<Pagination.PrevButton onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}>
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
				<Pagination.NextButton onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}>
					<span class="hidden sm:inline">Напред</span>
					<ChevronRight class="w-4"></ChevronRight>
				</Pagination.NextButton>
			</Pagination.Item>
		</Pagination.Content>
	{/snippet}
</Pagination.Root>
