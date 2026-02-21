<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form';
	import { registerUserSchema } from './schema';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import TogglePassword from '$lib/components/TogglePassword.svelte';
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { toast } from 'svelte-sonner';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const registerForm = superForm(data.registerForm, {
		validators: zod4Client(registerUserSchema),
		resetForm: false
	});

	const { form: formData, enhance: registerEnhance, delayed } = registerForm;

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

<div class="grid h-[70dvh] place-items-center">
	<div class="mx-auto w-full space-y-6 sm:w-137.5">
		<form
			method="POST"
			action="?/register"
			use:registerEnhance
			class="grid place-items-center gap-4"
		>
			<Card.Root class="border-site-primary w-full max-w-md">
				<Card.Header>
					<Card.Title class="text-2xl">
						<h1 class="text-2xl font-semibold tracking-tight">Регистрация в BRAAND</h1>
					</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4">
					<div class="grid grid-cols-2 gap-2">
						<Form.Field form={registerForm} name="firstName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Име <span class="text-destructive text-base">*</span></Form.Label>
									<Input
										{...props}
										disabled={$delayed}
										bind:value={$formData.firstName}
										type="text"
										required
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={registerForm} name="lastName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										Фамилия <span class="text-destructive text-base">*</span></Form.Label
									>
									<Input
										{...props}
										disabled={$delayed}
										bind:value={$formData.lastName}
										type="text"
										required
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<Form.Field form={registerForm} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Имейл <span class="text-destructive text-base">*</span></Form.Label>
								<Input
									{...props}
									disabled={$delayed}
									bind:value={$formData.email}
									type="email"
									placeholder="m@example.com"
									required
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={registerForm} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Парола <span class="text-destructive text-base">*</span></Form.Label>

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

					<Form.Field form={registerForm} name="passwordConfirm">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Потвърдете паролата <span class="text-destructive text-base">*</span>
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

					<Form.Field form={registerForm} name="privacy">
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center gap-3">
									<Checkbox {...props} bind:checked={$formData.privacy} required />
									<Form.Label class="text-xs">
										<p class="text-muted-foreground">
											С регистрация в платформата се съгласявате с нашите
											<a href="/legal" class="hover:text-primary underline underline-offset-4">
												Условия за ползване
											</a>
											и
											<a href="/legal" class="hover:text-primary underline underline-offset-4">
												Политика за поверителност
											</a>.
										</p>
									</Form.Label>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</Card.Content>
				<Card.Footer>
					<Form.Button disabled={$delayed} class="btn-site-primary w-full">Регистрация</Form.Button>
				</Card.Footer>
			</Card.Root>
		</form>
		<div class="my-4 text-center text-sm">
			Имаш профил?
			<a href="/login" class="underline"> Вход </a>
		</div>
	</div>
</div>
