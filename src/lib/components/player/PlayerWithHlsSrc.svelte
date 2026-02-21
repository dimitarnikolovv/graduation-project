<script lang="ts">
	import 'vidstack/bundle';
	import { BULGARIAN_PLAYER } from '.';
	import type { MediaLoadingStrategy, MediaPosterLoadingStrategy } from 'vidstack';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import { cn } from '$lib/utils';

	type Props = {
		src: string;
		posterSrc?: string;

		chaptersSrc?: string;
		thumbnailsSrc?: string;

		title?: string;

		class?: string;

		isPlaying?: boolean;
		isStarted?: boolean;
		controlsVisible?: boolean;
		noScrubGesture?: boolean;

		options?: {
			posterLoad?: MediaPosterLoadingStrategy;
			load?: MediaLoadingStrategy;
		};
	};

	const defaultOptions: Props['options'] = {
		posterLoad: 'visible',
		load: 'visible'
	};

	let {
		src,
		posterSrc,
		chaptersSrc,
		thumbnailsSrc,
		title,
		class: className = '',
		noScrubGesture = false,
		options = defaultOptions,
		isPlaying = $bindable(false),
		isStarted = $bindable(false),
		controlsVisible = $bindable(false)
	}: Props = $props();

	let player: MediaPlayerElement | null = $state(null);

	options = { ...defaultOptions, ...options };

	$effect(() => {
		if (player) {
			player.subscribe(({ playing, controlsVisible: cv, started }) => {
				isPlaying = playing;
				isStarted = started;
				controlsVisible = cv;
			});
		}
	});
</script>

<media-player
	{title}
	bind:this={player}
	class={cn('aspect-video border-0!', className)}
	playsInline
	preload="metadata"
	load={options.load}
	posterLoad={options.posterLoad}
	{src}
>
	<media-provider>
		{#if chaptersSrc}
			<track src={chaptersSrc} srclang="bg" kind="chapters" default />
		{/if}

		{#if posterSrc}
			<media-poster src={posterSrc} class="vds-poster" alt={posterSrc}></media-poster>
		{/if}
	</media-provider>
	<media-video-layout
		{noScrubGesture}
		translations={BULGARIAN_PLAYER}
		thumbnails={thumbnailsSrc ? thumbnailsSrc : ''}
	>
	</media-video-layout>
</media-player>
