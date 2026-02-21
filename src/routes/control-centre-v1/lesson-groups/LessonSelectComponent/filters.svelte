<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Select from '$lib/components/ui/select/index';
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
	import { Badge } from '$lib/components/ui/badge';
	import type { ClassGrade, Subject } from '$lib/server/db/schema/subjects';

	type Props = {
		subjects: Subject[];
		classGrades: ClassGrade[];
		searchParams: URLSearchParams;
	};

	let { subjects, classGrades, searchParams = $bindable() }: Props = $props();

	let filterTitle = $state(searchParams.get('title') || '');
	let filterId = $state(searchParams.get('id') || '');
	let filterAuthorId = $state(searchParams.get('authorId') || '');
	let filterSubjectIDs = $derived(searchParams.getAll('subjectIDs') || []);
	let filterClassIDs = $derived(searchParams.getAll('classIDs') || []);
	let filterIsPaid = $state(searchParams.get('isPaid') || '');

	const df = new DateFormatter('bg-BG', {
		dateStyle: 'medium'
	});

	let filterStartDate: Date | undefined = $state(
		searchParams?.get('startDate') ? new Date(searchParams?.get('startDate') || '') : undefined
	);
	let filterEndDate: Date | undefined = $state(
		searchParams?.get('endDate') ? new Date(searchParams?.get('endDate') || '') : undefined
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

	let openSubjectsFilter = $state(false);
	let openClassesFilter = $state(false);

	function handleFilters() {
		const localSearchParams = new URLSearchParams(); // Avoid mutating the original URLSearchParams

		if (filterTitle) localSearchParams.set('title', filterTitle);
		else localSearchParams.delete('title');

		if (filterId) localSearchParams.set('id', filterId);
		else localSearchParams.delete('id');

		if (filterAuthorId) localSearchParams.set('authorId', filterAuthorId);
		else localSearchParams.delete('authorId');

		if (filterIsPaid) localSearchParams.set('isPaid', filterIsPaid);
		else localSearchParams.delete('isPaid');

		if (filterSubjectIDs.length > 0)
			filterSubjectIDs.forEach((id) => localSearchParams.append('subjectIDs', id));
		else localSearchParams.delete('subjectIDs');

		if (filterClassIDs.length > 0)
			filterClassIDs.forEach((id) => localSearchParams.append('classIDs', id));
		else localSearchParams.delete('classIDs');

		if (dateValues?.start)
			localSearchParams.set(
				'startDate',
				startOfDay(dateValues.start.toDate(getLocalTimeZone())).toISOString()
			);
		else localSearchParams.delete('startDate');

		if (dateValues?.end)
			localSearchParams.set(
				'endDate',
				endOfDay(dateValues.end.toDate(getLocalTimeZone())).toISOString()
			);
		else localSearchParams.delete('endDate');

		if (searchParams.toString() === localSearchParams.toString()) return; // Prevent unnecessary updates

		searchParams = localSearchParams;
	}

	function clearFilters() {
		const localSearchParams = new URLSearchParams(); // Avoid mutating the original URLSearchParams

		localSearchParams.delete('startDate');
		localSearchParams.delete('endDate');
		localSearchParams.delete('subjectIDs');
		localSearchParams.delete('classIDs');
		localSearchParams.delete('title');
		localSearchParams.delete('id');
		localSearchParams.delete('isPaid');
		localSearchParams.delete('authorId');

		filterTitle = '';
		filterId = '';
		filterIsPaid = '';
		filterAuthorId = '';
		filterSubjectIDs = [];
		filterClassIDs = [];
		dateValues = undefined;
		startValue = undefined;

		if (searchParams.toString() === localSearchParams.toString()) return; // Prevent unnecessary updates

		searchParams = localSearchParams;
	}

	function handleFilterInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleFilters();
		}
	}
</script>

<FilterWrapper {handleFilters} {clearFilters}>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
		<div class="grid gap-2">
			<Label>Заглавие</Label>
			<Input bind:value={filterTitle} onkeydown={handleFilterInputKeydown} />
		</div>
		<div class="grid gap-2">
			<Label>ID</Label>
			<Input bind:value={filterId} onkeydown={handleFilterInputKeydown} />
		</div>
		<div class="grid gap-2">
			<Label>Автор (ID)</Label>
			<Input bind:value={filterAuthorId} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Безплатен</Label>
			<Select.Root
				onValueChange={(v) => {
					filterIsPaid = v;
					handleFilters();
				}}
				type="single"
				value={filterIsPaid}
				allowDeselect
			>
				<Select.Trigger class="w-full">
					{filterIsPaid === 'true' ? 'Да' : filterIsPaid === 'false' ? 'Не' : 'Всички'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="true">Да</Select.Item>
					<Select.Item value="false">Не</Select.Item>
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

		<div class="grid gap-4 sm:col-span-full sm:grid-cols-2">
			<div class="grid gap-2">
				<Label>Предмети</Label>
				<Popover.Root
					bind:open={openSubjectsFilter}
					onOpenChangeComplete={(open) => !open && handleFilters()}
				>
					<Popover.Trigger
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'min-w-0 justify-between',
							!(subjects.length > 0) && 'text-muted-foreground'
						)}
						role="combobox"
					>
						<ScrollArea orientation="horizontal" class="w-11/12">
							<div class="flex gap-1">
								{#each filterSubjectIDs as selectedId}
									<Badge>
										{subjects.find((s) => s.id === parseInt(selectedId))?.name ||
											'Неизвестен прдмет'}
									</Badge>
								{/each}
							</div>
						</ScrollArea>

						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Popover.Trigger>

					<Popover.Content class=" p-0">
						<Command.Root>
							<Command.Input autofocus placeholder="Търсете..." class="h-9" />
							<Command.Empty>Не е намерен предмет</Command.Empty>
							<Command.Group>
								<ScrollArea class="h-75">
									{#each subjects as subject}
										<Command.Item
											value={subject.name}
											onSelect={() => {
												if (filterSubjectIDs.includes(subject.id.toString())) {
													filterSubjectIDs = filterSubjectIDs.filter(
														(id) => id !== subject.id.toString()
													);
												} else {
													filterSubjectIDs.push(subject.id.toString());

													// BUG - When filterSubjectIDs is declared as $derived,
													// it doesn't properly update
													// This is a workaround to ensure it forcefully updates
													filterSubjectIDs = [...filterSubjectIDs];
												}
											}}
										>
											{subject.name}
											<Check
												class={cn(
													'ml-auto h-4 w-4',
													!filterSubjectIDs.includes(subject.id.toString()) && 'text-transparent'
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

			<div class="grid gap-2">
				<Label>Класове</Label>
				<Popover.Root
					bind:open={openClassesFilter}
					onOpenChangeComplete={(open) => !open && handleFilters()}
				>
					<Popover.Trigger
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'min-w-0 justify-between',
							!(classGrades.length > 0) && 'text-muted-foreground'
						)}
						role="combobox"
					>
						<ScrollArea orientation="horizontal" class="w-11/12">
							<div class="flex gap-1">
								{#each filterClassIDs as selectedId}
									<Badge>
										{classGrades.find((s) => s.id === parseInt(selectedId))?.name ||
											'Неизвестен клас'}
									</Badge>
								{/each}
							</div>
						</ScrollArea>

						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Popover.Trigger>

					<Popover.Content class=" p-0">
						<Command.Root>
							<Command.Input autofocus placeholder="Търсете..." class="h-9" />
							<Command.Empty>Не е намерен клас</Command.Empty>
							<Command.Group>
								<ScrollArea class="h-75">
									{#each classGrades as classGrade}
										<Command.Item
											value={classGrade.name}
											onSelect={() => {
												if (filterClassIDs.includes(classGrade.id.toString())) {
													filterClassIDs = filterClassIDs.filter(
														(id) => id !== classGrade.id.toString()
													);
												} else {
													filterClassIDs.push(classGrade.id.toString());

													// BUG - When filterClassIDs is declared as $derived,
													// it doesn't properly update
													// This is a workaround to ensure it forcefully updates
													filterClassIDs = [...filterClassIDs];
												}
											}}
										>
											{classGrade.name}
											<Check
												class={cn(
													'ml-auto h-4 w-4',
													!filterClassIDs.includes(classGrade.id.toString()) && 'text-transparent'
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
		</div>
	</div>
</FilterWrapper>
