<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import FileDown from '@lucide/svelte/icons/file-down';
	import BanknoteArrowDown from '@lucide/svelte/icons/banknote-arrow-down';
	import type { AllExpandedTransactions } from '$lib/server/db-querying/transactions';

	type Props = {
		transaction: AllExpandedTransactions['transactions'][0];
	};

	let { transaction }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="{buttonVariants({ variant: 'ghost', size: 'icon' })} h-8 w-8">
		<span class="sr-only">Отвори менюто</span>
		<Ellipsis class="h-4 w-4" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Действия</DropdownMenu.Label>
			<DropdownMenu.Separator></DropdownMenu.Separator>

			<DropdownMenu.Item
				onclick={() => {
					navigator.clipboard.writeText(transaction.id);
					toast.success('Копирано успешно!');
				}}
				class="cursor-pointer"
			>
				<ClipboardCopy class="max-w-5"></ClipboardCopy>
				<span> Копирай ID </span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>

		<DropdownMenu.Separator></DropdownMenu.Separator>

		<DropdownMenu.Item>
			<a
				href="/control-centre-v1/payments/refunds/new/{transaction.id}"
				class="flex items-center gap-2"
			>
				<BanknoteArrowDown class="max-w-5"></BanknoteArrowDown>
				<span>Възстанови плащането</span>
			</a>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
