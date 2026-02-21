<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { deleteUserSchema, type DeleteUserSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { getContext } from 'svelte';
	import type { User } from '$lib/server/db/schema/auth';

	type Props = {
		user: Omit<User, 'passwordHash'>;
	};

	let { user }: Props = $props();

	const deleteUserFormData = getContext('deleteUserForm') as SuperValidated<DeleteUserSchema>;

	const deleteUserForm = superForm(deleteUserFormData, {
		validators: zod4Client(deleteUserSchema),
		dataType: 'json',
		resetForm: false,
		id: `deleteUserForm-${user.id}`
	});

	const { form: deleteFormData, enhance: deleteEnhance, delayed: deleteDelayed } = deleteUserForm;

	$deleteFormData.userId = user.id;

	let isOpen = $state(false);
</script>

<Button
	variant="destructive"
	onclick={() => {
		isOpen = true;
	}}
>
	Изтрий профила
</Button>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
			<Dialog.Description class="text-foreground text-center">
				Сигурни ли сте, че искате да изтриете профила на:
				<span class="font-mono font-bold"> <br /> {user.firstName} {user.lastName}</span>
				<br />
				<span class="text-destructive font-bold"> ТОВА ДЕЙСТВИЕ Е НЕОБРАТИМО! </span>
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<div class="flex w-full justify-center gap-4">
				<form
					action="/control-centre-v1/users/{user.id}?/deleteUser"
					method="POST"
					use:deleteEnhance
				>
					<Button
						type="submit"
						onclick={() => {
							isOpen = false;
						}}
						disabled={$deleteDelayed}
						variant="destructive">Изтрий</Button
					>
				</form>
				<Button
					variant="outline"
					disabled={$deleteDelayed}
					onclick={() => {
						isOpen = false;
					}}
				>
					Отказ
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
