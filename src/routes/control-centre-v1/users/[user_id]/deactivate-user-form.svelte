<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { deactivateUserSchema, type DeactivateUserSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { getContext } from 'svelte';
	import type { User } from '$lib/server/db/schema/auth';

	type Props = {
		user: Omit<User, 'passwordHash'>;
	};

	let { user }: Props = $props();

	const deactivateUserFormData = getContext(
		'deactivateUserForm'
	) as SuperValidated<DeactivateUserSchema>;

	const deactivateUserForm = superForm(deactivateUserFormData, {
		validators: zod4Client(deactivateUserSchema),
		dataType: 'json',
		resetForm: false,
		id: `deactivateUserForm-${user.id}`
	});

	const {
		form: deactivateFormData,
		enhance: deactivateEnhance,
		delayed: deactivateDelayed
	} = deactivateUserForm;

	$deactivateFormData.userId = user.id;

	let isOpen = $state(false);
</script>

<Button
	variant="destructive"
	onclick={() => {
		isOpen = true;
	}}
>
	Деактивирай профила
</Button>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="text-center leading-6">Внимание!</Dialog.Title>
			<Dialog.Description class="text-foreground text-center">
				Сигурни ли сте, че искате да деактивирате профила на:
				<span class="font-mono font-bold"> <br /> {user.firstName} {user.lastName}</span>
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<div class="flex w-full justify-center gap-4">
				<form
					action="/control-centre-v1/users/{user.id}?/deactivateUser"
					method="POST"
					use:deactivateEnhance
				>
					<Button
						type="submit"
						onclick={() => {
							isOpen = false;
						}}
						disabled={$deactivateDelayed}
						variant="destructive">Деактивирай</Button
					>
				</form>
				<Button
					variant="outline"
					disabled={$deactivateDelayed}
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
