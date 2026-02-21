<script lang="ts">
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { setMode } from 'mode-watcher';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import Separator from './ui/separator/separator.svelte';
	import { cn } from '$lib/utils';

	type Props = {
		class?: string;
	};
	let { class: className = '' }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), className)}>
		<Sun
			class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
		/>
		<Moon
			class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
		/>
		<span class="sr-only">Toggle theme</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Label>Тема</DropdownMenu.Label>
		<Separator></Separator>
		<DropdownMenu.Group>
			<DropdownMenu.Item onclick={() => setMode('light')}>Светла</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => setMode('dark')}>Тъмна</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => setMode('system')}>Системна</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
