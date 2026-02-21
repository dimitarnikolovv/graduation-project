<script lang="ts">
	import FooterPlatform from '$lib/components/FooterPlatform.svelte';
	import SubjectCard from '$lib/components/SubjectCard.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Star from '@lucide/svelte/icons/star';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta
		name="description"
		content="Разгледайте тестове за подготовка към изпитите и проверете знанията си."
	/>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-6">
	<!-- Header Section -->
	<div class="mb-6 text-center md:mb-8">
		<h1 class="text-3xl font-bold md:text-4xl">Нека изберем предмет</h1>

		<div class="mt-12 text-center">
			<div class="bg-muted inline-flex items-center rounded-full px-4 py-2">
				<Star class="mr-2 h-4 w-4 text-yellow-500" />
				<span class="text-sm font-medium">
					{data.subjects.length}
					{data.subjects.length === 1 ? 'предмет' : 'предмета'}
				</span>
			</div>
		</div>
	</div>

	{#if data.subjects.length === 0}
		<div
			class="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed px-4 py-16"
		>
			<div class="text-center">
				<ClipboardCheck class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
				<h3 class="mb-2 text-xl font-semibold">Няма налични тестове</h3>
				<p class="text-muted-foreground">Очаквайте скоро нови тестове</p>
			</div>
		</div>
	{:else}
		<!-- Subjects Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.subjects as subject, index}
				<a href="/tests/{subject.slug}" class="group block">
					<Card.Root
						class="h-full overflow-hidden border-0 pt-0! transition-all duration-300 hover:scale-105 hover:shadow-xl"
					>
						<!-- Card Content -->
						<Card.Header class="px-0! py-0! pb-3">
							<!-- Gradient Header -->
							<SubjectCard
								colorFrom={subject.colorFrom}
								colorTo={subject.colorTo}
								name={subject.name}
								countOfLessons={subject.countOfTests}
								labelSingular="тест"
								labelPlural="теста"
							/>
						</Card.Header>

						<Card.Content class="px-3 pt-0 md:px-6">
							<div class="flex items-center justify-between">
								<div class="text-muted-foreground flex items-center space-x-1 text-xs md:text-sm">
									<ClipboardCheck class="h-3 w-3 md:h-4 md:w-4" />
									<span>Тестове</span>
								</div>
								<ChevronRight
									class="text-muted-foreground group-hover:text-primary h-3 w-3 transition-colors md:h-4 md:w-4"
								/>
							</div>
						</Card.Content>

						<!-- Hover Effect Overlay -->
						<div
							class="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						></div>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>

<FooterPlatform />
