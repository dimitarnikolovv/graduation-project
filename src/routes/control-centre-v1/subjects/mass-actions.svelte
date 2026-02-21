<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import type { Subject } from '$lib/server/db/schema/subjects';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { massDeleteSubjectsRemote } from './subjects.remote';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		checked: number[];
		subjects: Subject[];
		userPermissions?: PermissionsObject;
	};

	let { checked, subjects, userPermissions }: Props = $props();

	let openDelete = $state(false);
	let disabled = $state(false);

	async function deleteSelectedSubjects() {
		disabled = true;

		try {
			await massDeleteSubjectsRemote({
				ids: checked
			});

			toast.success('Предметите бяха изтрити успешно.');
			await invalidateAll();
		} catch (error) {
			console.error(error);
			toast.error('Възникна грешка при изтриването на предметите.');
		} finally {
			disabled = false;
			openDelete = false;
		}
	}
</script>

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteSubjects)}
	<Button
		variant="destructive"
		class="cursor-pointer"
		size="sm"
		disabled={checked.length === 0 || disabled}
		onclick={() => {
			if (checked.length > 0) openDelete = true;
		}}
	>
		<Trash2 class="mr-2 ml-0 max-w-5"></Trash2>
		Изтрий</Button
	>

	<Dialog.Root bind:open={openDelete}>
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
				<Dialog.Description class="text-center">
					Сигурни ли сте че искате да изтриете следните предмети:
					<ScrollArea orientation="vertical" class="bg-muted mt-2 h-[52dvh] rounded-md p-1.5">
						<ol class="flex min-w-0 flex-col items-start gap-1 text-left font-mono font-bold">
							{#each subjects.filter((opt) => checked.includes(opt.id)) as subject, i}
								<li>{i + 1}. {subject.name}</li>
							{/each}
						</ol>
					</ScrollArea>
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<Button type="submit" onclick={deleteSelectedSubjects} {disabled} variant="destructive"
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
