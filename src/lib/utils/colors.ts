export function determineTextColorFromGradientStops(
	colorFrom: string,
	colorTo: string,
	reverse: boolean = false
): string {
	// Simple algorithm to determine if the gradient is light or dark based on the average brightness
	const getBrightness = (hexColor: string): number => {
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);
		return (r * 299 + g * 587 + b * 114) / 1000;
	};

	const brightnessFrom = getBrightness(colorFrom);
	const brightnessTo = getBrightness(colorTo);
	const averageBrightness = (brightnessFrom + brightnessTo) / 2;

	const determinedColor = reverse
		? averageBrightness > 128
			? '#FFFFFF'
			: '#000000'
		: averageBrightness > 128
			? '#000000'
			: '#FFFFFF';

	return determinedColor;
}
