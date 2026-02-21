<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible/index';
	import { browser } from '$app/environment';

	type Props = {
		children: Snippet;
		handleFilters: () => void;
		clearFilters: () => void;
	};

	let { children, handleFilters, clearFilters }: Props = $props();

	function setFiltersStateToLocalStorage(item: string) {
		localStorage.setItem('filters-open', item);
	}

	function getFiltersStateFromLocalStorage() {
		if (browser) {
			const filterState = localStorage.getItem('filters-open');
			return filterState ? filterState === 'true' : false;
		}

		return true;
	}

	let open = $state(getFiltersStateFromLocalStorage());
</script>

<Collapsible.Root bind:open>
	<Card.Root>
		<Collapsible.Trigger
			class="w-full"
			onclick={() => setFiltersStateToLocalStorage(open ? 'false' : 'true')}
		>
			<Card.Header
				class="-mt-2 flex w-full flex-row items-center justify-between gap-2 pb-4 max-sm:px-4"
			>
				<Card.Title>Филтри</Card.Title>
				<ChevronsUpDown class="mt-0! w-4"></ChevronsUpDown>
			</Card.Header>
		</Collapsible.Trigger>

		<Collapsible.Content>
			<Card.Content class="max-sm:px-4">
				{@render children?.()}
			</Card.Content>

			<Card.Footer
				class="mt-4 flex flex-col flex-wrap justify-between gap-2 max-sm:px-4 sm:flex-row"
			>
				<Button class="max-sm:w-full" onclick={handleFilters}>Търси</Button>
				<Button variant="destructive" class="max-sm:w-full" onclick={clearFilters}>Изчисти</Button>
			</Card.Footer>
		</Collapsible.Content>
	</Card.Root>
</Collapsible.Root>
