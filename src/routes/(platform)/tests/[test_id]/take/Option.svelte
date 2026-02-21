<script lang="ts">
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { Label } from '$lib/components/ui/label';
	import type { QuestionOption } from '$lib/types/tests';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		option: QuestionOption;
		questionId: string;
		selected: boolean;
		children?: Snippet;
	};

	let { option, questionId, selected, children }: Props = $props();
</script>

<Label
	for="option-{questionId}-{option.id}"
	class={cn(
		'flex items-center rounded-lg border p-4 transition-colors cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900/20',
		selected &&
			'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-900/20'
	)}
>
	{@render children?.()}

	<div class="ml-3 flex-1">
		<RenderStyledHtml renderAsInlineBlock={true}>
			{@html option.text}
		</RenderStyledHtml>
	</div>
	<!-- {#if selected}
		<div class="ml-3 flex items-center">
			<Check class="h-5 w-5 text-blue-600 dark:text-blue-400" />
		</div>
	{/if} -->
</Label>
