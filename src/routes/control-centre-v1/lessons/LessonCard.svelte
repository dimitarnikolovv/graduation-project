<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		displayPublishedStatus,
		PublishedStatusEnum,
		UserPermissionsEnum
	} from '$lib/types/enums.js';
	import type { PermissionsObject } from '$lib/types/permissions.js';
	import { checkIfUserHasPermission } from '$lib/utils/access-control.js';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Play from '@lucide/svelte/icons/play';
	import Calendar from '@lucide/svelte/icons/calendar';
	import User from '@lucide/svelte/icons/user';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import UserPen from '@lucide/svelte/icons/user-pen';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import Group from '@lucide/svelte/icons/group';
	import { toast } from 'svelte-sonner';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { DateFormatter } from '@internationalized/date';
	import { formatLargeNumber, sliceLongText } from '$lib/utils/general';
	import { cn } from '$lib/utils';
	import type { FetchExpandedLessonsResult } from '$lib/server/db-querying/lessons';
	import { deleteLessonRemote } from '$lib/remote-functions/lessons.remote';
	import { invalidateAll } from '$app/navigation';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';

	type Props = {
		lesson: FetchExpandedLessonsResult['results'][number];
		userPermissions?: PermissionsObject;
	};

	let { lesson, userPermissions }: Props = $props();

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	let openDelete = $state(false);
	let disabled = $state(false);

	async function deleteCurrentLesson() {
		disabled = true;

		try {
			await deleteLessonRemote({
				id: lesson.id
			});

			toast.success('Урокът беше изтрит успешно.');
			await invalidateAll();
		} catch (err) {
			toast.error('Възникна грешка при изтриването на урока.');
		} finally {
			disabled = false;
			openDelete = false;
		}
	}
</script>

<Card.Root class="group flex h-full flex-col transition-shadow hover:shadow-md">
	<Card.Header class="flex flex-1 flex-col">
		<div class="flex w-full justify-between">
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

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="self-start">
					{#snippet child({ props })}
						<Button {...props} class="h-6 px-1! py-0.5!" variant="ghost" size="icon">
							<Ellipsis class="h-4 w-4" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-56" align="end">
					<DropdownMenu.Label>Действия</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Item
							class="cursor-pointer"
							onclick={() => {
								navigator.clipboard.writeText(lesson.id);
								toast.success('ID-то на урока беше копирано в клипборда.');
							}}
						>
							<ClipboardCopy class="h-4 w-4" /> Копирай ID
						</DropdownMenu.Item>

						{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditLessons)}
							<DropdownMenu.Item>
								<a
									href="/control-centre-v1/lessons/edit/{lesson.id}"
									class="flex w-full items-center gap-2"
								>
									<SquarePen class="max-w-4" /> Редактиране
								</a>
							</DropdownMenu.Item>
						{/if}

						{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteLessons)}
							<DropdownMenu.Separator />

							<DropdownMenu.Item
								class={cn(
									buttonVariants({ variant: 'destructive', size: 'sm' }),
									'text-destructive-foreground! w-full cursor-pointer'
								)}
								onclick={() => (openDelete = true)}
							>
								<Trash2 class="stroke-destructive-foreground" />
								Изтрий
							</DropdownMenu.Item>
						{/if}
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
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
					<Badge variant="secondary" class="text-xs bg-yellow-50 text-yellow-700 border-yellow-500">
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
						<span>Неиствестен автор</span>
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
		<div class="w-full space-y-3">
			<div class="flex flex-wrap items-center gap-2">
				{#if lesson.isPaid}
					<Badge variant="outline" class="bg-gray-50 text-gray-700">Платен</Badge>
				{:else}
					<Badge variant="outline" class="bg-green-50 text-green-700">Безплатен</Badge>
				{/if}

				{#if lesson.publishedStatus === PublishedStatusEnum.published}
					<Badge variant="outline" class="bg-green-50 text-green-700"
						>{displayPublishedStatus(lesson.publishedStatus)}</Badge
					>
				{:else}
					<Badge variant="outline" class="bg-red-50 text-red-700 border-red-500"
						>{displayPublishedStatus(lesson.publishedStatus)}</Badge
					>
				{/if}

				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Badge variant="outline">{formatLargeNumber(lesson.viewCount)} гледания</Badge>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>{lesson.viewCount.toLocaleString('bg')} гледания</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>

			{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditLessons)}
				<Button
					size="sm"
					variant="outline"
					class="w-full"
					href="/control-centre-v1/lessons/edit/{lesson.id}"
				>
					<SquarePen class="mr-2 h-4 w-4" />
					Редактирай
				</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteLessons)}
	<ResponsiveDialog bind:open={openDelete} {disabled} closeButtonText="Отказ">
		{#snippet title()}
			Изтриване на урок
		{/snippet}

		{#snippet description()}
			Веднъж изтрит, урокът не може да бъде възстановен.
		{/snippet}

		{#snippet content()}
			<div>
				Сигурни ли сте, че искате да изтриете урок:
				<br />
				<span class="font-mono font-bold">{lesson.title}</span>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<Button
				{disabled}
				variant="destructive"
				type="submit"
				class="bg-destructive! text-destructive-foreground z-10 w-full"
				onclick={deleteCurrentLesson}
			>
				Изтрий
			</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
