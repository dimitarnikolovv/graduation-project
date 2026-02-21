<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { checkIfUserHasPermission } from '$lib/utils/access-control.js';
	import { UserPermissionsEnum } from '$lib/types/enums.js';
	import AddEntryDialog from './add-entry-dialog.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Calendar from '@lucide/svelte/icons/calendar';
	import * as PageNav from '$lib/components/page-navigation/index';
	import FileInput from '@lucide/svelte/icons/file-input';
	import { DateFormatter } from '@internationalized/date';
	import Filters from './filters.svelte';

	let { data, children } = $props();

	const dfEventDate = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short',
		hour12: false
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
			href="/control-centre-v1/paid-events"
		>
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Записани за събитие</h1>
	</div>

	<div class="flex items-center gap-2">
		{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.EditEvents)}
			<AddEntryDialog data={data.addEntryForm} eventId={data.event.id} />
		{/if}
	</div>
</div>

<Filters />

<!-- Event Info Card -->
<Card.Root class="mb-4">
	<Card.Header>
		<Card.Title>{data.event.name}</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="flex flex-wrap items-center gap-4">
			<Badge variant="secondary" class="text-sm">
				<Calendar class="mr-2 h-4 w-4" />
				{dfEventDate.format(new Date(data.event.date))}
			</Badge>

			<Badge variant="secondary" class="text-sm">
				<FileInput class="mr-2 h-4 w-4" />
				{data.paidEntriesCount + data.unpaidEntriesCount}
				{data.paidEntriesCount + data.unpaidEntriesCount === 1 ? 'записан' : 'записани'}
			</Badge>
		</div>
	</Card.Content>
</Card.Root>

<PageNav.Root>
	<PageNav.Item
		class="max-xl:flex-row-reverse"
		href="/control-centre-v1/paid-events/{data.event.id}/entries"
	>
		Платени <Badge variant="outline" class="py-0">{data.paidEntriesCount}</Badge>
	</PageNav.Item>

	<PageNav.Item
		class="max-xl:flex-row-reverse"
		href="/control-centre-v1/paid-events/{data.event.id}/entries/unpaid"
	>
		Неплатени <Badge variant="outline" class="py-0">{data.unpaidEntriesCount}</Badge>
	</PageNav.Item>
</PageNav.Root>

{@render children?.()}
