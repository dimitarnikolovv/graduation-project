<script lang="ts">
	import type { AnswerResponse, ChoiceConfig, QuestionOption } from '$lib/types/tests';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import SingleChoiceOption from './SignleChoiceOption.svelte';
	import type { TestQuestion } from '$lib/server/db/schema/tests';

	type Props = {
		selectedOptions: string[];
		choiceConfig: ChoiceConfig;
		questionId: TestQuestion['id'];
		disabled?: boolean;
		persistAnswer: (response: AnswerResponse) => Promise<void>;
	};

	let {
		selectedOptions = $bindable(),
		choiceConfig,
		questionId,
		disabled,
		persistAnswer
	}: Props = $props();

	/**
	 * Handles selection of a single-choice option.
	 */
	function handleSingleChoice(optionId: number) {
		void persistAnswer({ selected: [optionId.toString()] });
	}
</script>

<RadioGroup.Root
	value={selectedOptions[0] ?? ''}
	onValueChange={(value) => handleSingleChoice(Number(value))}
	{disabled}
>
	<div class="space-y-3">
		{#each choiceConfig.options as option}
			<SingleChoiceOption {questionId} {option} bind:selectedOptions {disabled} />
		{/each}
	</div>
</RadioGroup.Root>
