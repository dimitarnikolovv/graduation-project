<script lang="ts">
	/**
	 * AttemptFilters Component
	 *
	 * Provides filtering UI for test attempts including:
	 * - Test selection (popover + command)
	 * - User search
	 * - Date submitted range
	 */

	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import * as Popover from '$lib/components/ui/popover/index';
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
	import * as Command from '$lib/components/ui/command/index';
	import { endOfDay, startOfDay } from 'date-fns';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	// ============================================================================
	// TYPES
	// ============================================================================

	type Test = {
		id: string;
		title: string;
	};

	type Props = {
		tests: Test[];
	};

	let { tests }: Props = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let filterTestId = $state(page.url.searchParams.get('testId') || '');
	let filterUserId = $state(page.url.searchParams.get('userId') || '');
	let filterUserSearch = $state(page.url.searchParams.get('userSearch') || '');

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
	let openTestsFilter = $state(false);

	// ============================================================================
	// COMPUTED
	// ============================================================================

	const selectedTest = $derived(tests.find((t) => t.id === filterTestId));

	// ============================================================================
	// HANDLERS
	// ============================================================================

	const handleFilters = async () => {
		const url = new URL(page.url.href);

		if (filterTestId) url.searchParams.set('testId', filterTestId);
		else url.searchParams.delete('testId');

		if (filterUserId) url.searchParams.set('userId', filterUserId);
		else url.searchParams.delete('userId');

		if (filterUserSearch) url.searchParams.set('userSearch', filterUserSearch);
		else url.searchParams.delete('userSearch');

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

		url.searchParams.delete('testId');
		url.searchParams.delete('userId');
		url.searchParams.delete('userSearch');
		url.searchParams.delete('startDate');
		url.searchParams.delete('endDate');

		filterTestId = '';
		filterUserId = '';
		filterUserSearch = '';
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
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Test Filter (Popover + Command) -->
		<div class="grid gap-2">
			<Label>Тест</Label>
			<Popover.Root bind:open={openTestsFilter}>
				<Popover.Trigger
					class={cn(
						buttonVariants({ variant: 'outline' }),
						'min-w-0 justify-between overflow-hidden text-left font-normal',
						!filterTestId && 'text-muted-foreground'
					)}
					role="combobox"
				>
					<span class="truncate">
						{selectedTest?.title || 'Всички тестове'}
					</span>
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Popover.Trigger>

				<Popover.Content class="w-[300px] p-0" align="start">
					<Command.Root>
						<Command.Input autofocus placeholder="Търсете тест..." class="h-9" />
						<Command.Empty>Не е намерен тест</Command.Empty>
						<Command.Group>
							<ScrollArea class="h-64">
								<!-- Option to clear selection -->
								<Command.Item
									value="__all__"
									onSelect={async () => {
										filterTestId = '';
										openTestsFilter = false;
										await handleFilters();
									}}
								>
									Всички тестове
									<Check class={cn('ml-auto h-4 w-4', filterTestId !== '' && 'text-transparent')} />
								</Command.Item>
								{#each tests as test}
									<Command.Item
										value={test.title}
										onSelect={async () => {
											filterTestId = test.id;
											openTestsFilter = false;
											await handleFilters();
										}}
									>
										<span class="truncate">{test.title}</span>
										<Check
											class={cn(
												'ml-auto h-4 w-4 shrink-0',
												filterTestId !== test.id && 'text-transparent'
											)}
										/>
									</Command.Item>
								{/each}
							</ScrollArea>
						</Command.Group>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</div>

		<!-- User Search -->
		<div class="grid gap-2">
			<Label>Потребител (имейл/име)</Label>
			<Input
				bind:value={filterUserSearch}
				onkeydown={handleFilterInputKeydown}
				placeholder="Търсете по имейл или име..."
			/>
		</div>

		<!-- User ID -->
		<div class="grid gap-2">
			<Label>Потребител ID</Label>
			<Input bind:value={filterUserId} onkeydown={handleFilterInputKeydown} placeholder="ID..." />
		</div>

		<!-- Date Range -->
		<div class="grid gap-2">
			<Label>Период на предаване</Label>

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
