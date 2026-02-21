<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select/index';
	import X from '@lucide/svelte/icons/x';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ClassGrade, Subject } from '$lib/server/db/schema/subjects';

	type Props = {
		subjects: Subject[];
		classGrades: ClassGrade[];
		hasActiveFilters: boolean;
	};

	let { subjects, classGrades, hasActiveFilters = $bindable() }: Props = $props();

	let filterSubjectId: string | undefined = $state(page.url.searchParams.get('subjectId') || '');
	let filterClassGradeId: string | undefined = $state(
		page.url.searchParams.get('classGradeId') || ''
	);
	let filterCompleted: string | undefined = $state(page.url.searchParams.get('completed') || '');

	const handleFilters = async () => {
		const url = new URL(page.url.href); // Avoid mutating the original URLSearchParams

		if (filterSubjectId) url.searchParams.set('subjectId', filterSubjectId);
		else url.searchParams.delete('subjectId');

		if (filterClassGradeId) url.searchParams.set('classGradeId', filterClassGradeId);
		else url.searchParams.delete('classGradeId');

		if (filterCompleted) url.searchParams.set('completed', filterCompleted);
		else url.searchParams.delete('completed');

		await goto(url);
	};

	const clearFilters = async () => {
		const url = new URL(page.url.href); // Avoid mutating the original URLSearchParams

		url.searchParams.delete('subjectId');
		url.searchParams.delete('classGradeId');
		url.searchParams.delete('completed');

		filterSubjectId = undefined;
		filterClassGradeId = undefined;
		filterCompleted = undefined;

		await goto(url);
	};

	$effect(() => {
		hasActiveFilters = !!filterSubjectId || !!filterClassGradeId || !!filterCompleted;
	});
</script>

<div class="flex flex-wrap items-center gap-2">
	<!-- Subject Filter -->
	<Select.Root
		type="single"
		bind:value={filterSubjectId}
		onValueChange={(v) => {
			handleFilters();
		}}
	>
		<Select.Trigger class="flex-1 min-w-45">
			{subjects.find((s) => s.id.toString() === filterSubjectId)?.name || 'Всички предмети'}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="" label="Всички предмети" />
			{#each subjects as subject}
				<Select.Item value={subject.id.toString()} label={subject.name} />
			{/each}
		</Select.Content>
	</Select.Root>

	<!-- Grade Filter -->
	<Select.Root
		type="single"
		bind:value={filterClassGradeId}
		onValueChange={(v) => {
			handleFilters();
		}}
	>
		<Select.Trigger class="flex-1 min-w-45">
			{classGrades.find((g) => g.id.toString() === filterClassGradeId)?.name || 'Всички класове'}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="" label="Всички класове" />
			{#each classGrades as grade}
				<Select.Item value={grade.id.toString()} label={grade.name} />
			{/each}
		</Select.Content>
	</Select.Root>

	<!-- Completion Filter -->
	<Select.Root
		type="single"
		bind:value={filterCompleted}
		onValueChange={(v) => {
			handleFilters();
		}}
	>
		<Select.Trigger class="flex-1 min-w-45">
			{filterCompleted === 'true'
				? 'Завършени'
				: filterCompleted === 'false'
					? 'В процес'
					: 'Всички статуси'}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="" label="Всички статуси" />
			<Select.Item value="false" label="В процес" />
			<Select.Item value="true" label="Завършени" />
		</Select.Content>
	</Select.Root>

	{#if hasActiveFilters}
		<Button variant="ghost" size="sm" onclick={clearFilters}>
			<X class="mr-2 h-4 w-4" />
			Изчисти
		</Button>
	{/if}
</div>
