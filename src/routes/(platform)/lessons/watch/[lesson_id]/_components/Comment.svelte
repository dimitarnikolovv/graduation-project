<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import type { SessionValidationResult } from '$lib/server/auth';
	import { displayRole, RolesEnum } from '$lib/types/enums';
	import { DateFormatter } from '@internationalized/date';
	import {
		deleteCommentRemote,
		type GetLessonCommentsRemoteResponse
	} from '$lib/remote-functions/lessons.remote';
	import Button from '$lib/components/ui/button/button.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		comment: GetLessonCommentsRemoteResponse['comments'][number];
		user: SessionValidationResult['user'] | null;
	};

	let { comment, user }: Props = $props();

	let canDelete = $derived.by(() => {
		if (!user) return false;
		return user.id === comment.author.id || user.role === RolesEnum.admin;
	});

	const df = new DateFormatter('bg', {
		year: '2-digit',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	let openDelete = $state(false);
	let disabled = $state(false);

	async function deleteCurrentComment() {
		disabled = true;

		try {
			await deleteCommentRemote({
				commentId: comment.id
			});

			toast.success('Коментарът беше изтрит успешно.');
			await invalidateAll();
		} catch (err) {
			toast.error('Възникна грешка при изтриването на коментара.');
		} finally {
			disabled = false;
			openDelete = false;
		}
	}
</script>

<div class="rounded-md border p-4">
	<div class="flex items-center gap-3 justify-between flex-wrap">
		<div class="text-sm font-medium text-foreground">
			{comment.author.firstName}
			{comment.author.lastName}
			<time
				class="block text-muted-foreground text-[0.65rem]"
				datetime={comment.createdAt.toISOString()}>{df.format(comment.createdAt)}</time
			>
		</div>

		<div class="flex items-center gap-2">
			{#if comment.author.role}
				<Badge>{displayRole(comment.author.role)}</Badge>
			{/if}

			{#if canDelete}
				<Button
					variant="destructive"
					size="icon-sm"
					aria-label="Изтрий коментара"
					onclick={() => (openDelete = true)}
				>
					<Trash2 />
				</Button>
			{/if}
		</div>
	</div>
	<Separator class="my-2" />
	<p class="mt-2 text-foreground">{comment.content}</p>
</div>

{#if canDelete}
	<ResponsiveDialog bind:open={openDelete} {disabled} closeButtonText="Отказ">
		{#snippet title()}
			Изтриване на коментар
		{/snippet}

		{#snippet content()}
			<div>
				Сигурни ли сте, че искате да изтриете коментара:
				<br />
				<span class="font-mono font-bold">{comment.content}</span>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<Button
				{disabled}
				variant="destructive"
				type="submit"
				class="bg-destructive! text-destructive-foreground z-10 w-full"
				onclick={deleteCurrentComment}
			>
				Изтрий
			</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
