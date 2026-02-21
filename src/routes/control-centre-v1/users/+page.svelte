<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Pagination from '$lib/components/ui/pagination';
	import { Button } from '$lib/components/ui/button/index';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import Filters from './filters.svelte';
	import UserRow from './userRow.svelte';
	import { toast } from 'svelte-sonner';
	import Download from '@lucide/svelte/icons/download';
	import { downloadUsersEmailsRemote } from './users.remote';

	const { data } = $props();

	const handlePageChange = async (newPage: number | undefined) => {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search); // Avoid mutating the original URLSearchParams
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};

	let downloading = $state(false);

	async function downloadEmails(format: 'csv' | 'txt') {
		if (downloading) return;

		downloading = true;
		// Fetch all entries (not just paginated) for download
		downloadUsersEmailsRemote({ format })
			.then((response) => {
				const url = window.URL.createObjectURL(
					new Blob([response.content], { type: response.contentType + '; charset=utf-8' })
				);
				const a = document.createElement('a');
				a.href = url;
				a.download = response.filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success(`Имейлите бяха изтеглени успешно като ${format.toUpperCase()}`);

				downloading = false;
			})
			.catch((error) => {
				console.error('Download error:', error);
				toast.error('Възникна грешка при изтеглянето на имейлите');

				downloading = false;
			});
	}
</script>

<div
	class="bg-background z-50 -mx-2 flex items-center justify-between gap-4 px-2 py-1.5 md:sticky md:top-0 md:-mx-4 md:px-4 lg:-mx-6 lg:px-6"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Потребители</h1>
	</div>
</div>

<Filters />

<div class="flex flex-wrap items-center justify-between gap-2">
	<div class="flex items-center gap-2">
		<Button
			size="sm"
			class="max-sm:w-full"
			variant="outline"
			onclick={() => downloadEmails('txt')}
			disabled={downloading}
		>
			<Download class="mr-2 h-4 w-4" /> TXT
		</Button>
		<Button
			class="max-sm:w-full"
			size="sm"
			variant="outline"
			onclick={() => downloadEmails('csv')}
			disabled={downloading}
		>
			<Download class="mr-2 h-4 w-4" /> CSV
		</Button>
	</div>
	<PaginationResultsInfo
		page={data.page}
		limit={data.limit}
		totalItems={data.totalItems}
		totalPages={data.totalPages}
	/>
</div>
{#if data.users.length === 0}
	<div
		class="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 shadow-sm"
	>
		<h3 class="text-2xl font-bold tracking-tight">Няма съществуващи потребителски профили</h3>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		{#each data.users as user}
			<UserRow {user} userPermissions={data.userPermissions} />
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
