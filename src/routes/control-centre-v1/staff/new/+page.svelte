<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { SuperForm } from 'sveltekit-superforms';
	import Button from '$lib/components/ui/button/button.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import * as Form from '$lib/components/ui/form/index';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input/index';
	import TogglePassword from '$lib/components/TogglePassword.svelte';
	import { generateRandomPassword } from '$lib/utils/auth.js';
	import { UserPermissionsEnum } from '$lib/types/enums.js';
	import { registerAdminSchema } from '../schema';
	import StaffFormGeneralFormFields from '../StaffFormGeneralFormFields.svelte';

	let { data, form } = $props();

	const registerAdminForm = superForm(data.registerAdminForm, {
		validators: zod4Client(registerAdminSchema),
		dataType: 'json',
		resetForm: false
	});

	const { form: formData, enhance: registerEnhance, delayed } = registerAdminForm;

	type GeneralFormData = Omit<typeof $formData, 'password' | 'passwordConfirm'>;
	const generalForm = registerAdminForm as unknown as SuperForm<GeneralFormData>;

	const generatedPassword = generateRandomPassword(30);

	$formData.password = generatedPassword;
	$formData.passwordConfirm = generatedPassword;

	Object.values(UserPermissionsEnum).forEach((permission) => {
		$formData.permissions[permission] = false;
	});

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

<form method="POST" action="?/register" use:registerEnhance>
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
				<h1 class="text-lg font-semibold md:text-2xl">Нов администратор</h1>
				<span class="text-muted-foreground text-sm">
					След успешната регистрация, новият администратор ще получи имейл на посочения адрес с
					данните си за вход в системата.
				</span>
			</div>
		</div>
	</div>

	<div class="mt-6 grid gap-4">
		<StaffFormGeneralFormFields form={generalForm} bind:formData={$formData} delayed={$delayed}>
			{#snippet passwordFields()}
				<Form.Field form={registerAdminForm} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								Парола
								<span class="text-destructive text-sm">*</span></Form.Label
							>

							<div class="relative">
								<Input
									{...props}
									disabled={$delayed}
									bind:value={$formData.password}
									type={toggled ? 'text' : 'password'}
									required
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

				<Form.Field form={registerAdminForm} name="passwordConfirm">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								Потвърди паролата <span class="text-destructive text-sm">*</span>
							</Form.Label>

							<div class="relative">
								<Input
									{...props}
									disabled={$delayed}
									bind:value={$formData.passwordConfirm}
									type={toggled ? 'text' : 'password'}
									required
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

		<Form.Button disabled={$delayed} class="w-full">Регистрация</Form.Button>
	</div>
</form>
