<script lang="ts">
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { Label } from '$lib/components/ui/label';
	import type { QuestionOption } from '$lib/types/tests';
	import { cn } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';

	type Props = {
		option: QuestionOption;
		questionId: string;
		selected: boolean;
		children?: Snippet;
	};

	let { option, questionId, selected, children }: Props = $props();
</script>

<div
	class={cn(
		'flex items-center rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20',
		selected &&
			'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-900/20'
	)}
>
	{@render children?.()}

	<div class="ml-3 flex-1">
		<Label
			for="option-{questionId}-{option.id}"
			class="block cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100"
		>
			<RenderStyledHtml renderAsInlineBlock={true}>
				{@html option.text}
			</RenderStyledHtml>
		</Label>
	</div>
	{#if selected}
		<div class="ml-3 flex items-center">
			<Check class="h-5 w-5 text-green-600 dark:text-green-400" />
		</div>
	{/if}
</div>
