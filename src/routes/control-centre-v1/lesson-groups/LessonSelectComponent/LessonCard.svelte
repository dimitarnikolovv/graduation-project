<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Play from '@lucide/svelte/icons/play';
	import Calendar from '@lucide/svelte/icons/calendar';
	import User from '@lucide/svelte/icons/user';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import UserPen from '@lucide/svelte/icons/user-pen';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import Group from '@lucide/svelte/icons/group';
	import { DateFormatter } from '@internationalized/date';
	import { sliceLongText } from '$lib/utils/general';
	import { cn } from '$lib/utils';
	import type { FetchExpandedLessonsResult } from '$lib/server/db-querying/lessons';
	import { MediaQuery } from 'svelte/reactivity';
	import { page } from '$app/state';

	type Props = {
		lesson: FetchExpandedLessonsResult['results'][number];

		disabled: boolean;
		selectedLessonIds: string[];
	};

	let { lesson, disabled, selectedLessonIds = $bindable() }: Props = $props();

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	const isDesktop = new MediaQuery('(min-width: 768px)');

	let open = $state(false);

	function shouldPromptUser() {
		const currentGroupId = page.params.group_id ? parseInt(page.params.group_id) : null;

		return lesson.groupId && lesson.groupId !== currentGroupId;
	}

	function toggleSelectLesson() {
		if (selectedLessonIds.includes(lesson.id)) {
			selectedLessonIds = selectedLessonIds.filter((id) => id !== lesson.id);
		} else {
			selectedLessonIds = [...selectedLessonIds, lesson.id];
		}

		// Close the dialog/drawer if it's open
		open = false;
	}

	let isSelected = $derived(selectedLessonIds.includes(lesson.id));
</script>

<Card.Root class="group flex h-full flex-col transition-shadow hover:shadow-md">
	<Card.Header class="flex flex-1 flex-col">
		<div class="min-w-0 flex-1">
			<Card.Title class="text-lg leading-tight">
				<a
					href="/lessons/watch/{lesson.id}"
					data-sveltekit-preload-data="tap"
					target="_blank"
					class="hover:text-primary flex items-start hover:underline"
				>
					{sliceLongText(lesson.title, 100)}

					<ExternalLink class="mt-0.5 ml-2 h-4 w-4 shrink-0" />
				</a>
			</Card.Title>
		</div>

		<!-- Description that takes up available space in header -->
		<div class="flex-1">
			<Card.Description class="line-clamp-3">
				{sliceLongText(lesson.resume, 150)}
			</Card.Description>
		</div>
	</Card.Header>

	<Card.Content>
		<div class="space-y-3">
			<!-- Subject and Class Grade -->
			<div class="flex flex-wrap gap-2">
				<Badge variant="secondary" class="text-xs">
					<BookOpen class="mr-1 h-3 w-3" />
					{lesson.subject.name}
				</Badge>

				<Badge variant="outline" class="text-xs">
					{lesson.classGrade.name}
				</Badge>

				<Badge variant="outline" class="text-xs">
					<ListOrdered class="mr-1 h-3 w-3" />
					{lesson.order}
				</Badge>

				{#if lesson.group}
					<Badge variant="secondary" class="max-w-full truncate text-xs">
						<Group class="mr-1 h-3 w-3 shrink-0" />
						<span class="truncate">
							{lesson.group.name}
						</span>
					</Badge>
				{:else}
					<Badge variant="secondary" class="text-xs">
						<Group class="mr-1 h-3 w-3" />
						Не пренадлежи към раздел
					</Badge>
				{/if}
			</div>

			<div class="flex flex-col gap-2">
				<!-- Video Info -->

				<Badge
					href="/control-centre-v1/videos?fileId={lesson.video.id}"
					class="max-w-full truncate"
				>
					<Play class="h-4 w-4 shrink-0" />

					<span class="truncate">
						{lesson.video.displayName}
					</span>
				</Badge>

				<!-- Test Info -->
				{#if lesson.test}
					<Badge
						href="/control-centre-v1/tests/{lesson.test.id}/preview"
						class="max-w-full truncate"
					>
						<ListTodo class="h-4 w-4 shrink-0" />

						<span class="truncate">
							{lesson.test.title}
						</span>
					</Badge>
				{:else}
					<Badge>
						<ListTodo class="h-4 w-4 shrink-0" />
						Няма избран тест
					</Badge>
				{/if}
			</div>

			<!-- Author and Last Edited Info -->
			<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
				<div class="flex items-center gap-1">
					<User class="h-3 w-3" />
					{#if lesson.author}
						<span>{lesson.author.firstName} {lesson.author.lastName}</span>
					{:else}
						<span>Неиствестен автор </span>
					{/if}
				</div>
				<div class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					<span>Създадено: {dfShort.format(lesson.createdAt)}</span>
				</div>
				<div class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					<span>Редактирано: {dfShort.format(lesson.updatedAt)}</span>
				</div>
				<div class="flex items-center gap-1">
					<UserPen class="h-3 w-3" />
					{#if lesson.lastEditedBy}
						<span>{lesson.lastEditedBy.firstName} {lesson.lastEditedBy.lastName}</span>
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
				{#if lesson.isPaid}
					<Badge variant="outline" class="bg-gray-50 text-gray-700">Платен</Badge>
				{:else}
					<Badge variant="outline" class="bg-green-50 text-green-700">Безплатен</Badge>
				{/if}
			</div>

			<Button
				{disabled}
				class={cn(
					'bg-primary hover:bg-primary/90 text-primary-foreground hover:text-primary-foreground',
					isSelected &&
						'hover:text-gree-700 inline-flex h-8 items-center justify-center rounded-md border bg-green-50 px-4 py-1 text-sm font-medium text-green-700 hover:bg-green-100/80'
				)}
				size="sm"
				onclick={() => {
					// If lesson is already in a group, open the dialog
					// to inform the user that it will be removed from that group
					if (shouldPromptUser() && !isSelected) open = true;
					else toggleSelectLesson();
				}}
			>
				{isSelected ? 'Премахни' : 'Избери'}
			</Button>
		</div>
	</Card.Footer>
</Card.Root>

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Внимание!</Dialog.Title>
				<Dialog.Description>Урокът пренадлежи към раздел.</Dialog.Description>
			</Dialog.Header>
			<div class="space-y-6">
				<div>
					Урокът <strong>"{lesson.title}"</strong> вече пренадлежи към раздел
					{#if lesson.group}
						<strong>"{lesson.group.name}"</strong>
					{/if}. Ако го изберете, той ще бъде премахнат от текущия раздел и добавен към този.
				</div>
				<div class="grid grid-cols-2 gap-2">
					<Button
						{disabled}
						variant="default"
						type="submit"
						onclick={toggleSelectLesson}
						class="w-full"
					>
						Потвърждавам
					</Button>

					<Button variant="outline" onclick={() => (open = false)}>Отказ</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>Внимание!</Drawer.Title>
				<Drawer.Description>Урокът пренадлежи към раздел.</Drawer.Description>
			</Drawer.Header>
			<div class="space-y-6 px-4">
				<div>
					Урокът <strong>"{lesson.title}"</strong> вече пренадлежи към раздел
					{#if lesson.group}
						<strong>"{lesson.group.name}"</strong>
					{/if}. Ако го изберете, той ще бъде премахнат от текущия раздел и добавен към този.
				</div>

				<Button
					{disabled}
					variant="default"
					type="submit"
					onclick={toggleSelectLesson}
					class="w-full"
				>
					Потвърждавам
				</Button>
			</div>
			<Drawer.Footer class="pt-2">
				<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Отказ</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
