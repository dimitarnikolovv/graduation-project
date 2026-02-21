<script lang="ts">
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
	import type { CreatePublicEventSchema, UpdatePublicEventSchema } from './schema';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Upload from '@lucide/svelte/icons/upload';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import { Button } from '$lib/components/ui/button/index.js';
	import { bytesToHumanReadable } from '$lib/utils/videos.js';
	import Dropzone from '$lib/components/ui-extras/dropzone';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { DateFormatter, getLocalTimeZone, CalendarDate } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { displayEventAttributeDataType, EventAttributeDataType } from '$lib/types/enums';

	import AttributeValueField from './AttributeValueField.svelte';
	import { TipTap } from '$lib/components/tiptap';
	import { PUBLIC_HOST } from '$env/static/public';

	type Props = {
		form: SuperForm<CreatePublicEventSchema | UpdatePublicEventSchema>;
		formData: SuperValidated<CreatePublicEventSchema | UpdatePublicEventSchema>['data'];
		delayed: boolean;
	};

	let { form, formData = $bindable(), delayed }: Props = $props();

	const df = new DateFormatter('bg', {
		dateStyle: 'long'
	});

	const dfTime = new DateFormatter('bg', {
		timeStyle: 'short',
		hour12: false
	});

	let open = $state(false);

	// Convert Date to CalendarDate for the calendar component
	let dateValue = $derived(
		formData.date
			? new CalendarDate(
					formData.date.getFullYear(),
					formData.date.getMonth() + 1,
					formData.date.getDate()
				)
			: undefined
	);

	// Generate hours (00-23) and minutes (00, 10, 20, 30, 40, 50)
	const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
	const minutes = ['00', '10', '20', '30', '40', '50'];

	// Extract hour and minute from the date
	let selectedHour = $derived(
		formData.date ? String(formData.date.getHours()).padStart(2, '0') : '09'
	);
	let selectedMinute = $derived(
		formData.date ? String(formData.date.getMinutes()).padStart(2, '0') : '00'
	);

	const showImagePreviewOnDrop = async (event: CustomEvent) => {
		const { acceptedFiles } = event.detail;

		const file: File = acceptedFiles[0];

		if (file) {
			formData.posterFile = file;
		}
	};

	function updateDateTime(date: Date | undefined, hour: string, minute: string) {
		if (date) {
			date.setHours(parseInt(hour), parseInt(minute), 0, 0);
			formData.date = date;
		}
	}

	function addAttribute() {
		formData.attributes = [
			...formData.attributes,
			{
				name: '',
				value: '',
				dataType: EventAttributeDataType.text,
				displayOrder: formData.attributes ? formData.attributes.length + 1 : 1
			}
		];
	}

	function removeAttribute(attributeIndex: number) {
		if (attributeIndex < 0 || attributeIndex >= formData.attributes.length) return;

		formData.attributes = formData.attributes.slice(0, attributeIndex).concat(
			formData.attributes
				.slice(attributeIndex + 1)
				.map((q, idx) => ({ ...q, displayOrder: attributeIndex + 1 + idx })) // Reorder remaining attributes
		);
	}
</script>

<div class="grid gap-6">
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>
					Име на събитието
					<span class="text-destructive text-sm">*</span>
				</Form.Label>
				<Input
					{...props}
					disabled={delayed}
					bind:value={formData.name}
					type="text"
					placeholder="Напр. Пробен изпит по математика за 7 клас"
					required
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="grid gap-4 sm:gap-6 md:grid-cols-3">
		<Form.Field {form} name="isRedirecting">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						Пренасочване
						<span class="text-destructive text-sm">*</span>
					</Form.Label>
					<Select.Root
						type="single"
						disabled={delayed}
						{...props}
						value={formData.isRedirecting ? 'true' : 'false'}
						allowDeselect={false}
						onValueChange={(v) => (formData.isRedirecting = v === 'true')}
					>
						<Select.Trigger class="w-full" disabled={delayed}>
							{formData.isRedirecting ? 'Да' : 'Не'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="true" label="Да" />
							<Select.Item value="false" label="Не" />
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		{#if formData.isRedirecting}
			<Form.Field {form} name="redirectUrl">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>
							URL за пренасочване
							<span class="text-destructive text-sm">*</span>
						</Form.Label>
						<Input
							{...props}
							disabled={delayed}
							bind:value={formData.redirectUrl}
							type="url"
							placeholder="Напр. {PUBLIC_HOST}/tests/test_id"
							required
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="redirectButtonText">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>
							Текст на бутона за пренасочване
							<span class="text-destructive text-sm">*</span>
						</Form.Label>
						<Input
							{...props}
							disabled={delayed}
							bind:value={formData.redirectButtonText}
							type="text"
							placeholder="Напр. Запиши се"
							required
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		{/if}
	</div>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Описание</Form.Label>
				<TipTap minimal={true} bind:value={formData.description} disabled={delayed}></TipTap>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="price">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label
					>Цена на събитието
					<span class="text-destructive text-sm">*</span>
				</Form.Label>
				<Input
					{...props}
					disabled={delayed}
					bind:value={formData.price}
					type="number"
					required
					step="0.01"
					min="0"
					placeholder="Напр. 19.99"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="date">
		<Label class="px-1"
			>Дата и час на събитието <span class="text-destructive text-sm">*</span></Label
		>
		<Popover.Root bind:open>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						disabled={delayed}
						class={cn('w-full justify-start font-normal', !dateValue && 'text-muted-foreground')}
					>
						<CalendarIcon class="me-2 size-4" />
						{#if formData.date}
							{df.format(formData.date)} в {dfTime.format(formData.date)}
						{:else}
							Изберете дата и час
						{/if}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0" align="start">
				<div class="flex flex-col">
					<Calendar
						type="single"
						value={dateValue}
						locale="bg"
						onValueChange={(v) => {
							if (v) {
								updateDateTime(v.toDate(getLocalTimeZone()), selectedHour, selectedMinute);
							}
						}}
					/>
					<div class="border-t p-3">
						<div class="flex items-center gap-2">
							<Label class="text-sm font-medium">Час:</Label>
							<Select.Root
								type="single"
								value={selectedHour}
								onValueChange={(v) => {
									if (v && dateValue) {
										updateDateTime(dateValue.toDate(getLocalTimeZone()), v, selectedMinute);
									}
								}}
							>
								<Select.Trigger class="w-17.5" disabled={delayed}>
									{selectedHour}
								</Select.Trigger>
								<Select.Content>
									{#each hours as hour (hour)}
										<Select.Item value={hour}>{hour}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<span class="text-sm">:</span>
							<Select.Root
								type="single"
								value={selectedMinute}
								onValueChange={(v) => {
									if (v && dateValue) {
										updateDateTime(dateValue.toDate(getLocalTimeZone()), selectedHour, v);
									}
								}}
							>
								<Select.Trigger class="w-17.5" disabled={delayed}>
									{selectedMinute}
								</Select.Trigger>
								<Select.Content>
									{#each minutes as minute (minute)}
										<Select.Item value={minute}>{minute}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Attributes -->

	<div>
		<h3 class="text-lg font-medium">Атрибути</h3>

		<div class="grid items-end gap-3 sm:gap-6">
			{#each formData.attributes as attribute, i (i)}
				<div>
					<div
						class="bg-accent ignore-main-margin sticky top-11 z-10 my-2 border-y border-dashed py-1.5"
					>
						<div class="flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-lg font-medium">
								<ArrowDown class="size-4" /> Атрибут {i + 1}
							</h3>

							<Button
								variant="destructive"
								size="icon"
								disabled={delayed}
								onclick={() => {
									removeAttribute(i);
								}}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div class="grid sm:grid-cols-2 gap-2 sm:gap-6">
						<Form.Field {form} name="attributes[{i}].name">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										Име на атрибута <span class="text-destructive text-sm">*</span>
									</Form.Label>
									<Input
										{...props}
										disabled={delayed}
										bind:value={formData.attributes[i].name}
										type="text"
										placeholder="Напр. Локация"
										required
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="attributes[{i}].dataType">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										Тип на атрибута
										<span class="text-destructive text-sm">*</span>
									</Form.Label>
									<Select.Root
										type="single"
										disabled={delayed}
										{...props}
										allowDeselect={false}
										bind:value={formData.attributes[i].dataType}
										onValueChange={(v) => {
											formData.attributes[i].value = '';
										}}
									>
										<Select.Trigger class="w-full" disabled={delayed}>
											{displayEventAttributeDataType(formData.attributes[i].dataType)}
										</Select.Trigger>
										<Select.Content>
											{#each Object.values(EventAttributeDataType) as dt}
												<Select.Item value={dt} label={displayEventAttributeDataType(dt)} />
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<div class="grid grid-cols-2 gap-2 sm:gap-6">
						<Form.Field {form} name="attributes[{i}].displayOrder">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										Стойност на атрибута <span class="text-destructive text-sm">*</span>
									</Form.Label>

									<AttributeValueField
										{...props}
										bind:attributeValue={formData.attributes[i].value}
										dataType={formData.attributes[i].dataType}
										disabled={delayed}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="attributes[{i}].displayOrder">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										Пореден ред <span class="text-destructive text-sm">*</span>
									</Form.Label>
									<Input
										{...props}
										disabled={delayed}
										bind:value={formData.attributes[i].displayOrder}
										type="number"
										min="0"
										step="1"
										required
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</div>
			{/each}
		</div>

		<Button class="mt-4 w-full" onclick={addAttribute} disabled={delayed}>
			<CirclePlus class="h-3.5 w-3.5" />
			Добави атрибут
		</Button>
	</div>

	<!-- Poster -->

	<Form.Field {form} name="posterFile">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Постер на събитието</Form.Label>
				<div class="space-y-4">
					<Dropzone
						on:click={showImagePreviewOnDrop}
						on:drop={showImagePreviewOnDrop}
						type="file"
						disabled={delayed}
						multiple={false}
						accept="image/jpeg,image/png"
						class="mb-0! aspect-auto! min-h-72"
					>
						{#if !formData.posterFile}
							<div class="pointer-events-none flex flex-col items-center gap-1">
								<Upload class="text-muted-foreground pointer-events-none h-5 w-5" />
								<span>Качи постер (.JPEG, .JPG, .PNG)</span>
							</div>
						{/if}

						{#if formData.posterFile}
							<div class="bg-card z-30 flex flex-col justify-between rounded-md border">
								<div class="flex justify-between gap-2 border-b px-3 py-2">
									<div
										class="max-w-55 overflow-hidden text-xs text-nowrap text-ellipsis whitespace-nowrap"
									>
										{formData.posterFile.name}
									</div>
									<div class="text-xs">
										<span class="font-bold">
											{bytesToHumanReadable(formData.posterFile.size)}
										</span>
									</div>
								</div>
								<div class="relative my-auto flex items-center justify-center p-1 py-2">
									<img
										src={URL.createObjectURL(formData.posterFile)}
										alt="Постер"
										class="max-h-64 max-w-[16rem] rounded-sm object-contain"
									/>
									<Button
										class="absolute top-1 right-1 rounded-full max-sm:max-h-8 max-sm:max-w-8"
										size="icon"
										variant="destructive"
										onclick={() => {
											formData.posterFile = undefined;
										}}
									>
										<Trash2 />
									</Button>
								</div>
							</div>
						{/if}
					</Dropzone>
					<p class="text-muted-foreground text-xs">
						Поддържани формати: JPEG, JPG, PNG. Максимален размер: 5MB
					</p>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
</div>
