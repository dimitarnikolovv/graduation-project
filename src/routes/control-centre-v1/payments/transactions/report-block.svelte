<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ReportRowDesktop from './report-row-desktop.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { cn } from '$lib/utils';
	import type { AllExpandedTransactions } from '$lib/server/db-querying/transactions';
	import { TransactionsReportFilters } from '$lib/types/enums';

	type Props = {
		transactions: AllExpandedTransactions['transactions'];
		orderByAsc?: TransactionsReportFilters[];
		orderByDesc?: TransactionsReportFilters[];
		handleOrderFilterChange?: (
			asc: TransactionsReportFilters[],
			desc: TransactionsReportFilters[]
		) => void;
	};

	let {
		transactions,
		orderByAsc = $bindable(),
		orderByDesc = $bindable(),
		handleOrderFilterChange
	}: Props = $props();

	let sidebar = useSidebar();

	function handleFilter(filter: TransactionsReportFilters) {
		if (!handleOrderFilterChange || !orderByAsc || !orderByDesc) return;

		// If in asc array, but not in desc, remove it and add to desc array
		if (orderByAsc.includes(filter) && !orderByDesc.includes(filter)) {
			orderByAsc = orderByAsc.filter((f) => f !== filter);
			orderByDesc = [...orderByDesc, filter];
		}
		// If in desc array, remove it
		else if (orderByDesc.includes(filter)) {
			orderByDesc = orderByDesc.filter((f) => f !== filter);
		}
		// If in both arrays, remove it from both
		else if (orderByAsc.includes(filter) && orderByDesc.includes(filter)) {
			orderByAsc = orderByAsc.filter((f) => f !== filter);
			orderByDesc = orderByDesc.filter((f) => f !== filter);
		}
		// If not in either array, add to asc array
		else {
			orderByAsc = [...orderByAsc, filter];
		}
		// Reset filters if both arrays are empty
		if (orderByAsc.length === 0 && orderByDesc.length === 0) {
			handleOrderFilterChange?.([], []);
		}

		handleOrderFilterChange(orderByAsc, orderByDesc);
	}
</script>

{#snippet getFilterIcon(filter: TransactionsReportFilters)}
	{#if orderByAsc && orderByAsc.includes(filter)}
		<ArrowUp class="max-w-3" />
	{:else if orderByDesc && orderByDesc.includes(filter)}
		<ArrowDown class="max-w-3" />
	{:else}
		<ArrowUpDown class="max-w-3" />
	{/if}
{/snippet}

{#if transactions.length === 0}
	<div
		class="flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
	>
		<h3 class="text-2xl font-bold tracking-tight">Няма намерени транзакции за този период</h3>
	</div>
{:else}
	<ScrollArea
		orientation="horizontal"
		class={cn(
			sidebar.open
				? 'md:w-[calc(100vw-var(--sidebar-width)-4rem)]'
				: 'w-[calc(100vw-4rem-3rem)] overflow-auto'
		)}
	>
		<div class="grid grid-cols-[auto_repeat(9,1fr)] rounded-lg border-x">
			<div
				class="bg-background col-span-full grid grid-cols-subgrid divide-x rounded-t-lg border-y text-center text-sm font-semibold md:top-12 *:px-4 *:py-2"
			>
				<div class="flex items-center justify-center">#</div>

				<div class="flex items-center">Вътрешен номер</div>

				<div class="flex items-center">Външен номер</div>

				<button
					class="flex items-center gap-1 pr-1!"
					onclick={() => handleFilter(TransactionsReportFilters.createdAt)}
				>
					Създадена на
					{@render getFilterIcon(TransactionsReportFilters.createdAt)}
				</button>

				<button
					class="flex items-center justify-end gap-1 pr-1!"
					onclick={() => handleFilter(TransactionsReportFilters.amountInCents)}
				>
					Общо
					{@render getFilterIcon(TransactionsReportFilters.amountInCents)}
				</button>

				<button
					class="flex items-center gap-1 pr-1! justify-center"
					onclick={() => handleFilter(TransactionsReportFilters.cardType)}
				>
					Тип карта
					{@render getFilterIcon(TransactionsReportFilters.cardType)}
				</button>

				<div class="flex items-center justify-center min-w-max">Карта №</div>

				<button
					class="flex items-center gap-1 pr-1!"
					onclick={() => handleFilter(TransactionsReportFilters.email)}
				>
					Имейл
					{@render getFilterIcon(TransactionsReportFilters.email)}
				</button>

				<div class="flex items-center">Имена</div>

				<div class="flex items-center justify-center min-w-max">Поръчка №</div>
			</div>

			{#each transactions as transaction (transaction.id)}
				<ReportRowDesktop {transaction} />
			{/each}
		</div>
	</ScrollArea>
{/if}
