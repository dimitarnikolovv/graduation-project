<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { UserPermissionsEnum } from '$lib/types/enums.js';
	import type { PermissionsObject } from '$lib/types/permissions.js';
	import { checkIfUserHasPermission } from '$lib/utils/access-control.js';
	import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Users from '@lucide/svelte/icons/users';
	import Image from '@lucide/svelte/icons/image';
	import { toast } from 'svelte-sonner';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { DateFormatter } from '@internationalized/date';
	import { sliceLongText } from '$lib/utils/general';
	import { cn } from '$lib/utils';
	import type { PublicEvent } from '$lib/server/db/schema/publicEvents';
	import type { UploadedFile } from '$lib/server/db/schema/files';
	import { invalidateAll } from '$app/navigation';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';

	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { deletePublicEventRemote } from './actions.remote';

	type Props = {
		event: PublicEvent & {
			posterFile?: UploadedFile | null;
			entryCount: number;
		};
		userPermissions?: PermissionsObject;
	};

	let { event, userPermissions }: Props = $props();

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	const dfEventDate = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short',
		hour12: false
	});

	let disabled = $state(false);
	let openDelete = $state(false);

	async function deleteCurrentEvent() {
		disabled = true;

		try {
			const result = await deletePublicEventRemote({
				id: event.id
			});

			if (result.success) {
				toast.success(result.message);
				await invalidateAll();
				return;
			}

			toast.error(result.message);
		} catch (err) {
			console.error(err);

			toast.error('Възникна грешка при изтриването на събитието.');
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
						href="/control-centre-v1/public-events/{event.id}/edit"
						data-sveltekit-preload-data="tap"
						class="hover:text-primary flex items-start hover:underline"
					>
						{sliceLongText(event.name, 100)}
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
								navigator.clipboard.writeText(event.id);
								toast.success('ID-то на събитието беше копирано в клипборда.');
							}}
						>
							<ClipboardCopy class="h-4 w-4" /> Копирай ID
						</DropdownMenu.Item>

						{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditEvents)}
							<DropdownMenu.Item>
								<a
									href="/control-centre-v1/public-events/{event.id}/edit"
									class="flex w-full items-center gap-2"
								>
									<SquarePen class="max-w-4" /> Редактиране
								</a>
							</DropdownMenu.Item>
						{/if}

						{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteEvents)}
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

		{#if event.description}
			<div class="flex-1">
				<Card.Description class="line-clamp-3">
					<RenderStyledHtml renderInline={true} doProseStyling={false}>
						{@html sliceLongText(event.description, 150)}
					</RenderStyledHtml>
				</Card.Description>
			</div>
		{/if}
	</Card.Header>

	<Card.Content>
		<div class="space-y-3">
			{#if event.posterFile}
				<div class="relative aspect-video w-full overflow-hidden rounded-md">
					<img
						src="/api/file/{event.posterFile.fileKey}"
						alt={event.name}
						class="h-full w-full object-cover"
					/>
				</div>
			{:else}
				<div
					class="bg-muted flex aspect-video w-full items-center justify-center rounded-md border"
				>
					<Image class="text-muted-foreground h-12 w-12" />
				</div>
			{/if}

			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="secondary" class="text-xs">
					<Calendar class="mr-1 h-3 w-3" />
					{dfEventDate.format(new Date(event.date))}
				</Badge>

				<Badge variant="outline" class="text-xs">
					<Users class="mr-1 h-3 w-3" />
					{event.entryCount ?? 0} записани
				</Badge>
			</div>

			<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
				<div class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					<span>Създадено: {dfShort.format(event.createdAt)}</span>
				</div>
				<div class="flex items-center gap-1">
					<Calendar class="h-3 w-3" />
					<span>Редактирано: {dfShort.format(event.updatedAt)}</span>
				</div>
			</div>
		</div>
	</Card.Content>

	<Card.Footer>
		<div class="flex w-full items-center flex-wrap justify-between gap-2">
			<Button
				size="sm"
				variant="outline"
				href="/control-centre-v1/public-events/{event.id}/entries"
				class="flex flex-1 items-center gap-2"
			>
				<Users class="h-4 w-4" />
				Виж записани
			</Button>

			{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditEvents)}
				<Button
					size="sm"
					variant="outline"
					href="/control-centre-v1/public-events/{event.id}/edit"
					class="flex flex-1 items-center gap-2"
				>
					<SquarePen class="mr-2 h-4 w-4" />
					Редактирай
				</Button>
			{/if}
		</div>
	</Card.Footer>
</Card.Root>

{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.DeleteEvents)}
	<ResponsiveDialog bind:open={openDelete} closeButtonText="Отказ" {disabled}>
		{#snippet title()}
			Изтриване на събитие
		{/snippet}

		{#snippet description()}
			Веднъж изтрито, събитието не може да бъде възстановено.
		{/snippet}

		{#snippet content()}
			<div>
				Сигурни ли сте, че искате да изтриете събитие:
				<br />
				<span class="font-mono font-bold">{event.name}</span>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<Button
				{disabled}
				variant="destructive"
				class="bg-destructive! text-destructive-foreground z-10 w-full"
				onclick={async () => await deleteCurrentEvent()}
			>
				Изтрий
			</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
