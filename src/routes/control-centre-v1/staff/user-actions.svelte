<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { deleteAdminSchema, type DeleteAdminSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { User } from '$lib/server/db/schema/auth';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';

	type Props = {
		user: User;
		userPermissions?: PermissionsObject;
	};
	let { user, userPermissions }: Props = $props();

	const deleteAdminFormData: SuperValidated<DeleteAdminSchema> = getContext('deleteAdminForm');

	const deleteAdminForm = superForm(deleteAdminFormData, {
		validators: zod4Client(deleteAdminSchema),
		resetForm: true,
		dataType: 'json',
		id: `deleteAdminForm-${user.id}`
	});

	const { form: deleteFormData, enhance: deleteEnhace, delayed: deleteDelayed } = deleteAdminForm;

	$deleteFormData.id = user.id;

	let open = $state(false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="{buttonVariants({ variant: 'ghost', size: 'icon' })} h-8 w-8">
		<span class="sr-only">Отвори менюто</span>
		<Ellipsis class="h-4 w-4" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Действия</DropdownMenu.Label>
			<DropdownMenu.Item
				onclick={() => {
					navigator.clipboard.writeText(user.id.toString());
					toast.success(`ID-то на потребителя ${user.firstName} е копирано в клипборда!`);
				}}
				class="cursor-pointer"
			>
				<ClipboardCopy class="max-w-5"></ClipboardCopy>
				<span> Копирай ID </span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditAdmins)}
			<DropdownMenu.Item class="!p-0">
				<Button
					variant="ghost"
					size="sm"
					class="justify-start !px-2 font-normal text-inherit"
					href="/control-centre-v1/staff/{user.id}/edit"
				>
					<SquarePen class="max-w-5"></SquarePen>
					<span> Редактиране </span>
				</Button>
			</DropdownMenu.Item>

			<DropdownMenu.Separator></DropdownMenu.Separator>
			<DropdownMenu.Item
				class="{buttonVariants({ variant: 'destructive' })} h-8 w-full cursor-pointer p-0"
				onclick={() => {
					open = true;
				}}
			>
				<Trash2 class="stroke-destructive-foreground mr-2 ml-0 max-w-5"></Trash2>
				Изтрий
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditAdmins)}
	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
				<Dialog.Title class="text-destructive text-center leading-6"
					>Това действие е необратимо!</Dialog.Title
				>
				<Dialog.Description class="text-center">
					Сигурни ли сте че искате да изтриете: <br />
					<span class="font-mono font-bold">{user.firstName} {user.lastName} - {user.email}</span>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<form action="?/deleteAdmin" method="POST" use:deleteEnhace>
						<Button
							type="submit"
							onclick={() => {
								open = false;
							}}
							disabled={$deleteDelayed}
							variant="destructive">Изтрий</Button
						>
					</form>
					<Button
						onclick={() => {
							open = false;
						}}
						class="border-0"
					>
						Отказ
					</Button>
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
