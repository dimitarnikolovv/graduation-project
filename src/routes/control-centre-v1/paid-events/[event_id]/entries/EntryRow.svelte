<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { DateFormatter } from '@internationalized/date';
	import { displayPaymentMethod, UserPermissionsEnum } from '$lib/types/enums';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import type { PaidEventEntry } from '$lib/server/db/schema/paidEventEntries';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select';
	import { deletePaidEventEntryRemote, markPaidEventEntryAsPaidRemote } from '../../actions.remote';

	type Props = {
		entry: PaidEventEntry;
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
			const result = await deletePaidEventEntryRemote({
				id: entry.id
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

	async function markAsPaid() {
		disabled = true;

		try {
			const result = await markPaidEventEntryAsPaidRemote({
				entryId: entry.id
			});

			if (result.success) {
				toast.success(result.message);
				await invalidateAll();
				return;
			}

			toast.error(result.message);
		} catch (error) {
			console.error(error);
			toast.error('Възникна грешка при маркирането като платено.');
		} finally {
			disabled = false;
		}
	}

	const isPaid = $derived(entry.paidAt !== null && entry.paidAt !== undefined);
</script>

<Table.Row>
	<Table.Cell class="font-medium">
		{(page - 1) * limit + index + 1}
	</Table.Cell>
	<Table.Cell class="">
		{entry.firstName}
	</Table.Cell>
	<Table.Cell class="">
		{entry.lastName}
	</Table.Cell>
	<Table.Cell class="font-mono">
		<a href="mailto:{entry.atendeeEmail}">{entry.atendeeEmail}</a></Table.Cell
	>
	<Table.Cell class="font-mono"><a href="tel:{entry.phone}">{entry.phone}</a></Table.Cell>
	<Table.Cell class="text-center">
		{#if isPaid}
			<Badge class="font-medium border border-green-500 bg-green-50 text-green-800">Платен</Badge>
		{:else}
			<Select.Root type="single" onValueChange={markAsPaid} {disabled}>
				<Select.Trigger class="w-fit mx-auto border-0 shadow-none">
					<Badge variant="destructive" class="font-medium">Неплатен</Badge>
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Маркирай като платен</Select.Label>

						<Select.Item value="paid" label="Маркирай като платен" {disabled}>
							Маркирай като платен
						</Select.Item>
					</Select.Group>
				</Select.Content>
			</Select.Root>
		{/if}
	</Table.Cell>
	<Table.Cell class="text-center">
		{displayPaymentMethod(entry.paymentMethod)}
	</Table.Cell>
	<Table.Cell class="font-mono">
		{#if entry.transactionId}
			<a href="/control-centre-v1/payments/transactions?internalId={entry.transactionId}">
				{entry.transactionId}
			</a>
		{:else}
			—
		{/if}
	</Table.Cell>

	<Table.Cell class="text-muted-foreground text-right text-sm">
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
				onclick={deleteCurrentEntry}
			>
				Изтрий
			</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
