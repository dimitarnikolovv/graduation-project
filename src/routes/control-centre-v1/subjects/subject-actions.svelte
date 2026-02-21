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
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { PermissionsObject } from '$lib/types/permissions';
	import type { Subject } from '$lib/server/db/schema/subjects';
	import { updateSubjectSchema, type UpdateSubjectSchema } from './schema';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { invalidateAll } from '$app/navigation';
	import { deleteSubjectRemote } from './subjects.remote';
	import SubjectsFormFields from './SubjectsFormFields.svelte';
	import { isHttpError } from '@sveltejs/kit';

	type Props = {
		subject: Subject;
		userPermissions?: PermissionsObject;
	};
	let { subject, userPermissions }: Props = $props();

	const updateSubjectForm = getContext('updateSubjectForm') as SuperValidated<UpdateSubjectSchema>;

	const updateSubjectsForm = superForm(updateSubjectForm, {
		validators: zod4Client(updateSubjectSchema),
		resetForm: false,
		id: `updateSubjectForm-${subject.id}`,
		dataType: 'json'
	});

	const {
		form: updateFormData,
		enhance: updateEnhance,
		delayed: updateDelayed
	} = updateSubjectsForm;

	$updateFormData.name = subject.name;
	$updateFormData.slug = subject.slug;

	$updateFormData.id = subject.id;

	let disabledDelete = $state(false);

	async function deleteCurrentSubject() {
		disabledDelete = true;

		try {
			await deleteSubjectRemote({
				id: subject.id
			});

			toast.success('Предметът беше изтрит успешно.');
			await invalidateAll();
		} catch (err) {
			if (isHttpError(err, 409) && err.body.message) {
				toast.error(err.body.message);
				return;
			}

			toast.error('Възникна грешка при изтриването на предмета.');
		} finally {
			disabledDelete = false;
			openDelete = false;
		}
	}

	let openDelete = $state(false);
	let openEdit = $state(false);
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
					navigator.clipboard.writeText(subject.id.toString());
					toast.success('ID-то е копирано в клипборда.');
				}}
				class="cursor-pointer"
			>
				<ClipboardCopy class="max-w-5"></ClipboardCopy>
				<span> Копирай ID </span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditSubjects)}
			<DropdownMenu.Item
				class="cursor-pointer"
				onclick={() => {
					openEdit = true;
				}}
			>
				<SquarePen class="max-w-5"></SquarePen>
				<span> Редактиране </span>
			</DropdownMenu.Item>
		{/if}

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteSubjects)}
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

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteSubjects)}
	<Dialog.Root bind:open={openDelete}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
				<Dialog.Description class="text-center">
					Сигурни ли сте че искате да изтриете предмет: <br />
					<span class="font-mono font-bold">{subject.name}</span>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<Button onclick={deleteCurrentSubject} disabled={disabledDelete} variant="destructive"
						>Изтрий</Button
					>

					<Button
						onclick={() => {
							openDelete = false;
						}}
						disabled={disabledDelete}
						class="border-0"
					>
						Отказ
					</Button>
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditSubjects)}
	<Dialog.Root bind:open={openEdit}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Редактиране</Dialog.Title>
			</Dialog.Header>

			<form action="?/updateSubject" method="POST" use:updateEnhance>
				<div class="grid gap-2">
					<ScrollArea orientation="vertical" class="max-h-[80dvh]">
						<SubjectsFormFields
							form={updateSubjectsForm}
							bind:formData={$updateFormData}
							delayed={$updateDelayed}
						/>
					</ScrollArea>
				</div>

				<Dialog.Footer>
					<div class="flex w-full justify-center gap-4">
						<Button
							disabled={$updateDelayed}
							type="submit"
							onclick={() => {
								openEdit = false;
							}}>Запази</Button
						>

						<Button
							disabled={$updateDelayed}
							onclick={() => {
								openEdit = false;
							}}
							variant="outline"
						>
							Отказ
						</Button>
					</div>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
