<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Download from '@lucide/svelte/icons/download';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import { toast } from 'svelte-sonner';
	import EntriesBlock from '../EntriesBlock.svelte';
	import { downloadPaidEventEntriesRemote } from '../../../actions.remote';

	let { data } = $props();

	let downloading = $state(false);

	async function downloadEmails(format: 'csv' | 'txt') {
		if (downloading) return;

		downloading = true;
		// Fetch all entries (not just paginated) for download
		downloadPaidEventEntriesRemote({ eventId: data.event.id, format, target: 'unpaid' })
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

<div class="flex items-center justify-between gap-4 flex-wrap">
	<div class="flex items-center gap-2">
		<Button
			size="sm"
			variant="outline"
			onclick={() => downloadEmails('txt')}
			disabled={downloading}
		>
			<Download class="mr-2 h-4 w-4" /> TXT
		</Button>
		<Button
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

{#if !(data.entries && data.entries.length > 0)}
	<div
		class="flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
	>
		<div class="flex flex-col items-center gap-4 text-center">
			<h3 class="text-2xl font-bold tracking-tight">Няма записани участници</h3>
			<p class="text-muted-foreground">Все още няма регистрирани имейли за това събитие.</p>
		</div>
	</div>
{:else}
	<EntriesBlock
		entries={data.entries}
		userPermissions={data.userPermissions}
		page={data.page}
		limit={data.limit}
		totalItems={data.totalItems}
		totalPages={data.totalPages}
	/>
{/if}
