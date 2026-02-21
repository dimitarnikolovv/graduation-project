<script lang="ts">
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
	import type { CreateLessonGroupSchema, UpdateLessonGroupSchema } from './schema';
	import type { ClassGrade, Subject } from '$lib/server/db/schema/subjects';
	import Label from '$lib/components/ui/label/label.svelte';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import * as Form from '$lib/components/ui/form';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { useId } from 'bits-ui';
	import { tick } from 'svelte';
	import LessonSelectBoundary from './LessonSelectComponent/LessonSelectBoundary.svelte';
	import LessonSelect from './LessonSelectComponent/LessonSelect.svelte';
	import { page } from '$app/state';
	import { getNextOrderNumber } from './lesson-groups.remote';

	type Props = {
		form: SuperForm<CreateLessonGroupSchema | UpdateLessonGroupSchema>;
		formData: SuperValidated<CreateLessonGroupSchema | UpdateLessonGroupSchema>['data'];
		delayed: boolean;

		subjects: Subject[];
		classGrades: ClassGrade[];
	};

	let { form, formData = $bindable(), delayed, subjects, classGrades }: Props = $props();

	let searchParams = $state(new URLSearchParams());

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

	async function fetchAndSetNextOrderNumber() {
		if (formData.subjectId && formData.classGradeId) {
			formData.order = await getNextOrderNumber({
				subjectId: formData.subjectId,
				classGradeId: formData.classGradeId,
				groupId: page.params.group_id ? parseInt(page.params.group_id) : undefined
			});
		}
	}

	function updateSearchParams() {
		const params = new URLSearchParams();

		if (formData.subjectId) {
			params.append('subjectIDs', formData.subjectId.toString());
		}

		if (formData.classGradeId) {
			params.append('classIDs', formData.classGradeId.toString());
		}

		searchParams = params;
	}
</script>

<div class="grid gap-2">
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>
					Име на раздела
					<span class="text-destructive -mb-1.5 text-sm">*</span>
				</Form.Label>
				<Input {...props} disabled={delayed} bind:value={formData.name} type="text" required />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

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
											updateSearchParams();
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
										onSelect={async () => {
											formData.classGradeId = classGrade.id;
											closeAndFocusTriggerClassGrade(classGradesTriggerId);
											await fetchAndSetNextOrderNumber();
											updateSearchParams();
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

	<div class="space-y-4">
		<Label>Изберете уроци</Label>

		<LessonSelectBoundary>
			<LessonSelect
				bind:selectedLessonIds={formData.lessonIds}
				bind:searchParams
				disabled={delayed}
				{subjects}
				{classGrades}
			/>
		</LessonSelectBoundary>
	</div>
</div>
