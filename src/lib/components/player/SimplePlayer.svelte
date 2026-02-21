<script lang="ts">
	import 'vidstack/bundle';
	import { BULGARIAN_PLAYER } from '.';
	import type { MediaLoadingStrategy, MediaPosterLoadingStrategy } from 'vidstack';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import { cn } from '$lib/utils';

	type Props = {
		src: string;
		poster?: string;
		class?: string;

		title?: string;

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
		poster,
		title,
		class: className = '',
		options = defaultOptions,
		noScrubGesture = false,
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

			player.preload = 'metadata';
		}
	});
</script>

<media-player
	{title}
	class={cn('aspect-video border-0!', className)}
	bind:this={player}
	playsInline
	preload="metadata"
	load={options.load}
	posterLoad={options.posterLoad}
	{src}
>
	<media-provider>
		{#if poster}
			<media-poster src={poster} class="vds-poster" alt={title}></media-poster>
		{/if}
	</media-provider>
	<media-video-layout {noScrubGesture} translations={BULGARIAN_PLAYER}> </media-video-layout>
</media-player>
