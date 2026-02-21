<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { TestQuestion } from '$lib/server/db/schema/tests';
	import type { AnswerResponse, QuestionOption } from '$lib/types/tests';
	import Option from '../Option.svelte';

	type Props = {
		selectedOptions: string[];
		questionId: TestQuestion['id'];
		option: QuestionOption;
		disabled?: boolean;
		persistAnswer: (response: AnswerResponse) => Promise<void>;
	};

	let {
		selectedOptions = $bindable(),
		questionId,
		option,
		disabled,
		persistAnswer
	}: Props = $props();

	let isSelected = $derived(selectedOptions.includes(option.id.toString()));

	/**
	 * Handles toggle of a multiple-choice option.
	 */
	function handleMultipleChoice(optionId: number) {
		const current = new Set(selectedOptions);
		const optionKey = optionId.toString();

		if (current.has(optionKey)) {
			current.delete(optionKey);
		} else {
			current.add(optionKey);
		}

		void persistAnswer({ selected: Array.from(current) });
	}
</script>

<Option {questionId} {option} selected={isSelected}>
	<div class="flex h-5 items-center">
		<Checkbox
			class="data-[state=checked]:bg-blue-600! data-[state=checked]:text-white! dark:data-[state=checked]:bg-blue-600! data-[state=checked]:border-blue-600!"
			id="option-{questionId}-{option.id}"
			bind:checked={isSelected}
			{disabled}
			onCheckedChange={() => handleMultipleChoice(option.id)}
		/>
	</div>
</Option>
