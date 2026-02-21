<script lang="ts">
	/**
	 * CountdownTimer Component
	 *
	 * Displays a countdown timer for time-limited tests.
	 * Features:
	 * - Live updating countdown display
	 * - Visual warnings when time is running low (amber at 5 min, red at 1 min)
	 * - Callback when timer expires
	 * - Robust calculation based on elapsed time (handles tab inactivity)
	 * - Supports both time limit and test close time (uses earliest)
	 */

	import { onMount } from 'svelte';
	import Clock from '@lucide/svelte/icons/clock';
	import { cn } from '$lib/utils';

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		/** Total time limit in seconds for the test (0 = no time limit) */
		timeLimitSec: number;
		/** Timestamp when the attempt was started (used to calculate elapsed time) */
		startedAt: Date | string;
		/** Optional timestamp when the test closes (auto-submit when reached) */
		closesAt?: Date | string | null;
		/** Optional callback fired when the timer reaches zero */
		onExpire?: () => void;
	};

	let { timeLimitSec, startedAt, closesAt, onExpire }: Props = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	/** Current time remaining in seconds */
	let timeLeftSec = $state(0);

	/** Whether the timer is active (has either time limit or closes at) */
	let hasTimer = $state(false);

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	/**
	 * Converts the startedAt prop to milliseconds timestamp.
	 * Handles both Date objects and string formats.
	 *
	 * @returns Milliseconds timestamp of when the attempt started
	 */
	function getStartedAtMs() {
		return new Date(startedAt).getTime();
	}

	/**
	 * Gets the effective end time in milliseconds.
	 * Uses the earliest of:
	 * - startedAt + timeLimitSec (if timeLimitSec > 0)
	 * - closesAt (if set)
	 *
	 * @returns End time in milliseconds, or null if no constraints
	 */
	function getEffectiveEndTimeMs(): number | null {
		const candidates: number[] = [];

		// Add time limit deadline if set
		if (timeLimitSec > 0) {
			candidates.push(getStartedAtMs() + timeLimitSec * 1000);
		}

		// Add closesAt deadline if set
		if (closesAt) {
			candidates.push(new Date(closesAt).getTime());
		}

		if (candidates.length === 0) return null;

		// Return the earliest deadline
		return Math.min(...candidates);
	}

	/**
	 * Calculates the remaining time based on the effective end time.
	 * This approach is robust against tab inactivity - if the user switches tabs,
	 * the timer will still show the correct time when they return.
	 *
	 * @returns Remaining seconds (minimum 0)
	 */
	function calculateTimeLeft(): number {
		const endTimeMs = getEffectiveEndTimeMs();
		if (endTimeMs === null) return 0;

		const remainingMs = endTimeMs - Date.now();
		return Math.max(0, Math.floor(remainingMs / 1000));
	}

	/**
	 * Formats seconds into a human-readable time string.
	 * Shows hours only if more than 60 minutes remain.
	 *
	 * @param totalSeconds - Total seconds to format
	 * @returns Formatted time string (e.g., "05:30" or "1:05:30")
	 */
	function formatTime(totalSeconds: number) {
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		}
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/** True when less than 1 minute remains (triggers red pulsing animation) */
	const isLow = $derived(timeLeftSec <= 60);

	/** True when between 1-5 minutes remain (triggers amber warning color) */
	const isWarning = $derived(timeLeftSec <= 300 && timeLeftSec > 60);

	// ============================================================================
	// LIFECYCLE
	// ============================================================================

	onMount(() => {
		// Check if we have any time constraint
		const endTimeMs = getEffectiveEndTimeMs();
		if (endTimeMs === null) {
			hasTimer = false;
			return;
		}

		hasTimer = true;

		// Calculate initial time left
		timeLeftSec = calculateTimeLeft();

		// Set up interval to update every second
		const interval = setInterval(() => {
			timeLeftSec = calculateTimeLeft();

			// Fire callback and stop timer when time expires
			if (timeLeftSec <= 0) {
				clearInterval(interval);
				onExpire?.();
			}
		}, 1000);

		// Cleanup interval on component unmount
		return () => clearInterval(interval);
	});
</script>

<!-- Timer display (only rendered if there's a time constraint) -->
{#if hasTimer}
	<div
		class={cn(
			'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
			isLow
				? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 animate-pulse'
				: isWarning
					? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
					: 'bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
		)}
	>
		<Clock class="h-4 w-4" />
		<span>{formatTime(timeLeftSec)}</span>
	</div>
{/if}
