<script lang="ts">
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
	import type { NewSubjectSchema, UpdateSubjectSchema } from './schema';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input/index.js';
	import { slugify } from '$lib/utils/general';
	import SubjectCard from '$lib/components/SubjectCard.svelte';

	type Props = {
		form: SuperForm<NewSubjectSchema | UpdateSubjectSchema>;
		formData: SuperValidated<NewSubjectSchema | UpdateSubjectSchema>['data'];
		delayed: boolean;
	};

	let { form, formData = $bindable(), delayed }: Props = $props();
</script>

<div class="space-y-4 mb-4">
	<Form.Field {form} name="name" class="px-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Наименование <span class="text-destructive text-base">*</span></Form.Label>

				<Input
					{...props}
					disabled={delayed}
					bind:value={formData.name}
					oninput={() => {
						formData.slug = slugify(formData.name);
					}}
					type="text"
					placeholder=""
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="slug" class="px-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>URL slug <span class="text-destructive text-base">*</span></Form.Label>
				<Input
					{...props}
					disabled={delayed}
					bind:value={formData.slug}
					type="text"
					placeholder=""
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="colorFrom" class="px-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Цвят от</Form.Label>
				<Input {...props} disabled={delayed} bind:value={formData.colorFrom} type="color" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="colorTo" class="px-1">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Цвят до</Form.Label>
				<Input {...props} disabled={delayed} bind:value={formData.colorTo} type="color" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	{#if 'id' in formData && formData.id}
		<input type="hidden" name="id" value={formData.id} />
	{/if}

	<div class="space-y-2">
		<div class="text-sm">Преглед на картата на предмета:</div>

		<SubjectCard
			colorFrom={formData.colorFrom}
			colorTo={formData.colorTo}
			name={formData.name}
			countOfLessons={0}
		/>
	</div>
</div>
