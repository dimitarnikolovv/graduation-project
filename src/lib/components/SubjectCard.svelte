<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { cn } from '$lib/utils';
	import { determineTextColorFromGradientStops } from '$lib/utils/colors';

	type Props = {
		colorFrom?: string | null;
		colorTo?: string | null;
		name: string;
		countOfLessons: number;
		labelSingular?: string;
		labelPlural?: string;
	};

	let {
		colorFrom,
		colorTo,
		name,
		countOfLessons,
		labelSingular = 'урок',
		labelPlural = 'урока'
	}: Props = $props();
</script>

<div
	class={cn('h-20 bg-linear-to-tr md:h-24 relative from-orange-500 to-red-400')}
	style={colorFrom && colorTo
		? `background: linear-gradient(to right top, ${colorFrom}, ${colorTo})`
		: ''}
>
	<div class="absolute inset-0 bg-black/10"></div>
	<div class="absolute top-3 left-3 md:top-4 md:left-4">
		<div class="flex items-center gap-2 text-xl md:text-2xl">
			<!-- {getSubjectIcon(subject.name)} -->
			<span
				class="block truncate text-base font-semibold text-white transition-colors md:text-lg"
				style={colorFrom && colorTo
					? `color: ${determineTextColorFromGradientStops(colorFrom, colorTo)}`
					: ''}
			>
				{name}
			</span>
		</div>
	</div>
	<div class="absolute bottom-2 left-3 md:left-4">
		<Badge
			variant="secondary"
			class="border-0 bg-white/20 text-xs text-white"
			style={colorFrom && colorTo
				? `color: ${determineTextColorFromGradientStops(colorFrom, colorTo)};
											background: ${determineTextColorFromGradientStops(colorFrom, colorTo, true)};
											`
				: ''}
		>
			{countOfLessons}
			{countOfLessons === 1 ? labelSingular : labelPlural}
		</Badge>
	</div>
</div>
