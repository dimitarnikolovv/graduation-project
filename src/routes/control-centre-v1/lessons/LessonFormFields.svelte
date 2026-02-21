<script lang="ts">
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
	import type { CreateLessonSchema, UpdateLessonSchema } from './schema';
	import type { ClassGrade, Subject } from '$lib/server/db/schema/subjects';
	import Label from '$lib/components/ui/label/label.svelte';
	import VideoSelectBoundary from './VideoSelectComponent/VideoSelectBoundary.svelte';
	import VideoSelect from './VideoSelectComponent/VideoSelect.svelte';
	import TestSelectBoundary from './TestSelectComponent/TestSelectBoundary.svelte';
	import TestSelect from './TestSelectComponent/TestSelect.svelte';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { useId } from 'bits-ui';
	import { tick } from 'svelte';
	import TipTap from '$lib/components/tiptap/TipTap.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { getNextOrderNumber } from './getNextOrderNumber.remote';
	import { page } from '$app/state';
	import { displayPublishedStatus, PublishedStatusEnum } from '$lib/types/enums';

	type Props = {
		form: SuperForm<CreateLessonSchema | UpdateLessonSchema>;
		formData: SuperValidated<CreateLessonSchema | UpdateLessonSchema>['data'];
		delayed: boolean;

		subjects: Subject[];
		classGrades: ClassGrade[];
	};

	let { form, formData = $bindable(), delayed, subjects, classGrades }: Props = $props();

	async function fetchAndSetNextOrderNumber() {
		if (formData.subjectId && formData.classGradeId) {
			const next = await getNextOrderNumber({
				subjectId: formData.subjectId,
				classGradeId: formData.classGradeId,
				lessonId: page.params.lesson_id
			});

			formData.order = next;
		}
	}

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

	function findAndDisplaySubject(subjects: any[], subjectId: number | null | undefined) {
		const found = subjects.find((subject) => subject.id === subjectId);

		if (found) {
			return found.name;
		}

		return 'Избери предмет...';
	}

	function findAndDisplayClassGrade(classGrades: any[], classGradeId: number | null | undefined) {
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
</script>

<div class="grid gap-2">
	<div class="mt-6 grid sm:grid-cols-3 gap-2 sm:gap-6">
		<Form.Field {form} name="title">
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

		<Form.Field {form} name="isPaid">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						>Платен урок
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

		<Form.Field {form} name="publishedStatus">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						>Статус
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
							{#each Object.values(PublishedStatusEnum) as status}
								<Select.Item value={status} label={displayPublishedStatus(status)} />
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<div class="grid items-end gap-3 sm:grid-cols-3 sm:gap-6">
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
										onSelect={async () => {
											formData.subjectId = subject.id;
											closeAndFocusTriggerSubject(subjectsTriggerId);
											await fetchAndSetNextOrderNumber();
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
											fetchAndSetNextOrderNumber();
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

		<Form.Field {form} name="order">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Пореден номер</Form.Label>
					<Input {...props} disabled={delayed} type="number" min="1" bind:value={formData.order} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<Form.Field {form} name="resume">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label
					>Кратко описание на урока <span class="text-destructive -mb-1.5 text-sm">*</span
					></Form.Label
				>
				<Textarea {...props} disabled={delayed} bind:value={formData.resume} placeholder="..." />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="space-y-4">
		<Label>Изберете видео <span class="text-destructive text-sm">*</span></Label>

		<VideoSelectBoundary>
			<VideoSelect
				bind:selectedVideoId={formData.videoId}
				disabled={delayed}
				{subjects}
				{classGrades}
				onVideoSelect={async (video) => {
					if (!video) return;
					if (!video.subjectId || !video.classGradeId) return;

					formData.subjectId = video.subjectId;
					formData.classGradeId = video.classGradeId;

					await fetchAndSetNextOrderNumber();
				}}
			/>
		</VideoSelectBoundary>
	</div>

	<div class="space-y-4">
		<Label>Изберете тест</Label>

		<TestSelectBoundary>
			<TestSelect
				bind:selectedTestId={formData.testId}
				disabled={delayed}
				{subjects}
				{classGrades}
			/>
		</TestSelectBoundary>
	</div>

	<div class="grid gap-y-8">
		<div class="space-y-4">
			<Form.Field {form} name="content">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-lg font-semibold">Съдържание</Form.Label>
						<TipTap bind:value={formData.content} disabled={delayed}></TipTap>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>
</div>
