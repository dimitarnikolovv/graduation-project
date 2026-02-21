<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form';
	import { forgotPasswordSchema } from './schema';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { ActionData, PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const loginForm = superForm(data.loginForm, {
		validators: zod4Client(forgotPasswordSchema),
		resetForm: false
	});

	const { form: formData, enhance: resetEnhance, delayed } = loginForm;

	$effect(() => {
		if (form?.sendVerificationLinkError)
			toast.error('Нещо се обърка при изпращането на новата връзка.');
	});

	$effect(() => {
		if (form?.emailNotFound) toast.error('Този имейл не се използва.');
	});
</script>

{#if form?.sendVerificationLink}
	<Alert.Root class="m-4 mx-auto w-auto max-w-3xl border-green-500 bg-green-50 text-green-800">
		<CircleCheck class="size-4 stroke-green-700" />

		<Alert.Title>Моля проверете имейла си.</Alert.Title>
		<Alert.Description class="">
			<div>Изпратихме връзка за смяна на паролата ви на посочения имейл адрес.</div>
		</Alert.Description>
	</Alert.Root>
{:else}
	<div class="grid h-[70dvh] place-items-center">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div class="grid gap-6">
				<form
					method="POST"
					action="?/resetPassword"
					use:resetEnhance
					class="grid place-items-center gap-4"
				>
					<Card.Root class="border-site-primary w-full max-w-sm">
						<Card.Header>
							<Card.Title class="text-2xl">
								<h1 class="text-2xl font-semibold tracking-tight">Забравена парола</h1>
							</Card.Title>

							<Card.Description class="text-muted-foreground text-sm">
								Въведете имейла, който сте използвали за регистрация. Ще изпратим имейл с инструкции
								за възстановяване на паролата ви.
							</Card.Description>
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
						</Card.Content>
						<Card.Footer>
							<Form.Button disabled={$delayed} class="btn-site-primary w-full">Изпрати</Form.Button>
						</Card.Footer>
					</Card.Root>
				</form>
			</div>
		</div>
	</div>
{/if}
