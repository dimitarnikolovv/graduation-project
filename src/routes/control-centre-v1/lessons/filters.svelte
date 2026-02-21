<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Select from '$lib/components/ui/select/index';
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
	import { Badge } from '$lib/components/ui/badge';
	import type { ClassGrade, Subject } from '$lib/server/db/schema/subjects';

	type Props = {
		subjects: Subject[];
		classGrades: ClassGrade[];
	};

	let { subjects, classGrades }: Props = $props();

	let filterTitle = $state(page.url.searchParams.get('title') || '');
	let filterId = $state(page.url.searchParams.get('id') || '');
	let filterAuthorId = $state(page.url.searchParams.get('authorId') || '');
	let filterSubjectIDs = $state(page.url.searchParams.getAll('subjectIDs') || []);
	let filterClassIDs = $state(page.url.searchParams.getAll('classIDs') || []);
	let filterIsPaid = $state(page.url.searchParams.get('isPaid') || '');

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

		if (filterTitle) url.searchParams.set('title', filterTitle);
		else url.searchParams.delete('title');

		if (filterId) url.searchParams.set('id', filterId);
		else url.searchParams.delete('id');

		if (filterAuthorId) url.searchParams.set('authorId', filterAuthorId);
		else url.searchParams.delete('authorId');

		if (filterIsPaid) url.searchParams.set('isPaid', filterIsPaid);
		else url.searchParams.delete('isPaid');

		// Delete existing subjectIDs and classIDs to avoid duplicates when appending
		url.searchParams.delete('subjectIDs');

		if (filterSubjectIDs.length > 0)
			filterSubjectIDs.forEach((id) => url.searchParams.append('subjectIDs', id));
		else url.searchParams.delete('subjectIDs');

		url.searchParams.delete('classIDs');

		if (filterClassIDs.length > 0)
			filterClassIDs.forEach((id) => url.searchParams.append('classIDs', id));
		else url.searchParams.delete('classIDs');

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
		url.searchParams.delete('subjectIDs');
		url.searchParams.delete('classIDs');
		url.searchParams.delete('title');
		url.searchParams.delete('id');
		url.searchParams.delete('isPaid');
		url.searchParams.delete('authorId');

		filterTitle = '';
		filterId = '';
		filterIsPaid = '';
		filterAuthorId = '';
		filterSubjectIDs = [];
		filterClassIDs = [];
		dateValues = undefined;
		startValue = undefined;

		await goto(url);
	};

	async function handleFilterInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			await handleFilters();
		}
	}

	let openSubjectsFilter = $state(false);
	let openClassesFilter = $state(false);
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
			<Label>Платен</Label>
			<Select.Root
				onValueChange={(v) => {
					handleFilters();
				}}
				type="single"
				bind:value={filterIsPaid}
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
				<Popover.Root bind:open={openSubjectsFilter} onOpenChange={(v) => !v && handleFilters()}>
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
				<Popover.Root bind:open={openClassesFilter} onOpenChange={(v) => !v && handleFilters()}>
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
