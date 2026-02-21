<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Clock from '@lucide/svelte/icons/clock';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import { PUBLIC_HOST } from '$env/static/public';
	import { DateFormatter } from '@internationalized/date';

	let { data } = $props();

	const statCards = [
		{
			title: 'Всички уроци',
			value: data.stats.totalLessons,
			Icon: BookOpen,
			color: 'text-blue-500'
		},
		{
			title: 'Завършени',
			value: data.stats.completedLessons,
			Icon: CircleCheck,
			color: 'text-green-500'
		},
		{
			title: 'В процес',
			value: data.stats.inProgressLessons,
			Icon: Clock,
			color: 'text-yellow-500'
		},
		{
			title: 'Среден напредък',
			value: `${Math.round(data.stats.averageProgress)}%`,
			Icon: TrendingUp,
			color: 'text-purple-500'
		}
	];

	const df = new DateFormatter('bg', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
</script>

<div class="space-y-6">
	<!-- Statistics Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each statCards as stat}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">{stat.title}</Card.Title>
					<stat.Icon class="h-4 w-4 {stat.color}" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stat.value}</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Recent Lessons -->
	{#if data.recentLessons.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Последно гледани уроци</Card.Title>
				<Card.Description>Продължете откъдето сте спрели</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					{#each data.recentLessons as { lesson, progress, lastAccessedAt }}
						{#if lesson}
							<a
								href="/lessons/watch/{lesson.id}"
								class="hover:bg-muted flex items-start gap-4 rounded-lg p-3 transition-colors"
							>
								{#if lesson.video?.posterFile?.fileKey}
									<img
										src="{PUBLIC_HOST}/api/file/{lesson.video.posterFile.fileKey}"
										alt={lesson.title}
										class="bg-muted h-20 w-32 shrink-0 rounded object-cover"
									/>
								{:else}
									<div class="bg-muted flex h-20 w-32 shrink-0 items-center justify-center rounded">
										<BookOpen class="text-muted-foreground h-8 w-8" />
									</div>
								{/if}

								<div class="flex-1 space-y-2">
									<div>
										<h3 class="font-semibold">{lesson.title}</h3>
										<p class="text-muted-foreground text-sm">
											{lesson.subject.name} • {lesson.classGrade.name}
										</p>
									</div>

									<div class="space-y-1">
										<div class="flex items-center justify-between text-sm">
											<span class="text-muted-foreground">Напредък</span>
											<span class="font-medium">{Math.round(progress)}%</span>
										</div>
										<Progress value={progress} class="h-2" />
									</div>

									<p class="text-muted-foreground text-xs">
										Последен достъп: {df.format(new Date(lastAccessedAt))}
									</p>
								</div>
							</a>
						{/if}
					{/each}
				</div>
			</Card.Content>
			<Card.Footer>
				<a href="/account/my-lessons" class="text-primary hover:underline"> Всички мои уроци </a>
			</Card.Footer>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<BookOpen class="text-muted-foreground mb-4 h-16 w-16" />
				<h3 class="mb-2 text-xl font-semibold">Няма намерени уроци</h3>
				<p class="text-muted-foreground mb-6 text-center">
					Все още нямате започнати уроци. Разгледайте нашите уроци и започнете да учите!
				</p>

				<a
					href="/lessons"
					class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-8 py-2 text-sm font-medium transition-colors"
				>
					Към уроците
				</a>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
