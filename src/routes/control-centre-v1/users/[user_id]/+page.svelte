<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { setContext } from 'svelte';
	import UpdateUserForm from './update-user-form.svelte';
	import DeactivateUserForm from './deactivate-user-form.svelte';
	import DeleteUserForm from './delete-user-form.svelte';
	import ActivateUserForm from './activate-user-form.svelte';
	import { DateFormatter } from '@internationalized/date';
	import UserInformationCard from './user-information-card.svelte';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';

	let { data, form } = $props();

	setContext('deleteUserForm', data.deleteUserForm);
	setContext('deactivateUserForm', data.deactivateUserForm);
	setContext('activateUserForm', data.activateUserForm);

	const df = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	const hasPermission = checkIfUserHasPermission(
		data.userPermissions,
		UserPermissionsEnum.EditUsers
	);

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

{#if data.foundUser.deletedAt}
	<div
		class="border-destructive text-destructive flex items-center justify-between gap-3 rounded-md border p-4"
	>
		<div>
			Този профил е деактивиран на <span class="font-semibold">
				{df.format(data.foundUser.deletedAt)}</span
			>.
		</div>

		{#if hasPermission}
			<ActivateUserForm user={data.foundUser} />
		{/if}
	</div>
{/if}

<UserInformationCard user={data.foundUser} />

<UpdateUserForm
	form={data.updateUserForm}
	user={data.foundUser}
	userPermissions={data.userPermissions}
/>

{#if hasPermission}
	<div class="border-destructive rounded-xl border p-4">
		<h3 class="text-destructive mb-6 font-bold">Опасна зона</h3>

		<div class="flex flex-col gap-3">
			{#if !data.foundUser.deletedAt}
				<DeactivateUserForm user={data.foundUser} />
			{/if}

			<DeleteUserForm user={data.foundUser} />
		</div>
	</div>
{/if}
