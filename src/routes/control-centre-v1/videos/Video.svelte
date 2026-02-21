<script lang="ts">
	import Player from '$lib/components/player/Player.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { UserPermissionsEnum, VideoStatusEnum } from '$lib/types/enums';
	import type { PermissionsObject } from '$lib/types/permissions';
	import type { ExpandedVideo } from '$lib/types/videos';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { DateFormatter } from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { Badge } from '$lib/components/ui/badge';
	import { deleteVideoRemote } from './videos.remote';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		video: ExpandedVideo;
		userPermissions?: PermissionsObject;
	};

	let { video, userPermissions }: Props = $props();

	let openDelete = $state(false);
	const isDesktop = new MediaQuery('(min-width: 768px)');

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	let isPlaying = $state(false);
	let isStarted = $state(false);
	let controlsVisible = $state(false);

	let disabled = $state(false);

	async function deleteCurrentVideo() {
		disabled = true;

		try {
			await deleteVideoRemote({
				id: video.id
			});

			toast.success('Видеото беше изтрито успешно.');
			await invalidateAll();
		} catch (err) {
			toast.error('Възникна грешка при изтриването на видеото.');
		} finally {
			disabled = false;
			openDelete = false;
		}
	}
</script>

<div class="group">
	<div class="relative m-auto aspect-video">
		<div
			class="bg-background absolute inset-2 grid place-content-center rounded-md border border-dashed"
		>
			<LoaderCircle class="text-primary h-12 w-12 animate-spin" />
		</div>
		<Player {video} bind:isPlaying bind:controlsVisible bind:isStarted options={{ load: 'play' }}
		></Player>

		{#if !isPlaying && (!controlsVisible || !isStarted)}
			{#if video.status === VideoStatusEnum.processing}
				<div
					class="absolute inset-0 z-40 mb-1 flex items-center justify-center rounded-md bg-black/50 text-white"
				>
					<div class="animate-pulse text-center">
						<p class="mb-2 text-lg font-medium">Видеото се обработва...</p>
						<p class="text-sm">Моля, изчакайте няколко минути и опреснете страницата.</p>
					</div>
				</div>
			{:else if video.status === VideoStatusEnum.failed}
				<div
					class="absolute inset-0 z-40 flex items-center justify-center bg-red-600/80 text-white"
				>
					<div class="text-center">
						<p class="mb-2 text-lg font-medium">Обработката на видеото е неуспешна.</p>
						<p class="text-sm">Моля, изтрийте видеото и опитайте да го качите отново.</p>
					</div>
				</div>
			{/if}
			{#if video.subject}
				<Badge class="absolute top-2 left-2 z-40">{video.subject.name}</Badge>
			{/if}

			{#if video.classGrade}
				<Badge class="absolute top-2 right-2 z-40">{video.classGrade.name}</Badge>
			{/if}
		{/if}
	</div>

	<div class="px-1">
		<div class="flex items-center justify-between gap-2">
			<h3>
				<a href="/control-centre-v1/videos/edit/{video.id}" class="hover:underline">
					{video.displayName}</a
				>
			</h3>

			<div class="flex items-center gap-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} class="h-6 px-1! py-0.5!" variant="ghost"><Ellipsis /></Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56" align="start">
						<DropdownMenu.Label>Действия</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item
								class="cursor-pointer"
								onclick={() => {
									navigator.clipboard.writeText(video.id);
									toast.success('ID-то на видеото беше копирано в клипборда.');
								}}
							>
								<ClipboardCopy class="max-w-4" /> Копирай ID
							</DropdownMenu.Item>

							{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditVideos)}
								<DropdownMenu.Item>
									<a
										href="/control-centre-v1/videos/edit/{video.id}"
										class="flex items-center gap-2"
									>
										<SquarePen class="max-w-4" /> Редактиране
									</a>
								</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Group>

						{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteVideos)}
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
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
		<div class="text-muted-foreground flex flex-wrap justify-between text-sm">
			<p>{video.uploadedByUser?.firstName} {video.uploadedByUser?.lastName}</p>
			<p>от {dfShort.format(video.createdAt)}</p>
		</div>
	</div>
</div>

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteVideos)}
	{#if isDesktop.current}
		<Dialog.Root bind:open={openDelete}>
			<Dialog.Content class="sm:max-w-106.25">
				<Dialog.Header>
					<Dialog.Title>Изтриване на видео</Dialog.Title>
					<Dialog.Description>
						Веднъж изтрито, видеото не може да бъде възстановено.
					</Dialog.Description>
				</Dialog.Header>
				<div class="space-y-6">
					<div>Сигурни ли сте, че искате да изтриете това видео?</div>
					<div class="grid grid-cols-2 gap-2">
						<Button
							{disabled}
							variant="destructive"
							type="submit"
							class="bg-destructive! text-destructive-foreground z-10 w-full"
							onclick={deleteCurrentVideo}
						>
							Изтрий
						</Button>

						<Button variant="outline" onclick={() => (openDelete = false)}>Отказ</Button>
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<Drawer.Root bind:open={openDelete}>
			<Drawer.Content>
				<Drawer.Header class="text-left">
					<Drawer.Title>Изтриване на видео</Drawer.Title>
					<Drawer.Description>
						Веднъж изтрито, видеото не може да бъде възстановено.
					</Drawer.Description>
				</Drawer.Header>
				<div class="space-y-6 px-4">
					<div>Сигурни ли сте, че искате да изтриете това видео?</div>
					<Button
						{disabled}
						variant="destructive"
						type="submit"
						onclick={deleteCurrentVideo}
						class="bg-destructive! text-destructive-foreground z-10 w-full"
					>
						Изтрий
					</Button>
				</div>
				<Drawer.Footer class="pt-2">
					<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Отказ</Drawer.Close>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{/if}
