import { TimePeriod } from '$lib/types/enums';
import type { DateFormatter } from '@internationalized/date';
import {
	formatDuration,
	interval,
	intervalToDuration,
	isSameDay,
	isSameHour,
	isSameMonth
} from 'date-fns';
import { bg } from 'date-fns/locale';
import { getStartAndEndDates } from './statistics';

export type DateTruncUnit = 'day' | 'hour' | 'month';

export function isPeriodMatch(
	period: TimePeriod,
	start: Date,
	end: Date,
	expectedStart: Date,
	expectedEnd: Date
): boolean {
	switch (period) {
		case TimePeriod.Last24Hours:
			return isSameHour(start, expectedStart) && isSameHour(end, expectedEnd);
		case TimePeriod.Today:
		case TimePeriod.Yesterday:
			return isSameDay(start, expectedStart) && isSameDay(end, expectedEnd);
		case TimePeriod.Last7Days:
		case TimePeriod.ThisWeek:
		case TimePeriod.LastWeek:
			return isSameDay(start, expectedStart) && isSameDay(end, expectedEnd);
		case TimePeriod.ThisMonth:
		case TimePeriod.LastMonth:
		case TimePeriod.Last3Months:
		case TimePeriod.Last6Months:
		case TimePeriod.Last9Months:
			return isSameDay(start, expectedStart) && isSameDay(end, expectedEnd);
		case TimePeriod.ThisYear:
		case TimePeriod.LastYear:
			return isSameMonth(start, expectedStart) && isSameMonth(end, expectedEnd);
		default:
			return false;
	}
}

export function matchTimePeriodOrLabel(
	startDate: Date,
	endDate: Date,
	df: DateFormatter
): TimePeriod | string {
	for (const period of Object.values(TimePeriod) as TimePeriod[]) {
		const { startDate: expectedStart, endDate: expectedEnd } = getStartAndEndDates(period);

		const match = isPeriodMatch(period, startDate, endDate, expectedStart, expectedEnd);
		if (match) return period;
	}

	// If no match, return formatted range
	return `${df.format(startDate)} – ${df.format(endDate)}`;
}

/**
 * Formats a number of seconds into a human-readable duration string in Bulgarian.
 * Useful for countdowns or displaying remaining/elapsed time.
 *
 * @param seconds - The number of seconds to format
 * @param fallback - Value to return if seconds is 0 or negative (default: 'Вече')
 * @returns Formatted duration string (e.g., "2 дни 3 часа", "45 минути 30 секунди")
 */
export function formatSecondsDuration(seconds: number, fallback: string = 'Вече'): string {
	if (seconds <= 0) return fallback;

	const duration = intervalToDuration({ start: 0, end: seconds * 1000 });

	return formatDuration(duration, {
		format: ['days', 'hours', 'minutes', 'seconds'],
		locale: bg,
		delimiter: ' ',
		zero: false
	});
}

/**
 * Calculates and formats the duration between two dates in Bulgarian.
 * Useful for displaying how long something took (e.g., test attempt duration).
 *
 * @param startDate - The start date
 * @param endDate - The end date
 * @param fallback - Value to return if either date is null/undefined (default: '—')
 * @returns Formatted duration string (e.g., "1 час 23 минути 45 секунди")
 */
export function formatDateDuration(
	startDate: Date | null | undefined,
	endDate: Date | null | undefined,
	fallback: string = '—'
): string {
	if (!startDate || !endDate) return fallback;

	const dateInterval = interval(startDate, endDate);
	const duration = intervalToDuration(dateInterval);

	return formatDuration(duration, {
		format: ['days', 'hours', 'minutes', 'seconds'],
		locale: bg,
		delimiter: ' ',
		zero: false
	});
}

/**
 * Formats a time limit given in seconds into a human-readable string in Bulgarian.
 * If the time limit is 0, it indicates "Без ограничение" (No limit).
 *
 * @param seconds - The time limit in seconds
 * @returns Formatted time limit string (e.g., "1 ч. 30 мин.", "45 мин.", "Без ограничение")
 */
export function formatTimeLimit(seconds: number): string {
	if (seconds === 0) return 'Без ограничение';
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) {
		return `${hours} ч. ${minutes > 0 ? `${minutes} мин.` : ''}`;
	}
	return `${minutes} мин.`;
}
