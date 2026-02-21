<script lang="ts">
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FilterWrapper from '$lib/components/filter-wrapper.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { displayRole, RolesEnum } from '$lib/types/enums';
	import { Badge } from '$lib/components/ui/badge';

	let filterName: string | undefined = $state(page.url.searchParams.get('name') || '');
	let filterEmail: string | undefined = $state(page.url.searchParams.get('email') || '');
	let filterId: string | undefined = $state(page.url.searchParams.get('id') || '');
	let filterRoles: RolesEnum[] = $state(page.url.searchParams.getAll('role') || []) as RolesEnum[];

	const handleFilters = async () => {
		const url = new URL(page.url.href); // Avoid mutating the original URLSearchParams

		if (filterName) url.searchParams.set('name', filterName);
		else url.searchParams.delete('name');
		if (filterEmail) url.searchParams.set('email', filterEmail);
		else url.searchParams.delete('email');
		if (filterId) url.searchParams.set('id', filterId);
		else url.searchParams.delete('id');

		// Clear existing role filters before setting new ones
		url.searchParams.delete('role');

		if (filterRoles.length > 0) {
			filterRoles.forEach((role) => {
				url.searchParams.append('role', role);
			});
		} else {
			url.searchParams.delete('role');
		}

		await goto(url);
	};

	async function handleFilterInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			await handleFilters();
		}
	}

	const clearFilters = async () => {
		const url = new URL(page.url.href);

		url.searchParams.delete('name');
		url.searchParams.delete('email');
		url.searchParams.delete('id');
		url.searchParams.delete('role');

		filterName = undefined;
		filterEmail = undefined;
		filterId = undefined;
		filterRoles = [];

		await goto(url);
	};
</script>

<FilterWrapper {handleFilters} {clearFilters}>
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div class="grid gap-2">
			<Label>ID</Label>
			<Input type="text" bind:value={filterId} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Имейл</Label>
			<Input type="email" bind:value={filterEmail} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Име</Label>
			<Input bind:value={filterName} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Роли</Label>

			<Select.Root
				type="multiple"
				allowDeselect={true}
				bind:value={filterRoles}
				onValueChange={() => {
					handleFilters();
				}}
			>
				<Select.Trigger class="w-full min-w-0 overflow-hidden">
					<ScrollArea orientation="horizontal" class="max-w-[calc(100%-1.5rem)]">
						<div class="flex gap-1">
							{#if filterRoles.length === 0}
								<span class="text-muted-foreground">Избери роли</span>
							{:else}
								{#each filterRoles as role}
									<Badge>
										{displayRole(role)}
									</Badge>
								{/each}
							{/if}
						</div>
					</ScrollArea>
				</Select.Trigger>
				<Select.Content>
					{#each Object.values(RolesEnum) as role}
						<Select.Item value={role} label={displayRole(role)} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>
</FilterWrapper>
