<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { PublicEventEntry } from '$lib/server/db/schema/publicEventEntries';
	import { DateFormatter } from '@internationalized/date';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import { deletePublicEventEntryRemote } from '../../actions.remote';

	type Props = {
		entry: PublicEventEntry;
		index: number;
		page: number;
		limit: number;
		userPermissions: PermissionsObject | undefined;
	};

	const { entry, index, page, limit, userPermissions }: Props = $props();

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	let openDelete = $state(false);
	let disabled = $state(false);

	async function deleteCurrentEntry() {
		disabled = true;

		try {
			const result = await deletePublicEventEntryRemote({
				id: entry.id,
				eventId: entry.eventId
			});

			if (result.success) {
				toast.success(result.message);
				await invalidateAll();
				return;
			}

			toast.error(result.message);
		} catch (err) {
			console.error(err);

			toast.error('Възникна грешка при изтриването на участника.');
		} finally {
			disabled = false;
			openDelete = false;
		}
	}
</script>

<Table.Row>
	<Table.Cell class="font-medium">
		{(page - 1) * limit + index + 1}
	</Table.Cell>
	<Table.Cell class="font-mono">{entry.atendeeEmail}</Table.Cell>

	<Table.Cell class="font-medium">{entry.atendeeName}</Table.Cell>

	<Table.Cell class="text-muted-foreground text-right">
		{dfShort.format(entry.createdAt)}
	</Table.Cell>
	{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditEvents)}
		<Table.Cell class="text-right">
			<Button
				type="button"
				size="icon"
				variant="ghost"
				{disabled}
				onclick={() => (openDelete = true)}
			>
				<Trash2 class="text-destructive h-4 w-4" />
			</Button>
		</Table.Cell>
	{/if}
</Table.Row>

<!-- delete -->

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditEvents)}
	<ResponsiveDialog bind:open={openDelete} closeButtonText="Отказ" {disabled}>
		{#snippet title()}
			Изтриване на участник
		{/snippet}

		{#snippet description()}
			Веднъж изтрит, участникът не може да бъде възстановен.
		{/snippet}

		{#snippet content()}
			<div>
				Сигурни ли сте, че искате да изтриете участник:
				<br />
				<span class="font-mono font-bold">{entry.atendeeEmail}</span>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<Button
				{disabled}
				variant="destructive"
				class="bg-destructive! text-destructive-foreground z-10 w-full"
				onclick={async () => await deleteCurrentEntry()}
			>
				Изтрий
			</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
