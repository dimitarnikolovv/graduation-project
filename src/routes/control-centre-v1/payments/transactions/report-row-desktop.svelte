<script lang="ts">
	import type { AllExpandedTransactions } from '$lib/server/db-querying/transactions';
	import { DateFormatter } from '@internationalized/date';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { Badge } from '$lib/components/ui/badge';
	import { priceInCentsToRealPrice } from '$lib/utils/prices';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '$lib/components/ui/button';

	type Props = {
		transaction: Exclude<AllExpandedTransactions['transactions'][number], undefined>;
	};

	let { transaction }: Props = $props();

	const df = new DateFormatter('bg', {
		year: '2-digit',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
</script>

<!-- Desktop row -->
<Collapsible.Root
	class="even:bg-muted/70 col-span-full grid grid-cols-subgrid divide-x border-b text-sm *:px-4 *:py-1.5"
>
	<div class="py-0! px-0!">
		<Collapsible.Trigger
			class={buttonVariants({
				variant: 'ghost',
				size: 'sm',
				class: 'w-fit py-0 px-4! rounded-none'
			})}
		>
			<ChevronDown class="h-4 w-4 text-muted-foreground" />

			<span class="sr-only">Toggle</span>
		</Collapsible.Trigger>
	</div>

	<div class="font-mono text-[13px]">
		{transaction.id}
	</div>

	<div class="font-mono text-[13px]">
		{transaction.externalId ?? '-'}
	</div>

	<div class="whitespace-nowrap">
		{df.format(new Date(transaction.createdAt))}
	</div>

	<div class="text-right font-mono text-[13px]">
		{priceInCentsToRealPrice(transaction.amountInCents).toLocaleString('bg', {
			style: 'currency',
			currency: 'EUR'
		})}
	</div>

	<div class="text-center font-mono text-[13px]">
		{transaction.cardType ?? '-'}
	</div>

	<div class="text-center font-mono text-[13px]">
		{transaction.last4 ?? '-'}
	</div>

	<div>
		{transaction.email}
	</div>

	<div class="whitespace-nowrap">
		{transaction.firstName}
		{transaction.lastName}
	</div>

	<div class="wrap-break-word text-center font-mono text-[13px]">
		{transaction.orderId}
	</div>

	<Collapsible.Content class="col-span-full space-y-2 border-t py-4!">
		<div class="rounded-md border px-4 py-3 font-mono text-sm flex flex-col gap-2">
			<div>Основание за транзакцията:</div>

			<div class="font-mono">
				{transaction.reason}
			</div>
		</div>
	</Collapsible.Content>
</Collapsible.Root>
