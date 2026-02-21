<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import * as Card from '$lib/components/ui/card';
	import * as Carousel from '$lib/components/ui/carousel';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { DateFormatter } from '@internationalized/date';
	import type { UploadedFile } from '$lib/server/db/schema/files';
	import type { PaidEvent } from '$lib/server/db/schema/paidEvents';
	import { priceInCentsToRealPrice } from '$lib/utils/prices';
	import RenderStyledHtml from './RenderStyledHtml.svelte';
	import { sliceLongText } from '$lib/utils/general';

	type EventWithPoster = PaidEvent & {
		posterFile: UploadedFile | null;
	};

	type Props = {
		events: EventWithPoster[];
	};

	let { events }: Props = $props();

	const df = new DateFormatter('bg', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
</script>

{#if events && events.length > 0}
	<section class="w-full py-16">
		<div class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<h2 class="heading-font text-titles mb-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
					Предстоящи събития
				</h2>
				<p class="text-muted-foreground">Запишете се за образователни събития</p>
			</div>
			<Button href="/events/paid" variant="outline" class="max-sm:w-full">
				Всички събития
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		</div>

		<Carousel.Root
			opts={{
				align: 'start',
				loop: true
			}}
			class="w-full"
		>
			<Carousel.Content class="p-2">
				{#each events as event}
					<Carousel.Item class="md:basis-1/2 xl:basis-1/4">
						<Card.Root class="group h-full overflow-hidden pt-0 transition-all hover:shadow-md">
							{#if event.posterFile}
								<div class="aspect-video w-full overflow-hidden">
									<img
										src="/api/file/{event.posterFile.fileKey}"
										alt={event.name}
										class="h-full w-full object-cover transition-transform group-hover:scale-105"
									/>
								</div>
							{:else}
								<div
									class="bg-muted flex aspect-video w-full items-center justify-center overflow-hidden"
								>
									<Calendar class="text-muted-foreground h-16 w-16" />
								</div>
							{/if}
							<Card.Header>
								<div class="flex items-center justify-between gap-2 mb-2">
									<Badge variant="default">Предстоящо</Badge>

									<Badge class="border-green-500 bg-green-50 text-green-800">
										{priceInCentsToRealPrice(event.priceInCents).toLocaleString('bg-BG', {
											style: 'currency',
											currency: 'EUR'
										})}
									</Badge>
								</div>
								<Card.Title class="line-clamp-2">{event.name}</Card.Title>
								{#if event.description}
									<Card.Description class="line-clamp-2">
										<RenderStyledHtml renderInline={true} doProseStyling={false}>
											{@html sliceLongText(event.description, 100)}
										</RenderStyledHtml>
									</Card.Description>
								{/if}
							</Card.Header>
							<Card.Content>
								<div class="text-muted-foreground flex items-center text-sm">
									<Calendar class="mr-2 h-4 w-4" />
									{df.format(new Date(event.date))}
								</div>
							</Card.Content>
							<Card.Footer>
								<Button href="/events/paid/{event.id}" class="w-full">Запиши се</Button>
							</Card.Footer>
						</Card.Root>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<Carousel.Previous class="bg-background! absolute left-3 max-md:hidden" />
			<Carousel.Next class="bg-background! absolute right-3 max-md:hidden" />
		</Carousel.Root>
	</section>
{/if}
