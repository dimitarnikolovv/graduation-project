<script lang="ts">
	import Player from '$lib/components/player/Player.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import FileCheck from '@lucide/svelte/icons/file-check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Upload from '@lucide/svelte/icons/upload';
	import Check from '@lucide/svelte/icons/check';
	import * as Form from '$lib/components/ui/form';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms';
	import Dropzone from '$lib/components/ui-extras/dropzone';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { toast } from 'svelte-sonner';
	import CurrentPosterForm from './current-poster-form.svelte';
	import CurrentChaptersForm from './current-chapters-form.svelte';
	import { bytesToHumanReadable } from '$lib/utils/videos';
	import { cn } from '$lib/utils';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { useId } from 'bits-ui';
	import { tick } from 'svelte';
	import { editVideoSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data, form } = $props();

	const editVideoForm = superForm(data.editVideoForm, {
		resetForm: false,
		validators: zod4Client(editVideoSchema),
		id: `edit-video-form-${data.video.id}`,
		dataType: 'json'
	});

	const { form: formData, delayed, errors, enhance } = editVideoForm;

	$formData.displayName = data.video.displayName;
	$formData.subjectId = data.video.subjectId;
	$formData.classGradeId = data.video.classGradeId;

	const showImagePreviewOnDrop = async (event: CustomEvent) => {
		const { acceptedFiles } = event.detail;

		const file: File = acceptedFiles[0];

		if (file) {
			$formData.posterFile = file;
		}
	};

	const showChapterPreviewOnDrop = async (event: any) => {
		const { acceptedFiles } = event.detail;

		const file: File = acceptedFiles[0];

		if (file) {
			$formData.chaptersFile = file;
		}
	};

	let openSubject = $state(false);
	let openClassGrade = $state(false);

	let subjectsTriggerId = useId();
	let classGradesTriggerId = useId();

	let searchedSubject = $state('');
	let searchedClassGrade = $state('');

	let filteredSubjects = $derived.by(() => {
		if (searchedSubject.trim() === '') {
			return data.subjects.slice(0, 30);
		}

		return data.subjects
			.filter((subject) => subject.name.toLowerCase().includes(searchedSubject.toLowerCase()))
			.slice(0, 30); // Limit to 30 items
	});

	let filteredClassGrades = $derived.by(() => {
		if (searchedClassGrade.trim() === '') {
			return data.classGrades.slice(0, 30);
		}

		return data.classGrades
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

	$effect(() => {
		if (form?.message) {
			if (form.form.valid) {
				toast.success(form.message);
			} else {
				toast.error(form.message);
			}
		}
	});
</script>

<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex items-center justify-between gap-4 py-1.5"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1/videos">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Редактиране на видео</h1>
	</div>
	<div class="ml-auto items-center">
		<Form.Button
			disabled={$delayed}
			form="metadata"
			type="submit"
			size="sm"
			class="flex items-center gap-2"
		>
			<FileCheck class="h-4 w-4" /> Запази
		</Form.Button>
	</div>
</div>

{#if data.video.posterFile || data.video.chaptersFile}
	<div class="grid gap-4 lg:grid-cols-2">
		{#if data.video.posterFile}
			<CurrentPosterForm file={data.video.posterFile} data={data.deleteFileForm} />
		{/if}

		{#if data.video.chaptersFile}
			<CurrentChaptersForm file={data.video.chaptersFile} data={data.deleteFileForm} />
		{/if}
	</div>
{/if}

<form
	id="metadata"
	action="?/editVideo"
	method="POST"
	use:enhance
	class="space-y-6"
	enctype="multipart/form-data"
>
	<Form.Field form={editVideoForm} name="displayName">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Име на видеото <span class="text-destructive font-bold">*</span></Form.Label>

				<Input
					{...props}
					disabled={$delayed}
					bind:value={$formData.displayName}
					type="text"
					required
					class="placeholder:text-muted-foreground"
					placeholder="Име на видеото..."
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="grid items-end gap-3 sm:grid-cols-2 sm:gap-6">
		<Form.Field form={editVideoForm} name="subjectId">
			<Popover.Root bind:open={openSubject}>
				<Form.Control id={subjectsTriggerId}>
					{#snippet children({ props })}
						<div class="grid gap-3">
							<Form.Label>Предмет</Form.Label>
							<Popover.Trigger
								disabled={$delayed}
								class={cn(
									buttonVariants({ variant: 'outline' }),
									'min-w-0 justify-between',
									!$formData.subjectId && 'text-muted-foreground'
								)}
								role="combobox"
								{...props}
							>
								<div class="min-w-0 overflow-hidden">
									{findAndDisplaySubject(data.subjects, $formData.subjectId)}
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
							disabled={$delayed}
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
											if ($formData.subjectId === subject.id) {
												$formData.subjectId = null;
											} else {
												$formData.subjectId = subject.id;
												closeAndFocusTriggerSubject(subjectsTriggerId);
											}
										}}
									>
										{subject.name}
										<Check
											class={cn(
												'ml-auto h-4 w-4',
												subject.id !== $formData.subjectId && 'text-transparent'
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

		<Form.Field form={editVideoForm} name="classGradeId">
			<Popover.Root bind:open={openClassGrade}>
				<Form.Control id={classGradesTriggerId}>
					{#snippet children({ props })}
						<div class="grid gap-3">
							<Form.Label>Клас</Form.Label>
							<Popover.Trigger
								disabled={$delayed}
								class={cn(
									buttonVariants({ variant: 'outline' }),
									'min-w-0 justify-between',
									!$formData.classGradeId && 'text-muted-foreground'
								)}
								role="combobox"
								{...props}
							>
								<div class="min-w-0 overflow-hidden">
									{findAndDisplayClassGrade(data.classGrades, $formData.classGradeId)}
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
							disabled={$delayed}
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
											if ($formData.classGradeId === classGrade.id) {
												$formData.classGradeId = null;
											} else {
												$formData.classGradeId = classGrade.id;
												closeAndFocusTriggerClassGrade(classGradesTriggerId);
											}
										}}
									>
										{classGrade.name}
										<Check
											class={cn(
												'ml-auto h-4 w-4',
												classGrade.id !== $formData.classGradeId && 'text-transparent'
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

	<div class="grid gap-4 lg:grid-cols-2">
		<Form.Field form={editVideoForm} name="posterFile">
			<Form.Control>
				{#snippet children({ props })}
					<Dropzone
						on:click={showImagePreviewOnDrop}
						on:drop={showImagePreviewOnDrop}
						type="file"
						disabled={$delayed}
						multiple={false}
						accept="image/jpeg,image/png"
						class="mb-0! aspect-auto! min-h-72"
					>
						{#if !$formData.posterFile}
							<div class="pointer-events-none flex flex-col items-center gap-1">
								<Upload class="text-muted-foreground pointer-events-none h-5 w-5" />
								<span>Качи постер (.JPEG, .JPG, .PNG)</span>
							</div>
						{/if}

						{#if $formData.posterFile}
							<div class="bg-card z-30 flex flex-col justify-between rounded-md border">
								<div class="flex justify-between gap-2 border-b px-3 py-2">
									<div
										class="max-w-55 overflow-hidden text-xs text-nowrap text-ellipsis whitespace-nowrap"
									>
										{$formData.posterFile.name}
									</div>
									<div class="text-xs">
										<span class="font-bold">
											{bytesToHumanReadable($formData.posterFile.size)}
										</span>
									</div>
								</div>
								<div class="relative my-auto flex items-center justify-center p-1 py-2">
									<img
										src={URL.createObjectURL($formData.posterFile)}
										alt="Постер"
										class="max-h-64 max-w-[16rem] rounded-sm object-contain"
									/>
									<Button
										class="absolute right-1 rounded-full max-sm:max-h-8 max-sm:max-w-8"
										size="icon"
										variant="destructive"
										onclick={() => {
											$formData.posterFile = undefined;
										}}
									>
										<Trash2></Trash2>
									</Button>
								</div>
							</div>
						{/if}
					</Dropzone>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field form={editVideoForm} name="chaptersFile">
			<Form.Control>
				{#snippet children({ props })}
					<Dropzone
						on:click={showChapterPreviewOnDrop}
						on:drop={showChapterPreviewOnDrop}
						disabled={$delayed}
						multiple={false}
						accept=".vtt"
						class="mb-0! aspect-auto! h-full min-h-72"
					>
						{#if !$formData.chaptersFile}
							<div class="pointer-events-none flex flex-col items-center gap-1">
								<Upload class="text-muted-foreground pointer-events-none h-5 w-5" />
								<span> Качи файл с глави (.VTT) </span>
							</div>
						{/if}

						{#if $formData.chaptersFile}
							<div class="bg-muted m-4 grid gap-2 rounded-md p-2 max-sm:mb-10">
								<div>
									Избран файл с глави: <span class="font-mono">{$formData.chaptersFile.name}</span>.
								</div>

								<Button
									class="mx-auto rounded-full"
									size="icon"
									variant="destructive"
									onclick={() => {
										$formData.chaptersFile = undefined;
									}}
								>
									<Trash2></Trash2>
								</Button>
							</div>
						{/if}
					</Dropzone>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>
</form>

<Separator></Separator>

<h2 class="text-center text-lg">Оригинален клип</h2>

<div class="mx-auto w-full max-w-5xl">
	<Player video={data.video} />
</div>
