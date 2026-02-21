<script lang="ts">
	import 'vidstack/bundle';
	import { BULGARIAN_PLAYER } from '.';
	import type { ExpandedVideo } from '$lib/types/videos';
	import type { MediaLoadingStrategy, MediaPosterLoadingStrategy } from 'vidstack';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import { cn } from '$lib/utils';

	type Props = {
		video: Required<Pick<ExpandedVideo, 'fileKey' | 'id'>> & Partial<ExpandedVideo>;
		title?: string;
		class?: string;

		storageKey?: string;

		isPlaying?: boolean;
		isStarted?: boolean;
		controlsVisible?: boolean;
		noScrubGesture?: boolean;

		// Video progress tracking
		currentTime?: number;
		duration?: number;
		initialTime?: number; // Start video from this time (in seconds)

		// Expose player element
		player?: MediaPlayerElement | null;

		options?: {
			posterLoad?: MediaPosterLoadingStrategy;
			load?: MediaLoadingStrategy;
			preload?: 'none' | 'metadata' | 'auto';
		};
	};

	const defaultOptions: Props['options'] = {
		posterLoad: 'visible',
		load: 'visible',
		preload: 'metadata'
	};

	let {
		video,
		title,
		storageKey,
		class: className = '',
		options = defaultOptions,
		noScrubGesture = false,
		isPlaying = $bindable(false),
		isStarted = $bindable(false),
		controlsVisible = $bindable(false),
		currentTime = $bindable(0),
		duration = $bindable(0),
		initialTime = 0,
		player = $bindable()
	}: Props = $props();

	options = { ...defaultOptions, ...options };

	$effect(() => {
		if (player) {
			player.subscribe(
				({ playing, controlsVisible: cv, started, currentTime: ct, duration: dur }) => {
					isPlaying = playing;
					isStarted = started;
					controlsVisible = cv;
					currentTime = ct;
					duration = dur;
				}
			);

			if (options.preload) {
				player.preload = options.preload;
			}

			if (options.load) {
				player.load = options.load;
			}

			if (options.posterLoad) {
				player.posterLoad = options.posterLoad;
			}

			// Set initial time if provided (resume from last position)
			if (initialTime > 0) {
				player.currentTime = initialTime;
			}
		}
	});
</script>

<media-player
	title={title ?? video.displayName}
	bind:this={player}
	class={cn('aspect-video overflow-hidden rounded-lg border-0!', className)}
	storage={storageKey}
	playsInline
	load={options.load}
	posterLoad={options.posterLoad}
	preload={options.preload}
	src="/api/hls/stream/{video.id}/{video.fileKey}"
>
	<media-provider>
		{#if video.chaptersFile}
			<track src="/api/file/{video.chaptersFile.fileKey}" srclang="bg" kind="chapters" default />
		{/if}

		{#if video.posterFile}
			<media-poster
				src="/api/file/{video.posterFile.fileKey}"
				class="vds-poster"
				alt={video.posterFile.displayName}
			></media-poster>
		{/if}
	</media-provider>
	<media-video-layout
		{noScrubGesture}
		translations={BULGARIAN_PLAYER}
		thumbnails={video.thumbnailsKey ? `/api/hls/stream/${video.id}/${video.thumbnailsKey}` : ''}
	>
	</media-video-layout>
</media-player>
