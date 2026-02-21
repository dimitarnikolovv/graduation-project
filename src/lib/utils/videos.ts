export function getVideoDuration(file: File): Promise<number> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		video.preload = 'metadata';

		video.onloadedmetadata = () => {
			URL.revokeObjectURL(video.src);
			resolve(video.duration); // in seconds (float)
		};

		video.onerror = reject;
		video.src = URL.createObjectURL(file);
	});
}

/**
 *
 * @param seconds
 * @returns A string in the format "mm:ss" or "HH:mm:ss"
 *
 * Converts seconds to a time string in the format "HH:mm:ss".
 * If the total seconds are less than 3600, it returns "mm:ss".
 * If the total seconds are 3600 or more, it returns "HH:mm:ss".
 *
 * @example secondsToTimeString(61) // returns "01:01"
 *
 * @example secondsToTimeString(3661) // returns "01:01:01"
 */
export function secondsToTimeString(seconds: number): string {
	const totalSeconds = Math.floor(seconds);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const secs = totalSeconds % 60;

	if (hours > 0) {
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	} else {
		return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
}

export function bytesToHumanReadable(value: number): string {
	if (value < 0) {
		return '0B';
	}

	const units = [
		{ suffix: 'TB', divisor: 1_000_000_000_000 },
		{ suffix: 'GB', divisor: 1_000_000_000 },
		{ suffix: 'MB', divisor: 1_000_000 },
		{ suffix: 'KB', divisor: 1_000 },
		{ suffix: 'B', divisor: 1 }
	];

	for (const { suffix, divisor } of units) {
		if (value >= divisor) {
			return `${(value / divisor).toFixed(2)}${suffix}`;
		}
	}

	return '0B';
}
