<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { PermissionsObject } from '$lib/types/permissions';
	import type { ClassGrade } from '$lib/server/db/schema/subjects';
	import { updateClassGradeSchema, type UpdateClassGradeSchema } from './schema';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { slugify } from '$lib/utils/general';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { deleteClassGradeRemote } from './class-grades.remote';
	import { invalidateAll } from '$app/navigation';
	import { isHttpError } from '@sveltejs/kit';

	type Props = {
		classGrade: ClassGrade;
		userPermissions?: PermissionsObject;
	};
	let { classGrade, userPermissions }: Props = $props();

	const updateClassGradeForm = getContext(
		'updateClassGradeForm'
	) as SuperValidated<UpdateClassGradeSchema>;

	const updateClassGradesForm = superForm(updateClassGradeForm, {
		validators: zod4Client(updateClassGradeSchema),
		resetForm: false,
		id: `updateClassGradeForm-${classGrade.id}`,
		dataType: 'json'
	});

	const {
		form: updateFormData,
		enhance: updateEnhance,
		delayed: updateDelayed
	} = updateClassGradesForm;

	$updateFormData.name = classGrade.name;
	$updateFormData.slug = classGrade.slug;
	$updateFormData.gradeNumber = classGrade.gradeNumber;

	$updateFormData.id = classGrade.id;

	let openDelete = $state(false);
	let openEdit = $state(false);
	let disabled = $state(false);

	async function deleteCurrentClassGrade() {
		disabled = true;

		try {
			await deleteClassGradeRemote({
				id: classGrade.id
			});

			toast.success('Класът беше изтрит успешно.');
			await invalidateAll();
		} catch (err) {
			console.error(err);

			if (isHttpError(err, 409) && err.body.message) {
				toast.error(err.body.message);
				return;
			}
			toast.error('Възникна грешка при изтриването на класа.');
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
					navigator.clipboard.writeText(classGrade.id.toString());
					toast.success('ID-то е копирано в клипборда.');
				}}
				class="cursor-pointer"
			>
				<ClipboardCopy class="max-w-5"></ClipboardCopy>
				<span> Копирай ID </span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditClassGrades)}
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

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteClassGrades)}
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

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteClassGrades)}
	<Dialog.Root bind:open={openDelete}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
				<Dialog.Description class="text-center">
					Сигурни ли сте че искате да изтриете предмет: <br />
					<span class="font-mono font-bold">{classGrade.name}</span>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<Button onclick={deleteCurrentClassGrade} variant="destructive" {disabled}>Изтрий</Button>

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

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditClassGrades)}
	<Dialog.Root bind:open={openEdit}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Редактиране</Dialog.Title>
			</Dialog.Header>

			<form action="?/updateClassGrade" method="POST" use:updateEnhance>
				<div class="grid gap-2">
					<ScrollArea orientation="vertical" class="max-h-[80dvh]">
						<Form.Field form={updateClassGradesForm} name="name" class="px-1">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Наименование</Form.Label>
									<Input
										{...props}
										disabled={$updateDelayed}
										bind:value={$updateFormData.name}
										oninput={() => {
											$updateFormData.slug = slugify($updateFormData.name);
										}}
										type="text"
										placeholder=""
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={updateClassGradesForm} name="gradeNumber" class="px-1">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>С цифри</Form.Label>
									<Input
										{...props}
										disabled={$updateDelayed}
										bind:value={$updateFormData.gradeNumber}
										type="number"
										step="1"
										min="1"
										placeholder="напр. 10"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={updateClassGradesForm} name="slug" class="px-1">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>URL slug</Form.Label>
									<Input
										{...props}
										disabled={$updateDelayed}
										bind:value={$updateFormData.slug}
										type="text"
										placeholder=""
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
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
