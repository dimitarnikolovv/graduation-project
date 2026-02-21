<script lang="ts">
	import * as Select from '$lib/components/ui/select/index';
	import { CalendarDate, DateFormatter, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import * as Popover from '$lib/components/ui/popover/index';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { cn } from '$lib/utils';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { getLocalTimeZone } from '@internationalized/date';
	import { buttonVariants } from '$lib/components/ui/button';
	import { endOfDay, startOfDay } from 'date-fns';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { matchTimePeriodOrLabel } from '$lib/utils/datetime';
	import { displayTimePeriod, TimePeriod } from '$lib/types/enums';
	import { getStartAndEndDates } from '$lib/utils/statistics';

	let startDate: Date | undefined = $state(
		page.url.searchParams?.get('startDate')
			? new Date(page.url.searchParams?.get('startDate') || '')
			: undefined
	);
	let endDate: Date | undefined = $state(
		page.url.searchParams?.get('endDate')
			? new Date(page.url.searchParams?.get('endDate') || '')
			: undefined
	);

	let dateValues = $derived<DateRange | undefined>({
		start: startDate
			? new CalendarDate(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate())
			: undefined,
		end: endDate
			? new CalendarDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate())
			: undefined
	});

	let startValue = $state<DateValue | undefined>(undefined);

	const df = new DateFormatter('bg-BG', {
		dateStyle: 'medium'
	});

	let selectedPeriod = $derived(
		startDate && endDate ? matchTimePeriodOrLabel(startDate, endDate, df) : 'Всички'
	);

	let currentPeriodString = $derived(displayTimePeriod(selectedPeriod));

	const handleFilters = async () => {
		const url = new URL(page.url.href);

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
</script>

<Popover.Root>
	<Popover.Trigger
		class={cn(
			buttonVariants({
				variant: 'outline',
				class: 'w-full min-w-62.5 justify-start overflow-hidden text-left font-normal'
			}),
			!dateValues && 'text-muted-foreground'
		)}
	>
		<CalendarIcon />
		{#if dateValues && dateValues.start}
			{#if dateValues.end}
				{displayTimePeriod(selectedPeriod)}
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
		<div>
			<Select.Root
				type="single"
				value={selectedPeriod}
				onValueChange={(v) => {
					if (v === 'all') {
						startDate = undefined;
						endDate = undefined;

						return handleFilters();
					}

					const { startDate: periodStart, endDate: periodEnd } = getStartAndEndDates(
						v as TimePeriod
					);

					startDate = periodStart;
					endDate = periodEnd;

					handleFilters();
				}}
			>
				<Select.Trigger class="w-full min-w-50">{currentPeriodString}</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">Всички</Select.Item>
					{#each Object.values(TimePeriod) as period}
						<Select.Item value={period}>{displayTimePeriod(period)}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<RangeCalendar
				bind:value={dateValues}
				onStartValueChange={(v) => {
					startValue = v;
				}}
				onValueChange={(range) => {
					if (range && range.start && range.end) {
						const newStartDate = startOfDay(range.start.toDate(getLocalTimeZone()));
						const newEndDate = endOfDay(range.end.toDate(getLocalTimeZone()));

						startDate = newStartDate;
						endDate = newEndDate;

						// Update the selected period based on the date range
						selectedPeriod = matchTimePeriodOrLabel(startDate, endDate, df);

						handleFilters();
					}
				}}
				locale="bg"
				numberOfMonths={2}
			/>
		</div>
	</Popover.Content>
</Popover.Root>
