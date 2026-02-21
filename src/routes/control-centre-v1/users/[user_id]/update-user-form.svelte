<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { updateUserSchema, type UpdateUserSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { User } from '$lib/server/db/schema/auth';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';

	type Props = {
		form: SuperValidated<UpdateUserSchema>;
		user: Omit<User, 'passwordHash'>;
		userPermissions?: PermissionsObject;
	};
	let { form, user, userPermissions }: Props = $props();

	const updateUserForm = superForm(form, {
		validators: zod4Client(updateUserSchema),
		dataType: 'json',
		resetForm: false,
		id: `updateUserForm-${user.id}`
	});

	const { form: formData, enhance, delayed } = updateUserForm;

	$formData.id = user.id;
	$formData.firstName = user.firstName;
	$formData.lastName = user.lastName;
	$formData.email = user.email;

	const hasPermission = checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditUsers);
</script>

<form action="?/updateUser" method="POST" class="grid gap-4" use:enhance>
	<Card.Root>
		<Card.Header class="max-sm:px-4">
			<Card.Title class="flex items-center justify-between gap-2"
				>Основна информация

				{#if hasPermission}
					<Form.Button size="sm" type="submit" disabled={$delayed || !hasPermission}
						>Запази</Form.Button
					>
				{/if}
			</Card.Title>
		</Card.Header>

		<Card.Content class="max-sm:px-4">
			<div class="grid grid-cols-2 gap-2">
				<Form.Field form={updateUserForm} name="firstName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label
								>Име
								<span class="text-destructive text-sm">*</span></Form.Label
							>
							<Input
								{...props}
								disabled={$delayed || !hasPermission}
								bind:value={$formData.firstName}
								type="text"
								required
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={updateUserForm} name="lastName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label
								>Фамилия
								<span class="text-destructive text-sm">*</span></Form.Label
							>
							<Input
								{...props}
								disabled={$delayed || !hasPermission}
								bind:value={$formData.lastName}
								type="text"
								required
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field form={updateUserForm} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Имейл <span class="text-destructive text-sm">*</span></Form.Label>
						<Input
							{...props}
							disabled={$delayed || !hasPermission}
							bind:value={$formData.email}
							type="email"
							placeholder="m@example.com"
							required
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</Card.Content>
	</Card.Root>
</form>
