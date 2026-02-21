<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { EventAttributeDataType } from '$lib/types/enums';
	import type { WithElementRef } from '$lib/utils';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/utils';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { Label } from '$lib/components/ui/label';
	import type { EventAttribute } from '$lib/types/events';

	type Props = WithElementRef<Omit<HTMLInputAttributes, 'type' | 'files'>> & {
		dataType: EventAttributeDataType;
		attributeValue: EventAttribute['value'];
	};

	let {
		ref = $bindable(null),
		attributeValue = $bindable(),
		dataType,
		...restProps
	}: Props = $props();

	let openCalendar = $state(false);

	const df = new DateFormatter('bg', {
		dateStyle: 'long'
	});

	const dfTime = new DateFormatter('bg', {
		timeStyle: 'short',
		hour12: false
	});

	let open = $state(false);

	// Convert Date to CalendarDate for the calendar component
	let dateValue = $derived.by(() => {
		try {
			if (attributeValue && new Date(attributeValue) instanceof Date) {
				const valueDate = new Date(attributeValue);

				return new CalendarDate(
					valueDate.getFullYear(),
					valueDate.getMonth() + 1,
					valueDate.getDate()
				);
			} else {
				return undefined;
			}
		} catch (err) {}
	});

	// Generate hours (00-23) and minutes (00, 10, 20, 30, 40, 50)
	const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
	const minutes = ['00', '10', '20', '30', '40', '50'];

	// Extract hour and minute from the date
	let selectedHour = $derived.by(() => {
		try {
			if (attributeValue && new Date(attributeValue) instanceof Date) {
				const valueDate = new Date(attributeValue);
				return String(valueDate.getHours()).padStart(2, '0');
			} else {
				return '09';
			}
		} catch (err) {
			return '09';
		}
	});
	let selectedMinute = $derived.by(() => {
		try {
			if (attributeValue && new Date(attributeValue) instanceof Date) {
				const valueDate = new Date(attributeValue);
				return String(valueDate.getMinutes()).padStart(2, '0');
			} else {
				return '00';
			}
		} catch (err) {
			return '00';
		}
	});

	function updateDateTime(date: Date | undefined, hour: string, minute: string) {
		if (date) {
			date.setHours(parseInt(hour), parseInt(minute), 0, 0);
			attributeValue = date.toISOString();
		}
	}
</script>

{#if dataType === EventAttributeDataType.number}
	<Input
		type="number"
		class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
		oninput={(e) => {
			const val = (e.target as HTMLInputElement).value;
			attributeValue = val.toString();
		}}
		value={attributeValue}
		{...restProps}
	/>
{:else if dataType === EventAttributeDataType.date}
	<Popover.Root bind:open={openCalendar}>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					disabled={restProps.disabled}
					class={cn('w-full justify-start font-normal', !dateValue && 'text-muted-foreground')}
				>
					<CalendarIcon class="me-2 size-4" />
					{#if attributeValue && new Date(attributeValue) instanceof Date}
						{df.format(new Date(attributeValue))} в {dfTime.format(new Date(attributeValue))}
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
							<Select.Trigger class="w-17.5" disabled={restProps.disabled}>
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
							<Select.Trigger class="w-17.5" disabled={restProps.disabled}>
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
{:else if dataType === 'boolean'}
	<Select.Root bind:value={attributeValue} type="single">
		<Select.Trigger
			class={cn(
				'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
				restProps.disabled && 'opacity-50 cursor-not-allowed'
			)}
			disabled={restProps.disabled}
		>
			{#if attributeValue === 'true'}
				Да
			{:else if attributeValue === 'false'}
				Не
			{:else}
				Изберете...
			{/if}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="true">Да</Select.Item>
			<Select.Item value="false">Не</Select.Item>
		</Select.Content>
	</Select.Root>
{:else}
	<Input
		type="text"
		class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
		bind:value={attributeValue}
		{...restProps}
	/>
{/if}
