<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { ExpandedTest } from '$lib/types/tests';

	import Calendar from '@lucide/svelte/icons/calendar';
	import User from '@lucide/svelte/icons/user';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import UserPen from '@lucide/svelte/icons/user-pen';

	import { DateFormatter } from '@internationalized/date';
	import { sliceLongText } from '$lib/utils/general';
	import { cn } from '$lib/utils';

	type Props = {
		test: Omit<ExpandedTest, 'questions'>;

		selectedTestId: string | null;
		disabled: boolean;
	};

	let { test, selectedTestId = $bindable(), disabled }: Props = $props();

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	function toggleSelectTest() {
		if (selectedTestId === test.id) {
			selectedTestId = null;
		} else {
			selectedTestId = test.id;
		}
	}
</script>

<Card.Root class="group flex h-full flex-col transition-shadow hover:shadow-md">
	<Card.Header class="flex flex-1 flex-col">
		<div class="min-w-0 flex-1">
			<Card.Title class="text-lg  leading-tight">
				<a
					href="/control-centre-v1/tests/{test.id}/preview"
					data-sveltekit-preload-data="tap"
					target="_blank"
					class="hover:text-primary flex items-start hover:underline"
				>
					{sliceLongText(test.title, 100)}

					<ExternalLink class="mt-0.5 ml-2 h-4 w-4 shrink-0" />
				</a>
			</Card.Title>
		</div>

		<div class="flex-1">
			<!-- Description that takes up available space in header -->
			<Card.Description class="line-clamp-3">
				{sliceLongText(test.description, 150)}
			</Card.Description>
		</div>
	</Card.Header>

	<Card.Content>
		<div class="space-y-3">
			<!-- Subject and Class Grade -->
			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary" class="text-xs">
					<BookOpen class="mr-1 h-3 w-3" />
					{test.subject.name}
				</Badge>

				<Badge variant="outline" class="text-xs">
					{test.classGrade.name}
				</Badge>

				<Badge variant="outline" class="text-xs" title="Брой въпроси в теста">
					<ListTodo class="mr-1 h-3 w-3" />
					{test.questionsCount} въпроса
				</Badge>

				<Badge variant="outline" class="text-xs" title="Общ брой точки">
					{test.maxScore} точки
				</Badge>
			</div>

			<!-- Author and Last Edited Info -->
			<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
				<div class="flex items-center gap-1">
					<User class="h-3 w-3" />
					{#if test.author}
						<span>{test.author.firstName} {test.author.lastName}</span>
					{:else}
						<span>Неиствестен автор</span>
					{/if}
				</div>
				<div class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					<span>Създадено: {dfShort.format(test.createdAt)}</span>
				</div>
				<div class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					<span>Редактирано: {dfShort.format(test.updatedAt)}</span>
				</div>
				<div class="flex items-center gap-1">
					<UserPen class="h-3 w-3" />
					{#if test.lastEditedBy}
						<span>{test.lastEditedBy.firstName} {test.lastEditedBy.lastName}</span>
					{:else}
						<span>Неизвестен редактор</span>
					{/if}
				</div>
			</div>
		</div>
	</Card.Content>

	<Card.Footer>
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-2">
				{#if test.isPaid}
					<Badge variant="outline" class="bg-gray-50 text-gray-700">Платен</Badge>
				{:else}
					<Badge variant="outline" class="bg-green-50 text-green-700">Безплатен</Badge>
				{/if}
			</div>

			{#if selectedTestId === test.id}
				<div
					class="inline-flex h-8 items-center justify-center rounded-md border bg-green-50 px-4 py-1 text-sm font-medium text-green-700"
				>
					Избрано
				</div>
			{:else}
				<Button
					variant="default"
					{disabled}
					size="sm"
					class={cn(
						selectedTestId === test.id && 'bg-green-50 text-green-700 hover:bg-green-100/80'
					)}
					onclick={toggleSelectTest}
				>
					{selectedTestId === test.id ? 'Избрано' : 'Избери'}
				</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>
