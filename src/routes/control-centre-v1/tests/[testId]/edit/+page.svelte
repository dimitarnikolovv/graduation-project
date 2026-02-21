<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import FileCheck from '@lucide/svelte/icons/file-check';
	import { superForm } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form';
	import { toast } from 'svelte-sonner';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { updateTestSchema } from '../../schema';
	import { goto } from '$app/navigation';
	import TestFormFields from '../../TestFormFields.svelte';

	let { data, form } = $props();

	const updateTestForm = superForm(data.updateTestForm, {
		resetForm: false,
		validators: zod4Client(updateTestSchema),
		dataType: 'json',
		taintedMessage: 'Ако напуснете страницата, ще загубите направените промени.'
	});

	const { form: formData, delayed, enhance } = updateTestForm;

	$effect(() => {
		if (form?.message) {
			if (form.form.valid) {
				toast.success(form.message);
				goto('/control-centre-v1/tests');
			} else {
				toast.error(form.message);
			}
		}
	});
</script>

<form action="?/updateTest" method="POST" use:enhance>
	<div
		class="bg-background ignore-main-margin sticky top-0 z-50 mb-2 flex items-center justify-between gap-4 py-1.5"
	>
		<div class="flex items-center justify-between gap-4">
			<Button
				variant="outline"
				size="icon"
				class="h-7 w-7 shrink-0"
				href="/control-centre-v1/tests"
				disabled={$delayed}
			>
				<ChevronLeft class="h-4 w-4" />
				<span class="sr-only">Назад</span>
			</Button>
			<h1 class="text-lg font-semibold md:text-2xl">Редактиране на тест</h1>
		</div>

		<div class="ml-auto items-center">
			<Form.Button disabled={$delayed} type="submit" size="sm" class="flex items-center gap-2">
				<FileCheck class="h-4 w-4" /> Запази
			</Form.Button>
		</div>
	</div>

	{#if !data.allowQuestionRemoval}
		<div class="mb-4 rounded-md bg-yellow-50 p-4">
			<div class="flex">
				<div class="ml-3">
					<h3 class="text-sm font-medium text-yellow-800">Внимание</h3>
					<div class="mt-2 text-sm text-yellow-700">
						<p>
							Поради наличието на започнати опити от потребители, премахването на въпроси е
							деактивирано за този тест, за да се запази целостта на съществуващите опити.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<TestFormFields
		form={updateTestForm}
		bind:formData={$formData}
		delayed={$delayed}
		subjects={data.subjects}
		classGrades={data.classGrades}
		allowQuestionRemoval={data.allowQuestionRemoval}
		allowSettingAsDraft={data.allowSettingAsDraft}
	/>
</form>
