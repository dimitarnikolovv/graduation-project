<script lang="ts">
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
	import type { CreateTestSchema, UpdateTestSchema } from './schema';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import Check from '@lucide/svelte/icons/check';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils.js';
	import type {
		GetAllClassGradesResult,
		GetAllSubjectsResult
	} from '$lib/server/db-querying/subjects';
	import { useId } from 'bits-ui';
	import { tick } from 'svelte';
	import { displayPublishedStatus, PublishedStatusEnum } from '$lib/types/enums';
	import QuestionsForm from './QuestionsForm.svelte';
	import { Label } from '$lib/components/ui/label';
	import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar';

	type Props = {
		form: SuperForm<CreateTestSchema | UpdateTestSchema>;
		formData: SuperValidated<CreateTestSchema | UpdateTestSchema>['data'];
		subjects: GetAllSubjectsResult;
		classGrades: GetAllClassGradesResult;
		delayed: boolean;
		allowQuestionRemoval?: boolean;
		allowSettingAsDraft?: boolean;
	};

	let {
		form,
		formData = $bindable(),
		delayed,
		subjects,
		classGrades,
		allowQuestionRemoval = false,
		allowSettingAsDraft = false
	}: Props = $props();

	let openSubject = $state(false);
	let openClassGrade = $state(false);

	let subjectsTriggerId = useId();
	let classGradesTriggerId = useId();

	let searchedSubject = $state('');
	let searchedClassGrade = $state('');

	let filteredSubjects = $derived.by(() => {
		if (searchedSubject.trim() === '') {
			return subjects.slice(0, 30);
		}

		return subjects
			.filter((subject) => subject.name.toLowerCase().includes(searchedSubject.toLowerCase()))
			.slice(0, 30); // Limit to 30 items
	});

	let filteredClassGrades = $derived.by(() => {
		if (searchedClassGrade.trim() === '') {
			return classGrades.slice(0, 30);
		}

		return classGrades
			.filter((classGrade) =>
				classGrade.name.toLowerCase().includes(searchedClassGrade.toLowerCase())
			)
			.slice(0, 30); // Limit to 30 items
	});

	function findAndDisplaySubject(
		subjects: GetAllSubjectsResult,
		subjectId: number | null | undefined
	) {
		const found = subjects.find((subject) => subject.id === subjectId);

		if (found) {
			return found.name;
		}

		return 'Избери предмет...';
	}

	function findAndDisplayClassGrade(
		classGrades: GetAllClassGradesResult,
		classGradeId: number | null | undefined
	) {
		const found = classGrades.find((classGrade) => classGrade.id === classGradeId);

		if (found) {
			return found.name;
		}

		return 'Избери клас...';
	}

	function closeAndFocusTriggerSubject(triggerId: string) {
		openSubject = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function closeAndFocusTriggerClassGrade(triggerId: string) {
		openClassGrade = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	const df = new DateFormatter('bg', {
		dateStyle: 'medium',
		hour12: false
	});

	let openOpensAtDate = $state(false);
	let openClosesAtDate = $state(false);
</script>

<div class="grid gap-2">
	<Form.Field {form} name="title" class="mt-6">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label
					>Заглавие
					<span class="text-destructive text-sm">*</span>
				</Form.Label>
				<Input {...props} disabled={delayed} bind:value={formData.title} type="text" required />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="grid md:grid-cols-3 gap-2 sm:gap-6">
		<Form.Field {form} name="isPaid">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						>Платен тест
						<span class="text-destructive text-sm">*</span>
					</Form.Label>
					<Select.Root
						type="single"
						disabled={delayed}
						{...props}
						value={formData.isPaid ? 'true' : 'false'}
						allowDeselect={false}
						onValueChange={(v) => (formData.isPaid = v === 'true')}
					>
						<Select.Trigger class="w-full" disabled={delayed}>
							{formData.isPaid ? 'Да' : 'Не'}
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

		<Form.Field {form} name="isFeatured">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						Препоръчан тест
						<span class="text-destructive text-sm">*</span>
					</Form.Label>
					<Select.Root
						type="single"
						disabled={delayed}
						{...props}
						value={formData.isFeatured ? 'true' : 'false'}
						allowDeselect={false}
						onValueChange={(v) => (formData.isFeatured = v === 'true')}
					>
						<Select.Trigger class="w-full" disabled={delayed}>
							{formData.isFeatured ? 'Да' : 'Не'}
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

		<Form.Field {form} name="publishedStatus">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						Статус
						<span class="text-destructive text-sm">*</span>
					</Form.Label>
					<Select.Root
						type="single"
						disabled={delayed}
						{...props}
						bind:value={formData.publishedStatus}
						allowDeselect={false}
					>
						<Select.Trigger class="w-full" disabled={delayed}>
							{formData.publishedStatus
								? displayPublishedStatus(formData.publishedStatus)
								: 'Избери статус...'}
						</Select.Trigger>
						<Select.Content>
							{#each allowSettingAsDraft ? Object.values(PublishedStatusEnum) : Object.values(PublishedStatusEnum).filter((status) => status !== PublishedStatusEnum.draft) as status}
								<Select.Item value={status} label={displayPublishedStatus(status)} />
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="grid md:grid-cols-3 gap-2 sm:gap-6">
		{#if formData.isPaid}
			<Form.Field {form} name="price">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>
							Цена
							<span class="text-destructive text-sm">*</span>
						</Form.Label>
						<Input
							{...props}
							disabled={delayed}
							bind:value={formData.price}
							type="number"
							min="0"
							step="0.01"
							required
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		{/if}

		{#if formData.isFeatured}
			<Form.Field {form} name="featuredOrder">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>
							Пореден ред в препоръчани
							<span class="text-destructive text-sm">*</span>
						</Form.Label>
						<Input
							{...props}
							disabled={delayed}
							bind:value={formData.featuredOrder}
							type="number"
							min="0"
							step="1"
							required
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		{/if}
	</div>

	<div class="grid items-end gap-3 sm:grid-cols-2 sm:gap-6">
		<Form.Field {form} name="subjectId">
			<Popover.Root bind:open={openSubject}>
				<Form.Control id={subjectsTriggerId}>
					{#snippet children({ props })}
						<div class="grid gap-3">
							<Form.Label
								>Предмет <span class="text-destructive -mb-1.5 text-sm">*</span></Form.Label
							>
							<Popover.Trigger
								disabled={delayed}
								class={cn(
									buttonVariants({ variant: 'outline' }),
									'min-w-0 justify-between',
									!formData.subjectId && 'text-muted-foreground'
								)}
								role="combobox"
								{...props}
							>
								<div class="min-w-0 overflow-hidden">
									{findAndDisplaySubject(subjects, formData.subjectId)}
								</div>
								<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Popover.Trigger>
						</div>
					{/snippet}
				</Form.Control>
				<Popover.Content class="p-0">
					<Command.Root>
						<input
							bind:value={searchedSubject}
							disabled={delayed}
							placeholder="Търсете предмети..."
							class="placeholder:text-muted-foreground flex h-9 w-full rounded-md rounded-b-none border-b bg-transparent px-3 py-3 text-sm transition-colors outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<Command.Empty>Не е намерен предмет</Command.Empty>
						<Command.Group>
							<ScrollArea class="h-75">
								{#each filteredSubjects as subject}
									<Command.Item
										value={subject.id.toString()}
										onSelect={() => {
											formData.subjectId = subject.id;
											closeAndFocusTriggerSubject(subjectsTriggerId);
										}}
									>
										{subject.name}
										<Check
											class={cn(
												'ml-auto h-4 w-4',
												subject.id !== formData.subjectId && 'text-transparent'
											)}
										/>
									</Command.Item>
								{/each}
							</ScrollArea>
						</Command.Group>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>

			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="classGradeId">
			<Popover.Root bind:open={openClassGrade}>
				<Form.Control id={classGradesTriggerId}>
					{#snippet children({ props })}
						<div class="grid gap-3">
							<Form.Label>Клас <span class="text-destructive -mb-1.5 text-sm">*</span></Form.Label>
							<Popover.Trigger
								disabled={delayed}
								class={cn(
									buttonVariants({ variant: 'outline' }),
									'min-w-0 justify-between',
									!formData.classGradeId && 'text-muted-foreground'
								)}
								role="combobox"
								{...props}
							>
								<div class="min-w-0 overflow-hidden">
									{findAndDisplayClassGrade(classGrades, formData.classGradeId)}
								</div>
								<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Popover.Trigger>
						</div>
					{/snippet}
				</Form.Control>
				<Popover.Content class="p-0">
					<Command.Root>
						<input
							bind:value={searchedClassGrade}
							disabled={delayed}
							placeholder="Търсете класове..."
							class="placeholder:text-muted-foreground flex h-9 w-full rounded-md rounded-b-none border-b bg-transparent px-3 py-3 text-sm transition-colors outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<Command.Empty>Не е намерен клас</Command.Empty>
						<Command.Group>
							<ScrollArea class="h-75">
								{#each filteredClassGrades as classGrade}
									<Command.Item
										value={classGrade.id.toString()}
										onSelect={() => {
											formData.classGradeId = classGrade.id;
											closeAndFocusTriggerClassGrade(classGradesTriggerId);
										}}
									>
										{classGrade.name}
										<Check
											class={cn(
												'ml-auto h-4 w-4',
												classGrade.id !== formData.classGradeId && 'text-transparent'
											)}
										/>
									</Command.Item>
								{/each}
							</ScrollArea>
						</Command.Group>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="grid items-end gap-2 sm:grid-cols-3 sm:gap-6">
		<Form.Field {form} name="allowedAttempts">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label class="inline-block">
						Брой опити <span class="text-nowrap">(0 = неограничено)</span>
						<span class="text-destructive text-sm">*</span>
					</Form.Label>
					<Input
						{...props}
						disabled={delayed}
						bind:value={formData.allowedAttempts}
						type="number"
						min="0"
						step="1"
						required
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="timeLimitMin">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label class="inline-block">
						Времетраене в минути <span class="text-nowrap">(0 = неограничено)</span>
						<span class="text-destructive text-sm">*</span>
					</Form.Label>
					<Input
						{...props}
						disabled={delayed}
						bind:value={formData.timeLimitMin}
						type="number"
						min="0"
						step="1"
						required
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="questionsPerPage">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						Брой въпроси на страница
						<span class="text-destructive text-sm">*</span>
					</Form.Label>
					<Input
						{...props}
						disabled={delayed}
						bind:value={formData.questionsPerPage}
						type="number"
						min="1"
						max="20"
						step="1"
						required
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="grid items-end gap-3 sm:grid-cols-2 sm:gap-6 mb-2">
		<div class="flex flex-col gap-3">
			<Label for="opens-at-date">Дата и час на отваряне на теста</Label>
			<div class="grid grid-cols-2">
				<Popover.Root bind:open={openOpensAtDate}>
					<Popover.Trigger id="opens-at-date">
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								disabled={delayed}
								class="justify-between font-normal rounded-r-none"
							>
								{formData.opensAt ? df.format(formData.opensAt) : 'Избери дата'}
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto overflow-hidden p-0" align="start">
						<Calendar
							type="single"
							value={formData.opensAt
								? new CalendarDate(
										formData.opensAt.getFullYear(),
										formData.opensAt.getMonth() + 1,
										formData.opensAt.getDate()
									)
								: undefined}
							locale="bg"
							disabled={delayed}
							onValueChange={(v) => {
								formData.opensAt = v?.toDate(getLocalTimeZone()) ?? null;
								openOpensAtDate = false;
							}}
							captionLayout="dropdown"
						/>
					</Popover.Content>
				</Popover.Root>

				<Input
					type="time"
					id="opens-at-time"
					step="1"
					disabled={delayed}
					value={formData.opensAt
						? `${formData.opensAt.getHours().toString().padStart(2, '0')}:${formData.opensAt
								.getMinutes()
								.toString()
								.padStart(2, '0')}`
						: ''}
					onchange={(e) => {
						if (!formData.opensAt) {
							formData.opensAt = new Date();
						}

						const time = (e.target as HTMLInputElement).value;

						const [hours, minutes] = time.split(':').map(Number);

						if (isNaN(hours) || isNaN(minutes)) {
							return;
						}

						const newDate = new Date(formData.opensAt);
						newDate.setHours(hours, minutes, 0, 0);

						formData.opensAt = newDate;
					}}
					class="bg-background rounded-l-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<Label for="closes-at-date">Дата и час на затваряне на теста</Label>
			<div class="grid grid-cols-2">
				<Popover.Root bind:open={openClosesAtDate}>
					<Popover.Trigger id="closes-at-date">
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								disabled={delayed}
								class="justify-between font-normal rounded-r-none"
							>
								{formData.closesAt ? df.format(formData.closesAt) : 'Избери дата'}
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto overflow-hidden p-0" align="start">
						<Calendar
							type="single"
							value={formData.closesAt
								? new CalendarDate(
										formData.closesAt.getFullYear(),
										formData.closesAt.getMonth() + 1,
										formData.closesAt.getDate()
									)
								: undefined}
							locale="bg"
							disabled={delayed}
							onValueChange={(v) => {
								formData.closesAt = v?.toDate(getLocalTimeZone()) ?? null;
								openClosesAtDate = false;
							}}
							captionLayout="dropdown"
						/>
					</Popover.Content>
				</Popover.Root>

				<Input
					type="time"
					id="closes-at-time"
					step="1"
					disabled={delayed}
					value={formData.closesAt
						? `${formData.closesAt.getHours().toString().padStart(2, '0')}:${formData.closesAt
								.getMinutes()
								.toString()
								.padStart(2, '0')}`
						: ''}
					onchange={(e) => {
						if (!formData.closesAt) {
							formData.closesAt = new Date();
						}

						const time = (e.target as HTMLInputElement).value;

						const [hours, minutes] = time.split(':').map(Number);

						if (isNaN(hours) || isNaN(minutes)) {
							return;
						}

						const newDate = new Date(formData.closesAt);
						newDate.setHours(hours, minutes, 0, 0);

						formData.closesAt = newDate;
					}}
					class="bg-background rounded-l-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			</div>
		</div>
	</div>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>
					Кратко описание на теста <span class="text-destructive -mb-1.5 text-sm">*</span>
				</Form.Label>
				<Textarea
					{...props}
					disabled={delayed}
					bind:value={formData.description}
					placeholder="..."
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<QuestionsForm {form} bind:formData {delayed} {allowQuestionRemoval} />
</div>
