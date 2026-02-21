<script lang="ts">
	import UsersTable from './users-table.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import { setContext } from 'svelte';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	setContext('deleteAdminForm', data.deleteAdminForm);

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

<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex justify-between gap-4 py-1.5 max-sm:flex-col sm:items-center"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Администратори</h1>
	</div>

	{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.EditAdmins)}
		<Button size="sm" href="/control-centre-v1/staff/new" class="flex items-center gap-2 "
			><CirclePlus class="h-5 w-5 max-md:h-4 max-md:w-4" /> Добави администратор</Button
		>
	{/if}
</div>

{#if data.users && data.users.length > 0}
	<div class="">
		{#key data.users}
			<UsersTable users={data.users} userPermissions={data.userPermissions}></UsersTable>
		{/key}
	</div>
{:else}
	<div class="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
		<div class="flex flex-col items-center gap-1 text-center">
			<h3 class="text-2xl font-bold tracking-tight">Няма създадени администратори</h3>

			{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.EditAdmins)}
				<Button href="/control-centre-v1/staff/new" class="mt-4">Създай администратор</Button>
			{/if}
		</div>
	</div>
{/if}
