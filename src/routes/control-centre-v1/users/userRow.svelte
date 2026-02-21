<script lang="ts">
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { Button } from '$lib/components/ui/button';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Copy from '@lucide/svelte/icons/copy';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import { DateFormatter } from '@internationalized/date';
	import type { User } from '$lib/server/db/schema/auth';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { displayRole, UserPermissionsEnum } from '$lib/types/enums';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	type Props = {
		user: Omit<User, 'passwordHash'>;
		userPermissions?: PermissionsObject;
	};
	let { user, userPermissions }: Props = $props();

	const isDeleted = user.deletedAt !== null;

	const df = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short'
	});
</script>

<div class="flex w-full flex-col items-start rounded-xl border text-left text-sm">
	<div
		class={cn(
			'bg-muted mb-1 flex w-full items-center justify-between gap-x-2 rounded-t-xl px-2 py-2 sm:px-4',
			isDeleted && 'bg-destructive text-destructive-foreground'
		)}
	>
		<div class="flex flex-wrap gap-x-2">
			<a href="/control-centre-v1/users/{user.id}" class="flex flex-wrap gap-x-2">
				<div class="font-semibold underline">
					{user.firstName}
					{user.lastName}
				</div>
			</a>

			<Badge class="h-5 px-2 text-xs font-medium">
				{#if user.role}
					{displayRole(user.role)}
				{:else}
					<span>Няма роля</span>
				{/if}
			</Badge>
		</div>

		{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.EditUsers)}
			<div class="ml-auto flex gap-2 text-xs">
				<Button
					variant="outline"
					class="h-7 w-7"
					size="icon"
					href="/control-centre-v1/users/{user.id}"
				>
					<SquarePen></SquarePen>
				</Button>
			</div>
		{/if}
	</div>

	{#if isDeleted && user.deletedAt}
		<div class="text-muted-foreground flex flex-wrap gap-x-2 px-2 text-xs sm:px-4">
			<span class="text-destructive">Заличен на:</span> <span>{df.format(user.deletedAt)}</span>
		</div>

		<Separator class="my-1"></Separator>
	{/if}

	<div class="px-2 sm:px-4 space-y-1">
		<div class="text-muted-foreground flex items-center gap-2 text-xs">
			<a href="mailto:{user.email}" class="hover:text-foreground transition-all">{user.email}</a>
		</div>
	</div>

	<Separator class="my-1"></Separator>

	<div class="px-2 pb-2 sm:px-4">
		<div class="text-muted-foreground flex items-center gap-2 text-xs">
			Потребителско ID: <span>{user.id}</span>
			<button
				onclick={() => {
					navigator.clipboard.writeText(user.id);
					toast.success('Потребителското ID е копирано в клипборда.');
				}}
				class="hover:text-foreground"
			>
				<Copy class="h-3 w-3"></Copy>
			</button>
		</div>
	</div>
</div>
