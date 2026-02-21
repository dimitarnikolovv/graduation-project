<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import * as Pagination from '$lib/components/ui/pagination';
	import { Badge } from '$lib/components/ui/badge';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Clock from '@lucide/svelte/icons/clock';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { PUBLIC_HOST } from '$env/static/public';
	import { DateFormatter } from '@internationalized/date';
	import Filters from './filters.svelte';

	let { data } = $props();

	const handlePageChange = async (newPage: number | undefined) => {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search); // Avoid mutating the original URLSearchParams
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};

	let hasActiveFilters = $state(false);

	const df = new DateFormatter('bg-BG', {
		dateStyle: 'medium'
	});
</script>

<div class="space-y-6">
	<!-- Header with filters -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="shrink-0">
			<h2 class="text-2xl font-bold">Моите уроци</h2>
			<p class="text-muted-foreground">
				{data.totalItems}
				{data.totalItems === 1 ? 'урок' : 'урока'}
			</p>
		</div>

		<Filters subjects={data.subjects} classGrades={data.classGrades} bind:hasActiveFilters />
	</div>

	<!-- Lessons Grid -->
	{#if data.results.length > 0}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.results as { lesson, subject, classGrade, video, posterFile, lessonGroup, progress, completedAt, lastAccessedAt }}
				{#if lesson}
					<Card.Root class="group overflow-hidden pt-0 transition-shadow hover:shadow-lg">
						<a href="/lessons/watch/{lesson.id}" class="block">
							<!-- Thumbnail -->
							<div class="relative aspect-video overflow-hidden">
								{#if posterFile?.fileKey}
									<img
										src="{PUBLIC_HOST}/api/file/{posterFile.fileKey}"
										alt={lesson.title}
										class="h-full w-full object-cover transition-transform group-hover:scale-105"
									/>
								{:else}
									<div class="bg-muted flex h-full w-full items-center justify-center">
										<BookOpen class="text-muted-foreground h-12 w-12" />
									</div>
								{/if}

								<!-- Status Badge -->
								<div class="absolute top-2 right-2">
									{#if completedAt}
										<Badge class="bg-green-500 text-white">
											<CircleCheck class="mr-1 h-3 w-3" />
											Завършен
										</Badge>
									{:else if progress > 0}
										<Badge variant="secondary">
											<Clock class="mr-1 h-3 w-3" />
											В процес
										</Badge>
									{/if}
								</div>
							</div>

							<!-- Content -->
							<Card.Header>
								<div class="mt-4 flex items-start justify-between gap-2">
									<Card.Title class="line-clamp-2 text-lg">{lesson.title}</Card.Title>
								</div>
								<Card.Description class="line-clamp-2">
									{lesson.resume}
								</Card.Description>
							</Card.Header>

							<Card.Content class="space-y-3 mt-2">
								<!-- Subject and Grade -->
								<div class="flex items-center gap-2 text-sm">
									<Badge variant="outline">{subject.name}</Badge>
									<Badge variant="outline">{classGrade.name}</Badge>
								</div>

								<!-- Progress -->
								<div class="space-y-1">
									<div class="flex items-center justify-between text-sm">
										<span class="text-muted-foreground">Напредък</span>
										<span class="font-medium">{Math.round(progress)}%</span>
									</div>
									<Progress value={progress} class="h-2" />
								</div>

								<!-- Last Accessed -->
								<p class="text-muted-foreground text-xs">
									Последен достъп: {df.format(new Date(lastAccessedAt))}
								</p>

								{#if lessonGroup}
									<p class="text-muted-foreground text-xs">
										Раздел: {lessonGroup.name}
									</p>
								{/if}
							</Card.Content>
						</a>
					</Card.Root>
				{/if}
			{/each}
		</div>

		<!-- Pagination -->

		<div class="flex justify-center">
			<Pagination.Root
				count={data.totalItems}
				page={data.currentPage}
				perPage={data.limit}
				onPageChange={handlePageChange}
			>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.PrevButton
								onclick={() =>
									handlePageChange(currentPage && currentPage > 1 ? currentPage - 1 : 1)}
							>
								<ChevronLeft class="h-4 w-4" />
								<span class="hidden sm:inline">Предишна</span>
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
								onclick={() =>
									handlePageChange(
										currentPage && currentPage < data.totalPages ? currentPage + 1 : data.totalPages
									)}
							>
								<span class="hidden sm:inline">Следваща</span>
								<ChevronRight class="h-4 w-4" />
							</Pagination.NextButton>
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</div>
	{:else}
		<!-- Empty State -->
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<BookOpen class="text-muted-foreground mb-4 h-16 w-16" />
				<h3 class="mb-2 text-xl font-semibold">Няма намерени уроци</h3>
				<p class="text-muted-foreground mb-6 text-center">
					{#if hasActiveFilters}
						Не намерихме уроци, отговарящи на избраните филтри. Опитайте с други настройки.
					{:else}
						Все още нямате започнати уроци. Разгледайте нашите уроци и започнете да учите!
					{/if}
				</p>

				<Button href="/lessons">Към уроците</Button>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
