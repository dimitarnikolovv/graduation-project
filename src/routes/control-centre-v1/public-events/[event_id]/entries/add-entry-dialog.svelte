<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { addEntrySchema, type AddEntrySchema } from './schema';

	type Props = {
		data: SuperValidated<AddEntrySchema>;
	};

	const { data }: Props = $props();

	let open = $state(false);

	const addEntryForm = superForm(data, {
		resetForm: true,
		validators: zod4Client(addEntrySchema),
		dataType: 'json',
		onUpdated: ({ form }) => {
			if (form.valid) {
				open = false;
			}
		}
	});

	const { form: formData, delayed, enhance } = addEntryForm;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button size="sm">
			<UserPlus class="mr-2 h-4 w-4" />
			Добави участник
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-106.25">
		<Dialog.Header>
			<Dialog.Title class="text-center leading-6">Добавяне на участник</Dialog.Title>
			<Dialog.Description class="text-center">
				Въведете имейл адреса на участника, който искате да запишете за това събитие.
				<br />
				<strong>Ако събитието има линк за участие, участникът ще получи имейл с него.</strong>
			</Dialog.Description>
		</Dialog.Header>

		<form action="?/addEntry" method="POST" use:enhance>
			<div class="grid gap-4">
				<ScrollArea orientation="vertical" class="max-h-[70dvh]">
					<Form.Field form={addEntryForm} name="atendeeEmail" class="px-1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Имейл адрес</Form.Label>
								<Input
									{...props}
									disabled={$delayed}
									bind:value={$formData.atendeeEmail}
									type="email"
									placeholder="example@example.com"
									autocomplete="off"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={addEntryForm} name="atendeeName" class="px-1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Име на участника</Form.Label>
								<Input
									{...props}
									disabled={$delayed}
									bind:value={$formData.atendeeName}
									type="text"
									placeholder="Име на участника"
									autocomplete="off"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</ScrollArea>
			</div>

			<Dialog.Footer>
				<div class="flex w-full justify-center gap-4">
					<Button type="submit" disabled={$delayed}>Добави</Button>
					<Button
						type="button"
						onclick={() => {
							open = false;
						}}
						disabled={$delayed}
						variant="outline"
					>
						Отказ
					</Button>
				</div>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
