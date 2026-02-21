<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { toast } from 'svelte-sonner';
	import type { PermissionsObject } from '$lib/types/permissions';
	import type { LessonGroup } from '$lib/server/db/schema/lessonGroups';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { deleteLessonGroupRemote } from './lesson-groups.remote';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		group: LessonGroup;
		userPermissions?: PermissionsObject;
	};
	let { group, userPermissions }: Props = $props();

	let openDelete = $state(false);
	let disabled = $state(false);

	async function deleteCurrentGroup() {
		disabled = true;

		try {
			await deleteLessonGroupRemote({
				id: group.id
			});

			toast.success('Разделът беше изтрит успешно.');
			await invalidateAll();
		} catch (err) {
			toast.error('Възникна грешка при изтриването на раздела.');
		} finally {
			disabled = false;
			openDelete = false;
		}
	}
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
					navigator.clipboard.writeText(group.id.toString());
					toast.success('ID-то е копирано в клипборда.');
				}}
				class="cursor-pointer"
			>
				<ClipboardCopy class="max-w-5"></ClipboardCopy>
				<span> Копирай ID </span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditLessonGroups)}
			<DropdownMenu.Item>
				<a
					href="/control-centre-v1/lesson-groups/{group.id}/edit"
					class="flex w-full items-center gap-2"
				>
					<SquarePen class="max-w-4" /> Редактиране
				</a>
			</DropdownMenu.Item>
		{/if}

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteLessonGroups)}
			<DropdownMenu.Separator></DropdownMenu.Separator>
			<DropdownMenu.Item
				class="{buttonVariants({ variant: 'destructive' })} h-8 w-full cursor-pointer p-0"
				onclick={() => {
					openDelete = true;
				}}
			>
				<Trash2 class="mr-2 ml-0 max-w-5"></Trash2>
				Изтрий
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteLessonGroups)}
	<Dialog.Root bind:open={openDelete}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
				<Dialog.Description class="text-center">
					Сигурни ли сте че искате да изтриете раздел: <br />
					<span class="font-mono font-bold">{group.name}</span>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<Button type="submit" onclick={deleteCurrentGroup} {disabled} variant="destructive"
						>Изтрий</Button
					>

					<Button
						onclick={() => {
							openDelete = false;
						}}
						{disabled}
						class="border-0"
					>
						Отказ
					</Button>
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
