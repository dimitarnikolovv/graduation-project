<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		displayPublishedStatus,
		PublishedStatusEnum,
		UserPermissionsEnum
	} from '$lib/types/enums.js';
	import type { PermissionsObject } from '$lib/types/permissions.js';
	import type { ExpandedTest } from '$lib/types/tests';
	import { checkIfUserHasPermission } from '$lib/utils/access-control.js';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import Star from '@lucide/svelte/icons/star';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Calendar from '@lucide/svelte/icons/calendar';
	import User from '@lucide/svelte/icons/user';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import UserPen from '@lucide/svelte/icons/user-pen';
	import { toast } from 'svelte-sonner';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { DateFormatter } from '@internationalized/date';
	import { sliceLongText } from '$lib/utils/general';
	import { cn } from '$lib/utils';
	import { deleteTestRemote, toggleTestFeaturedRemote } from './test.remote';
	import { invalidateAll } from '$app/navigation';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import { priceInCentsToRealPrice } from '$lib/utils/prices';

	type Props = {
		test: Omit<ExpandedTest, 'questions'>;
		userPermissions?: PermissionsObject;
	};

	let { test, userPermissions }: Props = $props();

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	let openDelete = $state(false);
	let disabledDelete = $state(false);
	let disabledFeatured = $state(false);

	async function deleteCurrentTest() {
		disabledDelete = true;

		try {
			await deleteTestRemote({
				id: test.id
			});

			toast.success('Тестът беше изтрит успешно.');
			await invalidateAll();
		} catch (err) {
			toast.error('Възникна грешка при изтриването на теста.');
		} finally {
			disabledDelete = false;
			openDelete = false;
		}
	}

	async function toggleTestFeatured() {
		disabledFeatured = true;

		try {
			await toggleTestFeaturedRemote({
				id: test.id
			});

			toast.success('Тестът беше отбелязан/премахнат като препоръчан успешно.');
			await invalidateAll();
		} catch (err) {
			toast.error('Възникна грешка при правенето на теста като препоръчан.');
		} finally {
			disabledFeatured = false;
		}
	}
</script>

<Card.Root class="group flex h-full flex-col transition-shadow hover:shadow-md">
	<Card.Header class="flex flex-1 flex-col">
		<div class="flex w-full gap-x-2 justify-between">
			<div class="min-w-0 flex-1">
				<Card.Title class="text-lg  leading-tight">
					<a
						href="/control-centre-v1/tests/{test.id}/preview"
						data-sveltekit-preload-data="tap"
						class="hover:text-primary flex items-start hover:underline"
					>
						{sliceLongText(test.title, 100)}

						<ExternalLink class="mt-0.5 ml-2 h-4 w-4 shrink-0" />
					</a>
				</Card.Title>
			</div>

			<Button
				disabled={disabledFeatured}
				type="submit"
				class="p-0! h-4.5! mt-0.5 items-center justify-center"
				variant="ghost"
				onclick={toggleTestFeatured}
			>
				<Star
					class={cn('size-4.5', test.isFeatured && 'fill-amber-500! stroke-1 stroke-amber-500!')}
				/>
				<span class="sr-only">Направи препоръчан</span>
			</Button>

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
								navigator.clipboard.writeText(test.id);
								toast.success('ID-то на теста беше копирано в клипборда.');
							}}
						>
							<ClipboardCopy class="h-4 w-4" /> Копирай ID
						</DropdownMenu.Item>

						{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditTests)}
							<DropdownMenu.Item>
								<a
									href="/control-centre-v1/tests/{test.id}/edit"
									class="flex w-full items-center gap-2"
								>
									<SquarePen class="max-w-4" /> Редактиране
								</a>
							</DropdownMenu.Item>
						{/if}

						{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteTests)}
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

				{#if test.opensAt}
					<div class="flex items-center gap-1">
						<Calendar class="h-3 w-3" />
						<span>Отваря се: {dfShort.format(test.opensAt)}</span>
					</div>
				{/if}

				{#if test.closesAt}
					<div class="flex items-center gap-1">
						<Calendar class="h-3 w-3" />
						<span>Затваря се: {dfShort.format(test.closesAt)}</span>
					</div>
				{/if}
			</div>
		</div>
	</Card.Content>

	<Card.Footer>
		<div class="flex w-full gap-x-2 gap-y-3 items-center flex-wrap justify-between">
			<div class="flex items-center gap-2">
				{#if test.isPaid}
					<Badge variant="outline" class="bg-gray-50 text-gray-700"
						>{priceInCentsToRealPrice(test.priceInCents).toLocaleString('bg', {
							style: 'currency',
							currency: 'EUR'
						})}</Badge
					>
				{:else}
					<Badge variant="outline" class="bg-green-50 text-green-700">Безплатен</Badge>
				{/if}

				{#if test.publishedStatus === PublishedStatusEnum.published}
					<Badge variant="outline" class="bg-green-50 text-green-700"
						>{displayPublishedStatus(test.publishedStatus)}</Badge
					>
				{:else}
					<Badge variant="outline" class="bg-red-50 text-red-700 border-red-500"
						>{displayPublishedStatus(test.publishedStatus)}</Badge
					>
				{/if}
			</div>

			{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditTests)}
				<Button
					size="sm"
					variant="outline"
					href="/control-centre-v1/tests/{test.id}/edit"
					class="flex-1"
				>
					<SquarePen class="mr-2 h-4 w-4" />
					Редактирай
				</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteTests)}
	<ResponsiveDialog bind:open={openDelete} disabled={disabledDelete} closeButtonText="Отказ">
		{#snippet title()}
			Изтриване на тест
		{/snippet}

		{#snippet description()}
			Веднъж изтрит, тестът не може да бъде възстановен.
		{/snippet}

		{#snippet content()}
			<div>
				Сигурни ли сте, че искате да изтриете тест:
				<br />
				<span class="font-mono font-bold">{test.title}</span>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<Button
				disabled={disabledDelete}
				variant="destructive"
				type="submit"
				class="bg-destructive! text-destructive-foreground z-10 w-full"
				onclick={deleteCurrentTest}
			>
				Изтрий
			</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
