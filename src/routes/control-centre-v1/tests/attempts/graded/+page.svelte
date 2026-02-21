<script lang="ts">
	/**
	 * Graded Attempts Page
	 *
	 * Lists all attempts that have been graded by teachers/admins.
	 */

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import AttemptRow from '../_components/AttemptRow.svelte';

	const { data } = $props();

	/**
	 * Handles page navigation.
	 */
	async function handlePageChange(newPage: number | undefined) {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	}
</script>

<!-- Results info -->
<PaginationResultsInfo
	page={data.page}
	limit={data.limit}
	totalItems={data.totalItems}
	totalPages={data.totalPages}
/>

<!-- Attempts list -->
{#if data.attempts && data.attempts.length > 0}
	<div class="space-y-3">
		{#each data.attempts as attempt (attempt.id)}
			<AttemptRow {attempt} showGradeButton={false} />
		{/each}
	</div>

	<!-- Pagination -->
	<Pagination.Root
		count={data.totalItems}
		page={data.page}
		perPage={data.limit}
		onPageChange={async (p) => {
			await handlePageChange(p);
		}}
		class="mt-6"
	>
		{#snippet children({ pages, currentPage })}
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton
						onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}
					>
						<ChevronLeft class="w-4" />
						<span class="hidden sm:inline">Назад</span>
					</Pagination.PrevButton>
				</Pagination.Item>
				{#each pages as pg (pg.key)}
					{#if pg.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link page={pg} isActive={currentPage === pg.value}>
								{pg.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton
						onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}
					>
						<span class="hidden sm:inline">Напред</span>
						<ChevronRight class="w-4" />
					</Pagination.NextButton>
				</Pagination.Item>
			</Pagination.Content>
		{/snippet}
	</Pagination.Root>
{:else}
	<!-- Empty state -->
	<div
		class="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-16 dark:border-gray-700 dark:bg-gray-800/50"
	>
		<CheckCircle class="mb-4 h-12 w-12 text-gray-400" />
		<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
			Няма оценени опити
		</h3>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Все още няма напълно оценени тестове.
		</p>
	</div>
{/if}

