import { TimePeriod } from '$lib/types/enums';
import { DateFormatter } from '@internationalized/date';
import {
	startOfDay,
	endOfDay,
	subDays,
	subMonths,
	subYears,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	startOfYear,
	endOfYear,
	isBefore,
	isEqual,
	startOfHour,
	addHours,
	addDays,
	addMonths,
	subWeeks
} from 'date-fns';
import type { DateTruncUnit } from './datetime';

export function getStartAndEndDates(period: TimePeriod): { startDate: Date; endDate: Date } {
	const now = new Date();
	let startDate: Date;
	let endDate: Date;

	switch (period) {
		case TimePeriod.Last24Hours:
			// Start of the hour 24 hours ago
			startDate = addHours(startOfHour(subDays(now, 1)), 1);
			endDate = addHours(startOfHour(now), 1);
			break;

		case TimePeriod.Today:
			startDate = startOfDay(now);
			endDate = endOfDay(now);
			break;

		case TimePeriod.Yesterday:
			startDate = startOfDay(subDays(now, 1));
			endDate = endOfDay(subDays(now, 1));
			break;

		case TimePeriod.Last7Days:
			startDate = startOfDay(subDays(now, 6)); // Starts 6 days ago, including today
			endDate = endOfDay(now);
			break;

		case TimePeriod.ThisWeek:
			startDate = startOfWeek(now, { weekStartsOn: 1 });
			endDate = endOfDay(now);
			break;

		case TimePeriod.LastWeek:
			startDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
			endDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
			break;

		case TimePeriod.ThisMonth:
			startDate = startOfMonth(now);
			endDate = endOfMonth(now);
			break;

		case TimePeriod.LastMonth:
			startDate = startOfMonth(subMonths(now, 1));
			endDate = endOfMonth(subMonths(now, 1));
			break;

		case TimePeriod.Last3Months:
			startDate = startOfMonth(subMonths(now, 3));
			endDate = endOfMonth(now);
			break;

		case TimePeriod.Last6Months:
			startDate = startOfMonth(subMonths(now, 6));
			endDate = endOfMonth(now);
			break;

		case TimePeriod.Last9Months:
			startDate = startOfMonth(subMonths(now, 9));
			endDate = endOfMonth(now);
			break;

		case TimePeriod.ThisYear:
			startDate = startOfYear(now);
			endDate = endOfYear(now);
			break;

		case TimePeriod.LastYear:
			startDate = startOfYear(subYears(now, 1));
			endDate = endOfYear(subYears(now, 1));
			break;

		default:
			throw new Error('Invalid time period');
	}

	// console.log(startDate.toLocaleString('bg'), endDate.toLocaleString('bg'));

	return { startDate, endDate };
}

export function segmentTimePeriod(startDate: Date, endDate: Date, period: TimePeriod): Date[] {
	const segments: Date[] = [];
	let current = startDate; // Force to UTC Midnight

	if (period === TimePeriod.Last24Hours) {
		// Hourly segments
		current = startDate;
	}

	while (isBefore(current, endDate) || isEqual(current, endDate)) {
		segments.push(current);
		if (
			period === TimePeriod.Today ||
			period === TimePeriod.Yesterday ||
			period === TimePeriod.Last24Hours
		) {
			// Hourly segments
			current = addHours(current, 1);
		} else if (
			period === TimePeriod.Last7Days ||
			period === TimePeriod.LastWeek ||
			period === TimePeriod.ThisWeek ||
			period === TimePeriod.ThisMonth ||
			period === TimePeriod.LastMonth
		) {
			// Daily segments
			current = addDays(current, 1);
		} else {
			// Monthly segments
			current = addMonths(current, 1);
		}
	}

	return segments;
}

export function formatSegmentLabel(segment: Date, period: TimePeriod): string {
	if (
		period === TimePeriod.Today ||
		period === TimePeriod.Yesterday ||
		period === TimePeriod.Last24Hours
	) {
		// Hourly format (e.g., "08:00", "15:00")
		const formatter = new DateFormatter('bg', {
			hour: '2-digit',
			minute: '2-digit'
		});

		return formatter.format(segment);
	} else if (
		period === TimePeriod.Last7Days ||
		period === TimePeriod.LastWeek ||
		period === TimePeriod.ThisMonth ||
		period === TimePeriod.LastMonth ||
		period === TimePeriod.ThisWeek
	) {
		// Daily format (e.g., "Feb 1")
		const formatter = new DateFormatter('bg', { month: 'short', day: 'numeric' });

		return formatter.format(segment);
	} else {
		// Monthly format (e.g., "Feb 2024")
		const formatter = new DateFormatter('bg', { month: 'short', year: 'numeric' });

		return formatter.format(segment);
	}
}

export function getDateTruncUnitFromPeriod(period: TimePeriod): DateTruncUnit {
	if (
		period === TimePeriod.Today ||
		period === TimePeriod.Yesterday ||
		period === TimePeriod.Last24Hours
	) {
		return 'hour';
	}

	if (
		period === TimePeriod.ThisWeek ||
		period === TimePeriod.LastWeek ||
		period === TimePeriod.Last7Days ||
		period === TimePeriod.ThisMonth ||
		period === TimePeriod.LastMonth
	) {
		return 'day';
	}

	return 'month';
}

export function getPreviousPeriod(
	currentStart: Date,
	currentEnd: Date,
	period: TimePeriod
): { previousStartDate: Date; previousEndDate: Date } {
	switch (period) {
		case TimePeriod.Today:
			return {
				previousStartDate: startOfDay(subDays(currentStart, 1)),
				previousEndDate: endOfDay(subDays(currentStart, 1))
			};

		case TimePeriod.Yesterday:
			return {
				previousStartDate: startOfDay(subDays(currentStart, 1)),
				previousEndDate: endOfDay(subDays(currentStart, 1))
			};

		case TimePeriod.Last24Hours:
			return {
				previousStartDate: subDays(currentStart, 1),
				previousEndDate: subDays(currentEnd, 1)
			};

		case TimePeriod.Last7Days:
			return {
				previousStartDate: subDays(currentStart, 7),
				previousEndDate: subDays(currentEnd, 7)
			};

		case TimePeriod.ThisWeek:
			return {
				previousStartDate: startOfWeek(subWeeks(currentStart, 1), { weekStartsOn: 1 }),
				previousEndDate: endOfWeek(subWeeks(currentStart, 1), { weekStartsOn: 1 })
			};

		case TimePeriod.LastWeek:
			return {
				previousStartDate: startOfWeek(subWeeks(currentStart, 1), { weekStartsOn: 1 }),
				previousEndDate: endOfWeek(subWeeks(currentStart, 1), { weekStartsOn: 1 })
			};

		case TimePeriod.ThisMonth:
			return {
				previousStartDate: startOfMonth(subMonths(currentStart, 1)),
				previousEndDate: endOfMonth(subMonths(currentStart, 1))
			};

		case TimePeriod.LastMonth:
			return {
				previousStartDate: startOfMonth(subMonths(currentStart, 1)),
				previousEndDate: endOfMonth(subMonths(currentStart, 1))
			};

		case TimePeriod.Last3Months:
			return {
				previousStartDate: startOfMonth(subMonths(currentStart, 3)),
				previousEndDate: endOfMonth(subMonths(currentStart, 3))
			};

		case TimePeriod.Last6Months:
			return {
				previousStartDate: startOfMonth(subMonths(currentStart, 6)),
				previousEndDate: endOfMonth(subMonths(currentStart, 6))
			};

		case TimePeriod.Last9Months:
			return {
				previousStartDate: startOfMonth(subMonths(currentStart, 9)),
				previousEndDate: endOfMonth(subMonths(currentStart, 9))
			};

		case TimePeriod.ThisYear:
			return {
				previousStartDate: startOfYear(subYears(currentStart, 1)),
				previousEndDate: endOfYear(subYears(currentStart, 1))
			};

		case TimePeriod.LastYear:
			return {
				previousStartDate: startOfYear(subYears(currentStart, 1)),
				previousEndDate: endOfYear(subYears(currentStart, 1))
			};

		default: {
			// fallback: use same duration logic
			const diff = currentEnd.getTime() - currentStart.getTime();
			const previousEndDate = new Date(currentStart.getTime());
			const previousStartDate = new Date(previousEndDate.getTime() - diff);
			return {
				previousStartDate,
				previousEndDate
			};
		}
	}
}
