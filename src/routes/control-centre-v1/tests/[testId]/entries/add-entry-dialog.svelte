<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Command from '$lib/components/ui/command/index';
	import { cn } from '$lib/utils';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Check from '@lucide/svelte/icons/check';

	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { addEntrySchema, type AddEntrySchema } from './schema';
	import { displayPaymentMethod, PaymentMethodEnum } from '$lib/types/enums';
	import { searchForUserRemote } from '$lib/remote-functions/users.remote';

	type Props = {
		data: SuperValidated<AddEntrySchema>;
		testId: string;
	};

	const { data, testId }: Props = $props();

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

	let searchedUserTerm = $state('');
	let selectedUserName = $state('');
	let openUserSearch = $state(false);
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
				Въведете имейл адреса на участника, който искате да запишете за този тест.
				<br />
				<strong>Участникът ще получи имейл с потвърждение.</strong>
			</Dialog.Description>
		</Dialog.Header>

		<form action="/control-centre-v1/tests/{testId}/entries?/addEntry" method="POST" use:enhance>
			<div class="grid gap-4">
				<ScrollArea orientation="vertical" class="max-h-[70dvh]">
					<Form.Field form={addEntryForm} name="userId" class="px-1">
						<Form.Control>
							{#snippet children({ props })}
								<Popover.Root bind:open={openUserSearch}>
									<Popover.Trigger
										disabled={$delayed}
										class={cn(
											buttonVariants({ variant: 'outline' }),
											'min-w-0 w-full justify-between'
										)}
										role="combobox"
									>
										<div class="flex gap-1 text-ellipsis overflow-hidden">
											{selectedUserName || 'Избери потребител'}
										</div>

										<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Popover.Trigger>

									<Popover.Content class=" p-0" {...props}>
										<Command.Root>
											<Command.Input
												disabled={$delayed}
												bind:value={searchedUserTerm}
												autofocus
												placeholder="Търсете..."
												class="h-9"
											/>
											<Command.Empty>Не е намерен потребител</Command.Empty>
											<Command.Group>
												<ScrollArea class="h-75">
													{#await searchForUserRemote({ searchTerm: searchedUserTerm })}
														<div class="text-center py-4">Зареждане...</div>
													{:then results}
														{#each results.results as user (user.id)}
															<Command.Item
																value="{user.firstName} {user.lastName} {user.email} - {user.id}"
																disabled={$delayed}
																onSelect={() => {
																	$formData.userId = user.id;

																	selectedUserName = `${user.firstName} ${user.lastName}`;

																	openUserSearch = false;
																}}
															>
																<div>
																	{user.firstName}
																	{user.lastName}

																	<div class="mt-1 flex gap-1 text-xs text-muted-foreground">
																		{user.email}
																	</div>
																</div>
																<Check
																	class={cn(
																		'ml-auto h-4 w-4',
																		!($formData.userId === user.id) && 'text-transparent'
																	)}
																/>
															</Command.Item>
														{/each}
													{/await}
												</ScrollArea>
											</Command.Group>
										</Command.Root>
									</Popover.Content>
								</Popover.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={addEntryForm} name="paymentMethod" class="px-1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Метод на плащане</Form.Label>
								<Select.Root
									type="single"
									{...props}
									bind:value={$formData.paymentMethod}
									disabled={$delayed}
								>
									<Select.Trigger class="w-full" disabled={$delayed}>
										{$formData.paymentMethod
											? displayPaymentMethod($formData.paymentMethod)
											: 'Изберете метод на плащане'}
									</Select.Trigger>
									<Select.Content>
										{#each Object.values(PaymentMethodEnum) as method}
											<Select.Item value={method} disabled={$delayed}>
												{displayPaymentMethod(method)}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
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
