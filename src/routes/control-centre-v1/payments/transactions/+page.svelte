<script lang="ts">
	import ReportBlock from './report-block.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import * as Select from '$lib/components/ui/select/index';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import { Button } from '$lib/components/ui/button';
	import PeriodSelectCombo from './period-select-combo.svelte';
	import Filters from './filters.svelte';
	import { TransactionsReportFilters } from '$lib/types/enums';

	let { data } = $props();

	let limit = $derived(data.limit);

	let orderByAscFilters = $derived.by(() => {
		const orderByAsc = page.url.searchParams.getAll('asc');

		if (!orderByAsc.length) return [];

		return Array.from(Object.values(TransactionsReportFilters)).filter((filter) =>
			orderByAsc.includes(filter)
		);
	});

	let orderByDescFilters = $derived.by(() => {
		const orderByDesc = page.url.searchParams.getAll('desc');

		if (!orderByDesc.length) return [];

		return Array.from(Object.values(TransactionsReportFilters)).filter((filter) =>
			orderByDesc.includes(filter)
		);
	});

	const handlePageChange = async (newPage: number | undefined) => {
		const searchParams = new URLSearchParams(page.url.search); // Avoid mutating the original URLSearchParams

		searchParams.set('page', newPage?.toString() || '');
		searchParams.set('limit', limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};

	const handleOrderFilterChange = async (
		asc: TransactionsReportFilters[],
		desc: TransactionsReportFilters[]
	) => {
		const url = new URL(page.url.href);

		url.searchParams.delete('asc');
		url.searchParams.delete('desc');

		if (asc.length) {
			asc.forEach((filter) => url.searchParams.append('asc', filter));
		}

		if (desc.length) {
			desc.forEach((filter) => url.searchParams.append('desc', filter));
		}

		await goto(url);
	};
</script>

<div
	class="bg-background z-50 -mx-2 flex flex-wrap items-center justify-between gap-4 px-2 py-1.5 md:sticky md:top-0 md:-mx-4 md:px-4 lg:-mx-6 lg:px-6"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href={'/control-centre-v1'}>
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Транзакции</h1>
	</div>
	<div class="flex items-center gap-2 max-sm:w-full">
		<PeriodSelectCombo />
	</div>
</div>

<Filters />

{#if !data.transactions || !data.transactions.length}
	<div
		class="flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
	>
		<h3 class="text-2xl font-bold tracking-tight">Няма намерени транзакции</h3>
	</div>
{:else}
	<div class="flex items-center gap-4 max-sm:flex-col sm:justify-between">
		<Select.Root
			type="single"
			onValueChange={(v) => {
				limit = parseInt(v);
				handlePageChange(data.page);
			}}
			value={limit.toString()}
		>
			<Select.Trigger class="max-sm:w-full sm:max-w-25">{limit}</Select.Trigger>
			<Select.Content>
				{#each new Array(50) as _, index}
					<Select.Item value={((index + 1) * 10).toString()}>{(index + 1) * 10}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<div class="w-full">
			<PaginationResultsInfo
				page={data.page}
				{limit}
				totalItems={data.totalItems}
				totalPages={Math.ceil(data.totalItems / limit)}
			/>
		</div>
	</div>

	<ReportBlock
		transactions={data.transactions}
		bind:orderByAsc={orderByAscFilters}
		bind:orderByDesc={orderByDescFilters}
		{handleOrderFilterChange}
	/>

	<Pagination.Root
		count={data.totalItems}
		page={data.page}
		perPage={limit}
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
