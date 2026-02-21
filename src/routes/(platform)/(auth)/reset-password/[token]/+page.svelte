<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form';
	import { resetPasswordSchema } from './schema';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import TogglePassword from '$lib/components/TogglePassword.svelte';
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const resetPasswordForm = superForm(data.resetPasswordForm, {
		validators: zod4Client(resetPasswordSchema),
		dataType: 'json',
		resetForm: false
	});

	const { form: formData, enhance: resetEnhance, delayed } = resetPasswordForm;

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
	{#if !data.invalidToken}
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-137.5">
			<div class="grid gap-6">
				<form
					method="POST"
					action="?/resetPassword"
					use:resetEnhance
					class="grid place-items-center gap-4"
				>
					<Card.Root class="border-site-primary w-full max-w-md">
						<Card.Header>
							<Card.Title class="text-2xl">
								<h1 class="text-2xl font-semibold tracking-tight">Смяна на парола</h1>
							</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-4">
							<Form.Field form={resetPasswordForm} name="password">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>
											Нова парола
											<span class="text-destructive text-base">*</span>
										</Form.Label>

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

							<Form.Field form={resetPasswordForm} name="passwordConfirm">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>
											Потвърдете новата парола <span class="text-destructive text-base">*</span>
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
						</Card.Content>
						<Card.Footer>
							<Form.Button disabled={$delayed} class="btn-site-primary w-full">Запази</Form.Button>
						</Card.Footer>
					</Card.Root>
				</form>
			</div>
		</div>
	{:else}
		<div class="border-l-4 border-yellow-400 bg-yellow-50 p-4">
			<div class="flex">
				<div class="shrink-0">
					<svg
						class="size-5 text-yellow-400"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
						data-slot="icon"
					>
						<path
							fill-rule="evenodd"
							d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-yellow-700">
						Тази връзка е невалидна или изтекла. Моля, поискайте нова връзка за смяна на паролата от
						<a
							href="/forgot-password"
							class="font-medium text-yellow-700 underline hover:text-yellow-600">тук</a
						>.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
