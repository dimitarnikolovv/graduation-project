<script lang="ts">
	import { setContext } from 'svelte';
	import SessionRow from './sessionRow.svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { deleteAllSessionsSchema } from './schema';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';

	let { data, form } = $props();

	setContext('deleteSessionForm', data.deleteSessionForm);

	const deleteSessionForm = superForm(data.deleteAllSessionsForm, {
		validators: zod4Client(deleteAllSessionsSchema),
		dataType: 'json',
		resetForm: false
	});

	const {
		form: deleteFormData,
		enhance: deleteEnhance,
		delayed: deleteDelayed
	} = deleteSessionForm;

	$deleteFormData.userId = data.foundUser.id;

	let openDelete = $state(false);

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

{#if data.foundSessions.length === 0}
	<div
		class="flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
	>
		<h3 class="text-2xl font-bold tracking-tight">Няма намерени сесии</h3>
	</div>
{:else}
	<div>
		{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.EditUsers)}
			<div class="flex items-center justify-end">
				<Button
					variant="destructive"
					size="sm"
					onclick={() => {
						openDelete = true;
					}}
					disabled={$deleteDelayed}
				>
					<Trash2 class="h-4 w-4" /> Изтрий всички
				</Button>
			</div>
		{/if}
	</div>
	<div class="flex flex-col gap-4">
		{#each data.foundSessions as session}
			<SessionRow userId={data.foundUser.id} {session} userPermissions={data.userPermissions} />
		{/each}
	</div>
{/if}

{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.EditUsers)}
	<Dialog.Root bind:open={openDelete}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
				<Dialog.Description class="text-foreground text-center">
					Сигурни ли сте, че искате да изтриете
					<span class="font-mono font-bold break-all">
						<br /> всички сесии на {data.foundUser.firstName} {data.foundUser.lastName}</span
					>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<form
						action="/control-centre-v1/users/{data.foundUser.id}/sessions?/deleteAllUserSession"
						method="POST"
						use:deleteEnhance
					>
						<Button
							type="submit"
							onclick={() => {
								openDelete = false;
							}}
							disabled={$deleteDelayed}
							variant="destructive">Изтрий</Button
						>
					</form>
					<Button
						variant="outline"
						disabled={$deleteDelayed}
						onclick={() => {
							openDelete = false;
						}}
					>
						Отказ
					</Button>
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
