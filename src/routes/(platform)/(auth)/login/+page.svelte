<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form';
	import { loginSchema } from './schema';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import TogglePassword from '$lib/components/TogglePassword.svelte';
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const loginForm = superForm(data.loginForm, {
		validators: zod4Client(loginSchema),
		resetForm: false
	});

	const { form: formData, enhance: loginEnhance, delayed } = loginForm;

	let toggled: boolean = $state(false);

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}
	});
</script>

<div class="grid h-[70dvh] place-items-center">
	<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
		<div class="grid gap-6">
			<form method="POST" action="?/login" use:loginEnhance class="grid place-items-center gap-4">
				<Card.Root class="border-site-primary w-full max-w-sm">
					<Card.Header>
						<Card.Title class="text-2xl">
							<h1 class="text-2xl font-semibold tracking-tight">Вход в BRAAND</h1>
						</Card.Title>
					</Card.Header>
					<Card.Content class="grid gap-4">
						<Form.Field form={loginForm} name="email">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Имейл</Form.Label>
									<Input
										{...props}
										disabled={$delayed}
										bind:value={$formData.email}
										type="email"
										class="placeholder:text-muted-foreground"
										placeholder="m@example.com"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={loginForm} name="password">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Парола</Form.Label>

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

						<div class="text-right text-sm">
							<a href="/forgot-password" class="underline"> Забравена парола </a>
						</div>
					</Card.Content>
					<Card.Footer>
						<Form.Button disabled={$delayed} class="w-full">Вход</Form.Button>
					</Card.Footer>
				</Card.Root>
			</form>
			<div class="mt-4 text-center text-sm">
				Нямаш профил?
				<a href="/register" class="underline"> Регистрация </a>
			</div>
		</div>

		<p class="text-muted-foreground px-8 text-center text-xs sm:text-sm">
			С вход в платформта се съгласявате с нашите
			<a href="/legal" class="hover:text-primary underline underline-offset-4">
				Условия за ползване
			</a>
			и
			<a href="/legal" class="hover:text-primary underline underline-offset-4">
				Политика за поверителност
			</a>.
		</p>
	</div>
</div>
