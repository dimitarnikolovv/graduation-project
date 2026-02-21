<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Clock from '@lucide/svelte/icons/clock';
	import TrendingUp from '@lucide/svelte/icons/trending-up';

	let { data } = $props();

	const statCards = $derived([
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
	]);

	const completionRate = $derived(
		data.stats.totalLessons > 0
			? Math.round((data.stats.completedLessons / data.stats.totalLessons) * 100)
			: 0
	);
</script>

<div class="space-y-6">
	<!-- Overall Statistics -->
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

	<!-- Overall Progress -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Общ напредък</Card.Title>
			<Card.Description>Процент на завършени уроци</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">Завършени уроци</span>
					<span class="text-sm font-medium">{completionRate}%</span>
				</div>
				<Progress value={completionRate} class="h-3" />
				<p class="text-muted-foreground text-sm">
					{data.stats.completedLessons} от {data.stats.totalLessons} урока
				</p>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Progress by Subject -->
	{#if data.progressStats.data.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Напредък по предмети</Card.Title>
				<Card.Description>Вашето представяне в различните предмети</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-6">
					{#each data.progressStats.data as subjectData}
						{@const subjectCompletionRate =
							subjectData.totalLessons > 0
								? Math.round((subjectData.completedLessons / subjectData.totalLessons) * 100)
								: 0}

						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-semibold">{subjectData.subjectName} {subjectData.gradeName}</h3>
									<p class="text-muted-foreground text-sm">
										{subjectData.completedLessons} от {subjectData.totalLessons} урока завършени
									</p>
								</div>
								<div class="text-right">
									<div class="text-xl font-bold">{subjectCompletionRate}%</div>
									<p class="text-muted-foreground text-xs">
										Среден: {Math.round(subjectData.averageProgress)}%
									</p>
								</div>
							</div>
							<Progress value={subjectCompletionRate} class="h-2" />
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<BookOpen class="text-muted-foreground mb-4 h-16 w-16" />
				<h3 class="mb-2 text-xl font-semibold">Няма данни за напредък</h3>
				<p class="text-muted-foreground text-center">
					Започнете да гледате уроци, за да проследите напредъка си!
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
