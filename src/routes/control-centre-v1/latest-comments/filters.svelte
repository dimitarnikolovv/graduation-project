<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { buttonVariants } from '$lib/components/ui/button';
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
	import { searchForLessonsRemote } from '$lib/remote-functions/lessons.remote';
	import { Badge } from '$lib/components/ui/badge';
	import { searchForUserRemote } from '$lib/remote-functions/users.remote';
	import { Input } from '$lib/components/ui/input';

	let filterId = $state(page.url.searchParams.get('id') || '');
	let filterAuthorId = $state(page.url.searchParams.get('authorId') || '');
	let filterLessonId = $state(page.url.searchParams.get('lessonId') || '');

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

	async function searchForLessonsInitial() {
		if (!filterLessonId) return '';
		const result = await searchForLessonsRemote({ searchTerm: filterLessonId });
		if (result.results.length === 0) return '';
		return result.results[0].title;
	}

	let selectedLessonName = $derived(await searchForLessonsInitial());
	let searchedLessonTerm = $state('');

	async function findInitialAuthorName() {
		if (!filterAuthorId) return '';

		const result = await searchForUserRemote({ searchTerm: filterAuthorId });

		if (result.results.length === 0) return '';

		return `${result.results[0].firstName} ${result.results[0].lastName}`;
	}

	let selectedAuthorName = $derived(await findInitialAuthorName());
	let searchedAuthorTerm = $state('');

	const handleFilters = async () => {
		const url = new URL(page.url.href);

		if (filterId) url.searchParams.set('id', filterId);
		else url.searchParams.delete('id');

		if (filterLessonId) url.searchParams.set('lessonId', filterLessonId);
		else url.searchParams.delete('lessonId');

		if (filterAuthorId) url.searchParams.set('authorId', filterAuthorId);
		else url.searchParams.delete('authorId');

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
		url.searchParams.delete('authorId');
		url.searchParams.delete('lessonId');

		filterId = '';
		filterAuthorId = '';
		dateValues = undefined;
		startValue = undefined;

		await goto(url);
	};

	async function handleFilterInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			await handleFilters();
		}
	}

	let openLessonsFilter = $state(false);
	let openAuthorsFilter = $state(false);
</script>

<FilterWrapper {handleFilters} {clearFilters}>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="grid gap-2">
			<Label>ID</Label>

			<Input bind:value={filterId} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Урок</Label>
			<Popover.Root bind:open={openLessonsFilter} onOpenChange={(v) => !v && handleFilters()}>
				<Popover.Trigger
					class={cn(
						buttonVariants({ variant: 'outline' }),
						'min-w-0 justify-between',
						!selectedLessonName && 'text-muted-foreground'
					)}
					role="combobox"
				>
					<div class="flex gap-1 text-ellipsis overflow-hidden">
						{selectedLessonName || 'Избери урок'}
					</div>

					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Popover.Trigger>

				<Popover.Content class=" p-0">
					<Command.Root>
						<Command.Input
							bind:value={searchedLessonTerm}
							autofocus
							placeholder="Търсете..."
							class="h-9"
						/>
						<Command.Empty>Не е намерен урок</Command.Empty>
						<Command.Group>
							<ScrollArea class="h-75">
								{#await searchForLessonsRemote({ searchTerm: searchedLessonTerm })}
									<div class="text-center py-4">Зареждане...</div>
								{:then results}
									{#each results.results as lesson (lesson.id)}
										<Command.Item
											value={`${lesson.title} ${lesson.classGrade.name} ${lesson.subject.name}`}
											onSelect={() => {
												filterLessonId = lesson.id;
												selectedLessonName = lesson.title;

												openLessonsFilter = false;

												handleFilters();
											}}
										>
											<div>
												{lesson.title}

												<div class="mt-1 flex gap-1">
													<Badge>
														{lesson.classGrade.name}
													</Badge>
													<Badge>
														{lesson.subject.name}
													</Badge>
												</div>
											</div>
											<Check
												class={cn(
													'ml-auto h-4 w-4',
													!(filterLessonId === lesson.id) && 'text-transparent'
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
		</div>

		<div class="grid gap-2">
			<Label>Автор</Label>
			<Popover.Root bind:open={openAuthorsFilter} onOpenChange={(v) => !v && handleFilters()}>
				<Popover.Trigger
					class={cn(
						buttonVariants({ variant: 'outline' }),
						'min-w-0 justify-between',
						!selectedLessonName && 'text-muted-foreground'
					)}
					role="combobox"
				>
					<div class="flex gap-1 text-ellipsis overflow-hidden">
						{selectedAuthorName || 'Избери автор'}
					</div>

					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Popover.Trigger>

				<Popover.Content class=" p-0">
					<Command.Root>
						<Command.Input
							bind:value={searchedAuthorTerm}
							autofocus
							placeholder="Търсете..."
							class="h-9"
						/>
						<Command.Empty>Не е намерен автор</Command.Empty>
						<Command.Group>
							<ScrollArea class="h-75">
								{#await searchForUserRemote({ searchTerm: searchedAuthorTerm })}
									<div class="text-center py-4">Зареждане...</div>
								{:then results}
									{#each results.results as user (user.id)}
										<Command.Item
											value={`${user.firstName} ${user.lastName} ${user.email}`}
											onSelect={() => {
												filterAuthorId = user.id;
												selectedAuthorName = `${user.firstName} ${user.lastName}`;

												openAuthorsFilter = false;

												handleFilters();
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
													!(filterAuthorId === user.id) && 'text-transparent'
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
