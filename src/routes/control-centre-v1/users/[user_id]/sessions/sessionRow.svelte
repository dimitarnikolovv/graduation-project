<script lang="ts">
	import { DateFormatter } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { deleteSessionSchema, type DeleteSessionSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { getContext } from 'svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { Session } from '$lib/server/db/schema/auth';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';

	type Props = {
		session: Session;
		userId: string;
		userPermissions?: PermissionsObject;
	};

	let { session, userId, userPermissions }: Props = $props();

	const deleteSessionFormData = getContext(
		'deleteSessionForm'
	) as SuperValidated<DeleteSessionSchema>;

	const deleteSessionForm = superForm(deleteSessionFormData, {
		validators: zod4Client(deleteSessionSchema),
		dataType: 'json',
		resetForm: false,
		id: `deleteSessionForm-${session.id}`
	});

	const {
		form: deleteFormData,
		enhance: deleteEnhance,
		delayed: deleteDelayed
	} = deleteSessionForm;

	$deleteFormData.sessionId = session.id;
	$deleteFormData.userId = userId;

	let openDelete = $state(false);

	const df = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short',
		hour12: false
	});

	const hasPermission = checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditUsers);
</script>

<div class="flex flex-col items-start gap-2 overflow-hidden rounded-lg border text-left text-sm">
	<div class="bg-muted flex w-full items-center justify-between gap-4 px-3 py-2">
		<div class="text-xs font-medium break-all">
			{session.id}
		</div>

		{#if hasPermission}
			<Button
				variant="destructive"
				class="h-7 w-7 shrink-0"
				size="icon"
				onclick={() => (openDelete = true)}
			>
				<Trash2></Trash2>
			</Button>
		{/if}
	</div>

	<div class="space-y-1 px-3 pb-3">
		<div class="text-muted-foreground text-xs">
			<span class="text-foreground font-medium">Създадена на: </span>
			{df.format(session.createdAt)}
		</div>

		<div class="text-muted-foreground text-xs">
			<span class="text-foreground font-medium">Изтича на: </span>
			{df.format(session.expiresAt)}
		</div>
	</div>
</div>

{#if hasPermission}
	<Dialog.Root bind:open={openDelete}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
				<Dialog.Description class="text-foreground text-center">
					Сигурни ли сте, че искате да изтриете сесия с ID:
					<span class="font-mono font-bold break-all"> <br /> {session.id}</span>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<form
						action="/control-centre-v1/users/{userId}/sessions?/deleteUserSession"
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
