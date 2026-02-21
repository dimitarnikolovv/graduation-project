<script lang="ts">
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FilterWrapper from '$lib/components/filter-wrapper.svelte';

	let filterInternalId = $state(page.url.searchParams.get('internalId') || '');
	let filterExternalId = $state(page.url.searchParams.get('externalId') || '');
	let filterEmail = $state(page.url.searchParams.get('email') || '');
	let filterName = $state(page.url.searchParams.get('name') || '');

	let filterOrderId = $state(page.url.searchParams.get('orderId') || '');

	const handleFilters = async () => {
		const url = new URL(page.url.href);

		if (filterInternalId) url.searchParams.set('internalId', filterInternalId);
		else url.searchParams.delete('internalId');

		if (filterExternalId) url.searchParams.set('externalId', filterExternalId);
		else url.searchParams.delete('externalId');

		if (filterEmail) url.searchParams.set('email', filterEmail);
		else url.searchParams.delete('email');

		if (filterName) url.searchParams.set('name', filterName);
		else url.searchParams.delete('name');

		if (filterOrderId) url.searchParams.set('orderId', filterOrderId);
		else url.searchParams.delete('orderId');

		await goto(url);
	};

	const clearFilters = async () => {
		const url = new URL(page.url.href); // Avoid mutating the original URLSearchParams

		url.searchParams.delete('internalId');
		url.searchParams.delete('externalId');
		url.searchParams.delete('email');
		url.searchParams.delete('name');
		url.searchParams.delete('orderId');

		filterInternalId = '';
		filterExternalId = '';
		filterEmail = '';
		filterName = '';
		filterOrderId = '';

		await goto(url);
	};

	async function handleFilterInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			await handleFilters();
		}
	}
</script>

<FilterWrapper {handleFilters} {clearFilters}>
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
		<div class="grid gap-2">
			<Label>Вътрешен номер</Label>
			<Input
				bind:value={filterInternalId}
				placeholder="tr_..."
				onkeydown={handleFilterInputKeydown}
			/>
		</div>
		<div class="grid gap-2">
			<Label>Външен номер</Label>
			<Input bind:value={filterExternalId} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Номер на поръчка</Label>
			<Input bind:value={filterOrderId} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Имена</Label>
			<Input bind:value={filterName} onkeydown={handleFilterInputKeydown} />
		</div>

		<div class="grid gap-2">
			<Label>Имейл</Label>
			<Input bind:value={filterEmail} onkeydown={handleFilterInputKeydown} />
		</div>
	</div>
</FilterWrapper>
