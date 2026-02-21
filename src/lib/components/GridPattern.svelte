<script lang="ts">
	import { cn } from '$lib/utils';
	import { Motion } from 'svelte-motion';

	type Props = {
		yOffset: number;
		interactive: boolean;
		class?: string;
	};

	let { yOffset = 0, interactive = false, class: className = '' }: Props = $props();

	let svgRef: SVGElement | null = null;
	let currentBlock: [number, number] | undefined = undefined;
	let counter = 0;

	const staticBlocks: [number, number][] = [
		[-1, 0],
		[-3, 1],
		[-5, 0],
		[-6, 1],
		[-7, 0],
		[4, 0],
		[0, 1],
		[1, 1],
		[2, 2],
		[4, 3],
		[6, 2],
		[7, 4],
		[5, 5],
		[0, 5]
	];

	// Each hovered block: [x, y, key]
	let hoveredBlocks: Array<[number, number, number]> = $state([]);

	const ANIMATION_DURATION = 1; // seconds

	function onMouseMove(event: MouseEvent) {
		if (!svgRef || !interactive) return;

		const rect = svgRef.getBoundingClientRect();
		let x = event.clientX - rect.left;
		let y = event.clientY - rect.top;

		if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

		x = x - rect.width / 2 - 32;
		y = y - yOffset;
		x += Math.tan(32 / 160) * y;

		const gridX = Math.floor(x / 96);
		const gridY = Math.floor(y / 160);

		// Ignore if still on the same block
		if (currentBlock?.[0] === gridX && currentBlock?.[1] === gridY) return;
		currentBlock = [gridX, gridY];

		// Prevent duplicates
		const alreadyExists = hoveredBlocks.some(([hx, hy]) => hx === gridX && hy === gridY);
		if (alreadyExists) return;

		hoveredBlocks = [...hoveredBlocks, [gridX, gridY, counter++]];
	}
</script>

<svelte:window on:mousemove={onMouseMove} />

<svg bind:this={svgRef} aria-hidden="true" class={cn('', className)}>
	<rect width="100%" height="100%" fill="url(#gridPattern)" stroke-width="0" />
	<svg x="50%" y={yOffset} stroke-width="0" class="overflow-visible">
		{#each staticBlocks as [x, y]}
			<Motion isSVG={true}>
				<path
					class="fill-muted/50"
					transform={`translate(${-32 * y + 96 * x} ${160 * y})`}
					d="M45.119 4.5a11.5 11.5 0 0 0-11.277 9.245l-25.6 128C6.82 148.861 12.262 155.5 19.52 155.5h63.366a11.5 11.5 0 0 0 11.277-9.245l25.6-128c1.423-7.116-4.02-13.755-11.277-13.755H45.119Z"
				/>
			</Motion>
		{/each}

		{#each hoveredBlocks as [x, y, key] (key)}
			<Motion
				isSVG={true}
				animate={{ opacity: [0, 1, 0] }}
				transition={{ duration: ANIMATION_DURATION, times: [0, 0, 1] }}
				onAnimationComplete={() => {
					hoveredBlocks = hoveredBlocks.filter((b) => b[2] !== key);
				}}
				let:motion
			>
				{/* @ts-expect-error - Valid */ null}
				<path
					use:motion
					class="fill-muted/50"
					transform={`translate(${-32 * y + 96 * x} ${160 * y})`}
					d="M45.119 4.5a11.5 11.5 0 0 0-11.277 9.245l-25.6 128C6.82 148.861 12.262 155.5 19.52 155.5h63.366a11.5 11.5 0 0 0 11.277-9.245l25.6-128c1.423-7.116-4.02-13.755-11.277-13.755H45.119Z"
				/>
			</Motion>
		{/each}
	</svg>

	<defs>
		<pattern
			id="gridPattern"
			width="96"
			height="480"
			x="50%"
			patternUnits="userSpaceOnUse"
			patternTransform={`translate(0 ${yOffset})`}
			fill="none"
		>
			<path
				class="stroke-muted"
				d="M128 0 98.572 147.138A16 16 0 0 1 82.883 160H13.117a16 16 0 0 0-15.69 12.862l-26.855 134.276A16 16 0 0 1-45.117 320H-116M64-160 34.572-12.862A16 16 0 0 1 18.883 0h-69.766a16 16 0 0 0-15.69 12.862l-26.855 134.276A16 16 0 0 1-109.117 160H-180M192 160l-29.428 147.138A15.999 15.999 0 0 1 146.883 320H77.117a16 16 0 0 0-15.69 12.862L34.573 467.138A16 16 0 0 1 18.883 480H-52M-136 480h58.883a16 16 0 0 0 15.69-12.862l26.855-134.276A16 16 0 0 1-18.883 320h69.766a16 16 0 0 0 15.69-12.862l26.855-134.276A16 16 0 0 1 109.117 160H192M-72 640h58.883a16 16 0 0 0 15.69-12.862l26.855-134.276A16 16 0 0 1 45.117 480h69.766a15.999 15.999 0 0 0 15.689-12.862l26.856-134.276A15.999 15.999 0 0 1 173.117 320H256M-200 320h58.883a15.999 15.999 0 0 0 15.689-12.862l26.856-134.276A16 16 0 0 1-82.883 160h69.766a16 16 0 0 0 15.69-12.862L29.427 12.862A16 16 0 0 1 45.117 0H128"
			/>
		</pattern>
	</defs>
</svg>
