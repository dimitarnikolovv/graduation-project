<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import FileCheck from '@lucide/svelte/icons/file-check';
	import { superForm } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form';
	import { toast } from 'svelte-sonner';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { goto } from '$app/navigation';
	import { createLessonGroupSchema } from '../schema';
	import LessonGroupFormFields from '../LessonGroupFormFields.svelte';

	let { data, form } = $props();

	const createLessonGroupForm = superForm(data.createLessonGroupForm, {
		resetForm: false,
		validators: zod4Client(createLessonGroupSchema),
		dataType: 'json'
	});

	const { form: formData, delayed, enhance } = createLessonGroupForm;

	$effect(() => {
		if (form?.message) {
			if (form.form.valid) {
				toast.success(form.message);
				goto('/control-centre-v1/lesson-groups');
			} else {
				toast.error(form.message);
			}
		}
	});
</script>

<form action="?/createLessonGroup" method="POST" use:enhance>
	<div
		class="bg-background ignore-main-margin sticky top-0 z-50 mb-2 flex items-center justify-between gap-4 py-1.5"
	>
		<div class="flex items-center justify-between gap-4">
			<Button
				variant="outline"
				size="icon"
				class="h-7 w-7 shrink-0"
				href="/control-centre-v1/lesson-groups"
				disabled={$delayed}
			>
				<ChevronLeft class="h-4 w-4" />
				<span class="sr-only">Назад</span>
			</Button>
			<h1 class="text-lg font-semibold md:text-2xl">Нов раздел</h1>
		</div>

		<div class="ml-auto items-center">
			<Form.Button disabled={$delayed} type="submit" size="sm" class="flex items-center gap-2">
				<FileCheck class="h-4 w-4" /> Запази
			</Form.Button>
		</div>
	</div>

	<LessonGroupFormFields
		form={createLessonGroupForm}
		bind:formData={$formData}
		delayed={$delayed}
		subjects={data.subjects}
		classGrades={data.classGrades}
	/>
</form>
