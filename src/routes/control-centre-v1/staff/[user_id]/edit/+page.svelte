<script lang="ts">
	import { superForm, type SuperForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/button/button.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import * as Form from '$lib/components/ui/form/index';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input/index';
	import TogglePassword from '$lib/components/TogglePassword.svelte';
	import { updateAdminSchema } from '../../schema';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import StaffFormGeneralFormFields from '../../StaffFormGeneralFormFields.svelte';

	let { data, form } = $props();

	const updateAdminForm = superForm(data.updateAdminForm, {
		validators: zod4Client(updateAdminSchema),
		dataType: 'json',
		resetForm: false
	});

	type GeneralFormData = Omit<typeof $formData, 'password' | 'passwordConfirm'>;
	const generalForm = updateAdminForm as unknown as SuperForm<GeneralFormData>;

	const { form: formData, enhance, delayed } = updateAdminForm;

	if (data.foundPermissions.permissions) {
		$formData.permissions = data.foundPermissions.permissions;
	} else {
		Object.values(UserPermissionsEnum).forEach((permission) => {
			$formData.permissions[permission] = false;
		});
	}

	$formData.email = data.foundUser.email;
	$formData.firstName = data.foundUser.firstName;
	$formData.lastName = data.foundUser.lastName;

	let toggled: boolean = $state(false);

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

<form method="POST" action="?/updateAdmin" use:enhance>
	<div
		class="bg-background ignore-main-margin sticky top-0 z-50 flex justify-between gap-4 py-1.5 max-sm:flex-col sm:items-center"
	>
		<div class="flex items-center justify-between gap-4">
			<Button
				variant="outline"
				size="icon"
				class="h-7 w-7 shrink-0 self-start"
				href="/control-centre-v1/staff"
			>
				<ChevronLeft class="h-4 w-4" />
				<span class="sr-only">Назад</span>
			</Button>
			<div class="flex flex-col gap-2">
				<h1 class="text-lg font-semibold md:text-2xl">Редактиране на администратор</h1>
				<span class="text-muted-foreground text-sm">
					След успешно редактиране, администраторът ще получи имейл на посочения адрес с данните си
					за вход в системата.
				</span>
			</div>
		</div>
	</div>

	<div class="mt-4 grid gap-4">
		<StaffFormGeneralFormFields form={generalForm} bind:formData={$formData} delayed={$delayed}>
			{#snippet passwordFields()}
				<Form.Field form={updateAdminForm} name="newPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Нова парола</Form.Label>

							<div class="relative">
								<Input
									{...props}
									disabled={$delayed}
									bind:value={$formData.newPassword}
									type={toggled ? 'text' : 'password'}
								/>

								<button
									onclick={() => {
										toggled = !toggled;
									}}
									type="button"
									disabled={$delayed}
									form="_!"
									class="text-muted-foreground absolute top-1.5 right-2 hover:cursor-pointer"
								>
									<TogglePassword {toggled} />
								</button>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={updateAdminForm} name="newPasswordConfirm">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Потвърдете новата парола</Form.Label>

							<div class="relative">
								<Input
									{...props}
									disabled={$delayed}
									bind:value={$formData.newPasswordConfirm}
									type={toggled ? 'text' : 'password'}
								/>

								<button
									onclick={() => {
										toggled = !toggled;
									}}
									type="button"
									disabled={$delayed}
									form="_!"
									class="text-muted-foreground absolute top-1.5 right-2 hover:cursor-pointer"
								>
									<TogglePassword {toggled} />
								</button>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/snippet}
		</StaffFormGeneralFormFields>

		<Form.Button disabled={$delayed} class="w-full">Запази</Form.Button>
	</div>
</form>
