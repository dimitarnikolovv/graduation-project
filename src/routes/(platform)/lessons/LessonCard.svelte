<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { CompactLesson } from '$lib/server/db-querying/lessons';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Eye from '@lucide/svelte/icons/eye';
	import PosterPlaceholder from '$lib/assets/images/placeholder.png';
	import { cn } from '$lib/utils';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { formatLargeNumber } from '$lib/utils/general';

	type Props = {
		lesson: CompactLesson;
		fluid?: boolean;
	};

	let { lesson, fluid = false }: Props = $props();
</script>

<Card.Root
	class={cn(
		'dark:hover:border-primary/40 my-2 w-full gap-0 overflow-hidden border pt-0! pb-0 transition-all hover:scale-[101%] hover:shadow-md',
		fluid ? 'max-w-full min-w-0' : 'max-w-xs min-w-xs sm:max-w-md md:min-w-sm'
	)}
>
	<a href="/lessons/watch/{lesson.id}" class="group flex h-full flex-col transition-transform">
		<!-- Card Content -->
		<Card.Header class="@container gap-0 px-0! py-0! pb-3">
			<!-- Gradient Header -->

			<div class="relative aspect-video w-full">
				<img
					class="pointer-events-none"
					src={lesson.video.posterFile
						? `/api/file/${lesson.video.posterFile.fileKey}`
						: PosterPlaceholder}
					alt=""
				/>

				{#if lesson.isPaid}
					<Badge
						variant="outline"
						class="absolute top-2 left-2 border-0 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
					>
						С абонамент
					</Badge>
				{:else}
					<Badge
						variant="outline"
						class="absolute top-2 left-2 border-0 bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
					>
						Безплатен
					</Badge>
				{/if}

				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger class="absolute bottom-2 left-2">
							<Badge
								variant="outline"
								class="bg-background/60 dark:bg-background/30 gap-x-2 px-2 py-1 text-xs font-medium"
								><Eye /> {formatLargeNumber(lesson.viewCount)}</Badge
							>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>{lesson.viewCount.toLocaleString('bg')} гледания</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>

			<div class="border-b px-3 py-2 text-xl md:px-4">
				<span class="block text-base font-semibold text-wrap transition-colors @lg:text-lg">
					<Badge class="px-1.5 py-0 font-medium">
						{lesson.order}.
					</Badge>

					{lesson.title}
				</span>
			</div>
		</Card.Header>

		<Card.Content class="h-full px-3 py-3 text-sm md:px-4">
			{lesson.resume}
		</Card.Content>

		<div
			class="bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-between gap-2 px-3 py-3 text-sm transition-colors md:px-4"
		>
			<div class="inline-flex items-center gap-2">
				<BookOpen class="h-4 w-4" /> Към урока
			</div>

			<ArrowRight class="h-4 w-4" />
		</div>
	</a>
</Card.Root>
