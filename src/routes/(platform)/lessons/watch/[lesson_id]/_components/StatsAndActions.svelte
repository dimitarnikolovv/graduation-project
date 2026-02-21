<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { SessionValidationResult } from '$lib/server/auth';
	import type { Lesson } from '$lib/server/db/schema/lessons';
	import { formatLargeNumber } from '$lib/utils/general';
	import Eye from '@lucide/svelte/icons/eye';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
	import { likeLessonRemote } from '$lib/remote-functions/lessons.remote';
	import { invalidateAll } from '$app/navigation';
	import { cn } from '$lib/utils';

	type Props = {
		viewCount: number;
		commentsCount: number;
		likesCount: number;
		user: SessionValidationResult['user'] | null;
		lessonId: Lesson['id'];
		isLikedByUser?: boolean;
	};

	let { viewCount, commentsCount, likesCount, user, lessonId, isLikedByUser }: Props = $props();

	let disabled = $state(false);

	async function likeLesson() {
		if (disabled || !user) return;

		disabled = true;

		try {
			await likeLessonRemote({
				lessonId
			});

			await invalidateAll();
		} catch (error) {
			console.error('Error liking lesson:', error);
		} finally {
			disabled = false;
		}
	}
</script>

<div class="mt-2 flex gap-6 justify-between items-center flex-wrap">
	<div>
		<Button
			variant="outline"
			size="sm"
			class="flex items-center gap-x-2 font-medium rounded-full px-4! relative"
			{disabled}
			onclick={likeLesson}
		>
			<ThumbsUp class={cn('size-5 mb-0.5', isLikedByUser ? 'fill-foreground' : '')} />
			<span class="block h-full w-px bg-muted"></span>
			<span>
				{formatLargeNumber(likesCount)}
			</span>
		</Button>
	</div>

	<div class="flex gap-6">
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger class="flex items-center gap-x-2 text-lg font-medium">
					<Eye />
					{viewCount.toLocaleString('bg')}
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>{viewCount.toLocaleString('bg')} гледания</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>

		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger class="flex items-center gap-x-2 text-lg font-medium">
					<MessageSquareText />
					{commentsCount}
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>{commentsCount} {commentsCount === 1 ? 'коментар' : 'коментара'}</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
</div>
