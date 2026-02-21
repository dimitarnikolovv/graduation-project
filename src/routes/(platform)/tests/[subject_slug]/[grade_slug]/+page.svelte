<script lang="ts">
	import Smile from '@lucide/svelte/icons/smile';
	import Star from '@lucide/svelte/icons/star';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Gift from '@lucide/svelte/icons/gift';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import * as Pagination from '$lib/components/ui/pagination';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import TestCard from '../../_components/TestCard.svelte';

	let { data } = $props();

	const hasAnyTests =
		data.featuredTests.length > 0 || data.paidTests.length > 0 || data.freeTests.length > 0;

	async function handlePaidPageChange(newPage: number | undefined) {
		if (newPage === undefined) return;
		if (newPage > data.paidTestsTotalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('paidPage', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`, { noScroll: true });
	}

	async function handleFreePageChange(newPage: number | undefined) {
		if (newPage === undefined) return;
		if (newPage > data.freeTestsTotalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('freePage', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`, { noScroll: true });
	}
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content="Тестове по {data.subject.name} за {data.grade.name}." />
</svelte:head>

{#if !hasAnyTests}
	<div
		class="mt-10 flex items-center justify-center rounded-lg border border-dashed px-2 py-38 shadow-sm"
	>
		<div class="flex flex-col items-center gap-4 text-center">
			<h3 class="text-2xl font-bold tracking-tight">Няма намерени тестове</h3>
			<Smile class="text-muted-foreground h-12 w-12" />
		</div>
	</div>
{:else}
	<!-- Featured Tests Section -->
	{#if data.featuredTests.length > 0}
		<section class="isolate">
			<div
				class="bg-background ignore-main-margin sticky top-14 z-10 flex items-center gap-3 border-y py-2 text-2xl font-semibold lg:top-17"
			>
				<Star class="h-5 w-5 fill-amber-500 stroke-amber-500" />
				<h2 class="text-xl font-semibold">Препоръчани тестове</h2>
			</div>

			<div
				class="grid w-full my-5 gap-x-5 gap-y-4 @xl/inset:grid-cols-2 @4xl/inset:grid-cols-3 @6xl/inset:grid-cols-4"
			>
				{#each data.featuredTests as test (test.id)}
					<TestCard {test} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Paid Tests Section -->
	{#if data.paidTests.length > 0 || data.paidTestsTotalItems > 0}
		<section class="isolate">
			<div
				class="bg-background ignore-main-margin sticky top-14 z-10 flex items-center gap-3 border-y py-2 text-2xl font-semibold lg:top-17"
			>
				<CreditCard class="h-5 w-5 text-blue-600" />
				<h2 class="text-xl font-semibold">Платени тестове</h2>
				<span class="text-muted-foreground text-sm">({data.paidTestsTotalItems})</span>
			</div>

			{#if data.paidTests.length > 0}
				<div
					class="grid my-5 w-full gap-x-5 gap-y-4 @xl/inset:grid-cols-2 @4xl/inset:grid-cols-3 @6xl/inset:grid-cols-4"
				>
					{#each data.paidTests as test (test.id)}
						<TestCard {test} />
					{/each}
				</div>

				{#if data.paidTestsTotalPages > 1}
					<div class="mt-6">
						<Pagination.Root
							count={data.paidTestsTotalItems}
							page={data.paidPage}
							perPage={data.limit}
							onPageChange={async (p) => {
								await handlePaidPageChange(p);
							}}
						>
							{#snippet children({ pages, currentPage })}
								<Pagination.Content>
									<Pagination.Item>
										<Pagination.PrevButton
											onclick={() => handlePaidPageChange(currentPage ? currentPage - 1 : 1)}
										>
											<ChevronLeft class="w-4" />
											<span class="hidden sm:inline">Назад</span>
										</Pagination.PrevButton>
									</Pagination.Item>
									{#each pages as p (p.key)}
										{#if p.type === 'ellipsis'}
											<Pagination.Item>
												<Pagination.Ellipsis />
											</Pagination.Item>
										{:else}
											<Pagination.Item>
												<Pagination.Link page={p} isActive={currentPage === p.value}>
													{p.value}
												</Pagination.Link>
											</Pagination.Item>
										{/if}
									{/each}
									<Pagination.Item>
										<Pagination.NextButton
											onclick={() => handlePaidPageChange(currentPage ? currentPage + 1 : 1)}
										>
											<span class="hidden sm:inline">Напред</span>
											<ChevronRight class="w-4" />
										</Pagination.NextButton>
									</Pagination.Item>
								</Pagination.Content>
							{/snippet}
						</Pagination.Root>
					</div>
				{/if}
			{:else}
				<p class="text-muted-foreground">Няма платени тестове на тази страница.</p>
			{/if}
		</section>
	{/if}

	<!-- Free Tests Section -->
	{#if data.freeTests.length > 0 || data.freeTestsTotalItems > 0}
		<section class="isolate">
			<div
				class="bg-background ignore-main-margin sticky top-14 z-10 flex items-center gap-3 border-y py-2 text-2xl font-semibold lg:top-17"
			>
				<Gift class="h-5 w-5 text-green-600" />
				<h2 class="text-xl font-semibold">Безплатни тестове</h2>
				<span class="text-muted-foreground text-sm">({data.freeTestsTotalItems})</span>
			</div>

			{#if data.freeTests.length > 0}
				<div
					class="grid my-5 w-full gap-x-5 gap-y-4 @xl/inset:grid-cols-2 @4xl/inset:grid-cols-3 @6xl/inset:grid-cols-4"
				>
					{#each data.freeTests as test (test.id)}
						<TestCard {test} />
					{/each}
				</div>

				{#if data.freeTestsTotalPages > 1}
					<div class="mt-6">
						<Pagination.Root
							count={data.freeTestsTotalItems}
							page={data.freePage}
							perPage={data.limit}
							onPageChange={async (p) => {
								await handleFreePageChange(p);
							}}
						>
							{#snippet children({ pages, currentPage })}
								<Pagination.Content>
									<Pagination.Item>
										<Pagination.PrevButton
											onclick={() => handleFreePageChange(currentPage ? currentPage - 1 : 1)}
										>
											<ChevronLeft class="w-4" />
											<span class="hidden sm:inline">Назад</span>
										</Pagination.PrevButton>
									</Pagination.Item>
									{#each pages as p (p.key)}
										{#if p.type === 'ellipsis'}
											<Pagination.Item>
												<Pagination.Ellipsis />
											</Pagination.Item>
										{:else}
											<Pagination.Item>
												<Pagination.Link page={p} isActive={currentPage === p.value}>
													{p.value}
												</Pagination.Link>
											</Pagination.Item>
										{/if}
									{/each}
									<Pagination.Item>
										<Pagination.NextButton
											onclick={() => handleFreePageChange(currentPage ? currentPage + 1 : 1)}
										>
											<span class="hidden sm:inline">Напред</span>
											<ChevronRight class="w-4" />
										</Pagination.NextButton>
									</Pagination.Item>
								</Pagination.Content>
							{/snippet}
						</Pagination.Root>
					</div>
				{/if}
			{:else}
				<p class="text-muted-foreground">Няма безплатни тестове на тази страница.</p>
			{/if}
		</section>
	{/if}
{/if}
