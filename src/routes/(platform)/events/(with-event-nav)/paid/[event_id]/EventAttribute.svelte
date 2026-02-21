<script lang="ts">
	import { EventAttributeDataType } from '$lib/types/enums';
	import type { EventAttribute } from '$lib/types/events';
	import { DateFormatter } from '@internationalized/date';

	type Props = {
		attribute: EventAttribute;
	};

	let { attribute }: Props = $props();

	const df = new DateFormatter('bg', {
		dateStyle: 'full',
		timeStyle: 'short',
		hour12: false
	});
</script>

<div class="border-t pt-4">
	<h3 class="mb-2 font-medium">{attribute.name}</h3>

	<div class="text-sm">
		{#if attribute.dataType === EventAttributeDataType.link}
			<a
				href={attribute.value}
				target="_blank"
				class="text-blue-700 dark:text-blue-400 break-all hover:underline"
			>
				{attribute.value}
			</a>
		{:else if attribute.dataType === EventAttributeDataType.boolean}
			{#if attribute.value === 'true'}
				<span class="text-muted-foreground">Да</span>
			{:else}
				<span class="text-muted-foreground">Не</span>
			{/if}
		{:else if attribute.dataType === EventAttributeDataType.date}
			<p class="text-muted-foreground whitespace-pre-wrap">
				{df.format(new Date(attribute.value))}
			</p>
		{:else}
			<p class="text-muted-foreground whitespace-pre-wrap">{attribute.value}</p>
		{/if}
	</div>
</div>
