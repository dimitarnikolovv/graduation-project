<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as PageNav from '$lib/components/page-navigation/index';
	import { DateFormatter } from '@internationalized/date';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { priceInCentsToRealPrice } from '$lib/utils/prices.js';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { sliceLongText } from '$lib/utils/general.js';

	let { data } = $props();

	const df = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short',
		hour12: false
	});

	const handlePageChange = async (newPage: number | undefined) => {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search);
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};

	function isEventUpcoming(eventDate: Date): boolean {
		return new Date(eventDate) > new Date();
	}
</script>

<svelte:head>
	<title>Предстоящи събития | BRAAND</title>
	<meta
		name="description"
		content="Разгледайте предстоящите образователни събития и се запишете за участие."
	/>
</svelte:head>

<div class="mb-8">
	<h1 class="heading-font text-titles mb-4 text-4xl font-bold">Предстоящи събития</h1>
	<p class="text-muted-foreground text-lg">
		Запишете се за образователни събития, семинари и уъркшопи
	</p>
</div>

<PageNav.Root class="mb-8">
	<PageNav.Item
		class="justofy-center"
		href="/events/paid?filter=upcoming"
		isActiveFn={() => data.filter === 'upcoming'}
	>
		Предстоящи
	</PageNav.Item>

	<PageNav.Item
		class="justofy-center"
		href="/events/paid?filter=past"
		isActiveFn={() => data.filter === 'past'}
	>
		Минали
	</PageNav.Item>

	<PageNav.Item
		class="justofy-center"
		href="/events/paid?filter=all"
		isActiveFn={() => data.filter === 'all'}
	>
		Всички
	</PageNav.Item>
</PageNav.Root>

{#if data.events.length === 0}
	<div
		class="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed px-4 py-16"
	>
		<div class="text-center">
			<Calendar class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
			<h3 class="mb-2 text-xl font-semibold">Няма предстоящи събития</h3>
			<p class="text-muted-foreground">Очаквайте скоро нови събития</p>
		</div>
	</div>
{:else}
	<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each data.events as event}
			<Card.Root class="flex flex-col gap-y-0 overflow-hidden pt-0 transition-all hover:shadow-lg">
				{#if event.posterFile}
					<div class="aspect-video w-full overflow-hidden">
						<img
							src="/api/file/{event.posterFile.fileKey}"
							alt={event.name}
							class="h-full w-full object-cover"
						/>
					</div>
				{/if}
				<Card.Header class="mt-6">
					<div class="flex items-center justify-between gap-2 mb-2">
						<Badge
							variant={isEventUpcoming(event.date) ? 'default' : 'secondary'}
							class="mb-2 w-fit"
						>
							{isEventUpcoming(event.date) ? 'Предстоящо' : 'Приключило'}
						</Badge>

						<Badge class="border-green-500 bg-green-50 text-green-800">
							{priceInCentsToRealPrice(event.priceInCents).toLocaleString('bg-BG', {
								style: 'currency',
								currency: 'EUR'
							})}
						</Badge>
					</div>

					<Card.Title class="line-clamp-2 text-lg">
						<a href="/events/paid/{event.id}" class="hover:underline">{event.name}</a>
					</Card.Title>
					{#if event.description}
						<Card.Description class="line-clamp-2 text-sm">
							<RenderStyledHtml renderInline={true} doProseStyling={false}>
								{@html sliceLongText(event.description, 100)}
							</RenderStyledHtml>
						</Card.Description>
					{/if}
				</Card.Header>
				<Card.Content class="my-6">
					<div class="text-muted-foreground flex items-center text-xs">
						<Calendar class="mr-2 h-3.5 w-3.5" />
						{df.format(new Date(event.date))}
					</div>
				</Card.Content>
				<Card.Footer class="mt-auto">
					<Button href="/events/paid/{event.id}" class="w-full" size="sm">
						{isEventUpcoming(event.date) ? 'Запиши се' : 'Виж детайли'}
					</Button>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>

	<div class="mt-8">
		<Pagination.Root
			count={data.totalItems}
			page={data.page}
			perPage={data.limit}
			onPageChange={async (p) => {
				await handlePageChange(p);
			}}
		>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton
							onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}
						>
							<ChevronLeft class="w-4" />
							<span class="hidden sm:inline">Назад</span>
						</Pagination.PrevButton>
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link {page} isActive={currentPage === page.value}>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton
							onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}
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
