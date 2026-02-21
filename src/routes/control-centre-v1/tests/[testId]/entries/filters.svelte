<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Select from '$lib/components/ui/select/index';
	import { displayPaymentMethod, PaymentMethodEnum } from '$lib/types/enums';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		CalendarDate,
		DateFormatter,
		getLocalTimeZone,
		type DateValue
	} from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import FilterWrapper from '$lib/components/filter-wrapper.svelte';
	import { endOfDay, startOfDay } from 'date-fns';

	let filterId = $state(page.url.searchParams.get('id') || '');
	let filterFirstName = $state(page.url.searchParams.get('firstName') || '');
	let filterLastName = $state(page.url.searchParams.get('lastName') || '');
	let filterEmail = $state(page.url.searchParams.get('email') || '');
	let filterTransactionId = $state(page.url.searchParams.get('transactionId') || '');
	let filterPaymentMethod = $state(page.url.searchParams.get('paymentMethod') || '') as
		| PaymentMethodEnum
		| '';

	const df = new DateFormatter('bg-BG', {
		dateStyle: 'medium'
	});

	let filterStartDate: Date | undefined = $state(
		page.url.searchParams?.get('startDate')
			? new Date(page.url.searchParams?.get('startDate') || '')
			: undefined
	);
	let filterEndDate: Date | undefined = $state(
		page.url.searchParams?.get('endDate')
			? new Date(page.url.searchParams?.get('endDate') || '')
			: undefined
	);

	let dateValues = $state<DateRange | undefined>({
		start: filterStartDate
			? new CalendarDate(
					filterStartDate.getFullYear(),
					filterStartDate.getMonth() + 1,
					filterStartDate.getDate()
				)
			: undefined,
		end: filterEndDate
			? new CalendarDate(
					filterEndDate.getFullYear(),
					filterEndDate.getMonth() + 1,
					filterEndDate.getDate()
				)
			: undefined
	});

	let startValue = $state<DateValue | undefined>(undefined);

	const handleFilters = async () => {
		const url = new URL(page.url.href);

		if (filterId) url.searchParams.set('id', filterId);
		else url.searchParams.delete('id');

		if (filterFirstName) url.searchParams.set('firstName', filterFirstName);
		else url.searchParams.delete('firstName');

		if (filterLastName) url.searchParams.set('lastName', filterLastName);
		else url.searchParams.delete('lastName');

		if (filterEmail) url.searchParams.set('email', filterEmail);
		else url.searchParams.delete('email');

		if (filterTransactionId) url.searchParams.set('transactionId', filterTransactionId);
		else url.searchParams.delete('transactionId');

		if (filterPaymentMethod) url.searchParams.set('paymentMethod', filterPaymentMethod);
		else url.searchParams.delete('paymentMethod');

		if (dateValues?.start)
			url.searchParams.set(
				'startDate',
				startOfDay(dateValues.start.toDate(getLocalTimeZone())).toISOString()
			);
		else url.searchParams.delete('startDate');

		if (dateValues?.end)
			url.searchParams.set(
				'endDate',
				endOfDay(dateValues.end.toDate(getLocalTimeZone())).toISOString()
			);
		else url.searchParams.delete('endDate');

		await goto(url);
	};

	const clearFilters = async () => {
		const url = new URL(page.url.href);

		url.searchParams.delete('startDate');
		url.searchParams.delete('endDate');
		url.searchParams.delete('id');
		url.searchParams.delete('firstName');
		url.searchParams.delete('lastName');
		url.searchParams.delete('email');
		url.searchParams.delete('transactionId');
		url.searchParams.delete('paymentMethod');

		filterId = '';
		filterFirstName = '';
		filterLastName = '';
		filterEmail = '';
		filterTransactionId = '';
		filterPaymentMethod = '';
		dateValues = undefined;
		startValue = undefined;

		await goto(url);
	};

	async function handleFilterInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			await handleFilters();
		}
	}
</script>

<FilterWrapper {handleFilters} {clearFilters}>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
		<div class="grid gap-2">
			<Label>ID</Label>
			<Input bind:value={filterId} onkeydown={handleFilterInputKeydown} />
		</div>
		<div class="grid gap-2">
			<Label>Име</Label>
			<Input bind:value={filterFirstName} onkeydown={handleFilterInputKeydown} />
		</div>
		<div class="grid gap-2">
			<Label>Фамилия</Label>
			<Input bind:value={filterLastName} onkeydown={handleFilterInputKeydown} />
		</div>
		<div class="grid gap-2">
			<Label>Имейл</Label>
			<Input bind:value={filterEmail} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>ID на транзакция</Label>
			<Input bind:value={filterTransactionId} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Начин на плащане</Label>

			<Select.Root
				type="single"
				allowDeselect={true}
				bind:value={filterPaymentMethod}
				onValueChange={() => {
					handleFilters();
				}}
			>
				<Select.Trigger class="w-full">
					{filterPaymentMethod
						? displayPaymentMethod(filterPaymentMethod)
						: 'Изберете метод на плащане'}
				</Select.Trigger>
				<Select.Content>
					{#each Object.values(PaymentMethodEnum) as method}
						<Select.Item value={method}>
							{displayPaymentMethod(method)}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="grid gap-2 sm:max-lg:col-span-2">
			<Label>Период</Label>

			<Popover.Root>
				<Popover.Trigger
					class={cn(
						buttonVariants({
							variant: 'outline',
							class: 'min-w-0 justify-start overflow-hidden text-left font-normal'
						}),
						!dateValues && 'text-muted-foreground'
					)}
				>
					<CalendarIcon />
					{#if dateValues && dateValues.start}
						{#if dateValues.end}
							{df.format(dateValues.start.toDate(getLocalTimeZone()))} - {df.format(
								dateValues.end.toDate(getLocalTimeZone())
							)}
						{:else}
							{df.format(dateValues.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if startValue}
						{df.format(startValue.toDate(getLocalTimeZone()))}
					{:else}
						Изберете период
					{/if}
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" align="start">
					<RangeCalendar
						bind:value={dateValues}
						onStartValueChange={(v) => {
							startValue = v;
							handleFilters();
						}}
						locale="bg"
						numberOfMonths={2}
					/>
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>
</FilterWrapper>
