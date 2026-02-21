<script lang="ts">
	import Player from '$lib/components/player/Player.svelte';
	import { VideoStatusEnum } from '$lib/types/enums';
	import type { ExpandedVideo } from '$lib/types/videos';
	import { DateFormatter } from '@internationalized/date';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/form';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	type Props = {
		video: ExpandedVideo;

		disabled: boolean;
		selectedVideoId: string | null;

		onVideoSelect?: (video: ExpandedVideo) => void;
	};

	let { video, disabled, selectedVideoId = $bindable(null), onVideoSelect }: Props = $props();

	const dfShort = new DateFormatter('bg', {
		dateStyle: 'short',
		timeStyle: 'short',
		hour12: false
	});

	let isPlaying = $state(false);
	let isStarted = $state(false);
	let controlsVisible = $state(false);
</script>

<div class="group">
	<div class="relative m-auto aspect-video">
		<div
			class="bg-background absolute inset-2 grid place-content-center rounded-md border border-dashed"
		>
			<LoaderCircle class="text-primary h-12 w-12 animate-spin" />
		</div>
		<Player {video} bind:isPlaying bind:controlsVisible bind:isStarted></Player>

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

	<div>
		{#if selectedVideoId === video.id}
			<div
				class="inline-flex h-8 w-full items-center justify-center rounded-md border bg-green-50 px-4 py-1 text-sm font-medium text-green-700"
			>
				Избрано
			</div>
		{:else if selectedVideoId !== null}
			<Button
				class="w-full"
				variant="default"
				{disabled}
				size="sm"
				onclick={() => {
					selectedVideoId = video.id;

					if (onVideoSelect) {
						onVideoSelect(video);
					}
				}}
			>
				Избери
			</Button>
		{/if}
		<div class="flex items-center justify-between gap-2">
			<h3>
				{video.displayName}
			</h3>
		</div>
		<div class="text-muted-foreground flex flex-wrap justify-between text-sm">
			<p>{video.uploadedByUser?.firstName} {video.uploadedByUser?.lastName}</p>
			<p>от {dfShort.format(video.createdAt)}</p>
		</div>
	</div>
</div>
