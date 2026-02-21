<script lang="ts">
	import type { QuestionOption } from '$lib/types/tests';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import Option from '../Option.svelte';
	import type { TestQuestion } from '$lib/server/db/schema/tests';

	type Props = {
		selectedOptions: string[];
		questionId: TestQuestion['id'];
		option: QuestionOption;
		disabled?: boolean;
	};

	let { selectedOptions = $bindable(), questionId, option, disabled }: Props = $props();

	let isSelected = $derived(selectedOptions.includes(option.id.toString()));
</script>

<Option {questionId} {option} selected={isSelected}>
	<div class="flex h-5 items-center">
		<RadioGroup.Item
			class="text-blue-600! [&_svg]:fill-blue-600!"
			value={option.id.toString()}
			id="option-{questionId}-{option.id}"
			{disabled}
		/>
	</div>
</Option>
