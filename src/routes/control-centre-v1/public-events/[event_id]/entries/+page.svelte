<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Download from '@lucide/svelte/icons/download';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Users from '@lucide/svelte/icons/users';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { DateFormatter } from '@internationalized/date';
	import { toast } from 'svelte-sonner';
	import AddEntryDialog from './add-entry-dialog.svelte';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import EntriesBlock from './EntriesBlock.svelte';
	import { downloadPublicEventEntriesRemote } from '../../actions.remote';
	import Filters from './filters.svelte';

	let { data, form } = $props();

	const dfEventDate = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short',
		hour12: false
	});

	let downloading = $state(false);

	async function downloadEmails(format: 'csv' | 'txt') {
		if (downloading) return;

		downloading = true;
		// Fetch all entries (not just paginated) for download
		downloadPublicEventEntriesRemote({ eventId: data.event.id, format })
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

	$effect(() => {
		if (form?.message) {
			if (form.form.valid) {
				toast.success(form.message);
			} else {
				toast.error(form.message);
			}
		}
	});
</script>

<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 py-1.5"
>
	<div class="flex items-center justify-between gap-4">
		<Button
			variant="outline"
			size="icon"
			class="h-7 w-7 shrink-0"
			href="/control-centre-v1/public-events"
		>
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Записани за събитие</h1>
	</div>

	<div class="flex items-center gap-2">
		{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.EditEvents)}
			<AddEntryDialog data={data.addEntryForm} />
		{/if}
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
</div>

<Filters />

<!-- Event Info Card -->
<Card.Root class="mb-6">
	<Card.Header>
		<Card.Title>{data.event.name}</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="flex flex-wrap items-center gap-4">
			<Badge variant="secondary" class="text-sm">
				<Calendar class="mr-2 h-4 w-4" />
				{dfEventDate.format(new Date(data.event.date))}
			</Badge>
			<Badge variant="outline" class="text-sm">
				<Users class="mr-2 h-4 w-4" />
				{data.totalItems} записани
			</Badge>
		</div>
	</Card.Content>
</Card.Root>

<PaginationResultsInfo
	page={data.page}
	limit={data.limit}
	totalItems={data.totalItems}
	totalPages={data.totalPages}
/>

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
