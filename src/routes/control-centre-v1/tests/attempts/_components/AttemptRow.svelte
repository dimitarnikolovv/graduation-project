<script lang="ts">
	/**
	 * AttemptRow Component
	 *
	 * Displays a single attempt in a table row format with key information
	 * and action buttons for grading.
	 */

	import { Button } from '$lib/components/ui/button';
	import { displayAttemptStatus, RolesEnum, type AttemptStatusEnum } from '$lib/types/enums';
	import { cn } from '$lib/utils';
	import { formatDateDuration } from '$lib/utils/datetime';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Clock from '@lucide/svelte/icons/clock';
	import { deleteAttemptRemote } from '../attempts.remote';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';

	// ============================================================================
	// TYPES
	// ============================================================================

	type Attempt = {
		id: string;
		attemptNumber: number;
		status: AttemptStatusEnum;
		startedAt: Date;
		submittedAt: Date | null;
		gradedAt: Date | null;
		totalScore: number;
		user: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
		};
		test: {
			id: string;
			title: string;
			maxScore: number;
		};
	};

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		attempt: Attempt;
		showGradeButton?: boolean;
	};

	let { attempt, showGradeButton = true }: Props = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let isDeleting = $state(false);
	let openDelete = $state(false);

	// Check if user is admin (for delete permission)
	const isAdmin = $derived(page.data.user?.role === RolesEnum.admin);

	// ============================================================================
	// HELPERS
	// ============================================================================

	/**
	 * Formats a date to a readable string.
	 */
	function formatDate(date: Date | string | null): string {
		if (!date) return '—';
		const d = new Date(date);
		return d.toLocaleDateString('bg-BG', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * Calculates score percentage.
	 */
	function getScorePercentage(): number {
		if (!attempt.test.maxScore) return 0;
		return Math.round((attempt.totalScore / attempt.test.maxScore) * 100);
	}

	/**
	 * Calculates and formats the duration between startedAt and submittedAt.
	 */
	function getDuration(): string {
		return formatDateDuration(attempt.startedAt, attempt.submittedAt);
	}

	/**
	 * Handles attempt deletion.
	 */
	async function handleDelete() {
		isDeleting = true;
		try {
			await deleteAttemptRemote({ attemptId: attempt.id });
			toast.success('Опитът беше изтрит успешно.');
			await invalidateAll();
		} catch (err) {
			console.error('Error deleting attempt:', err);
			toast.error('Възникна грешка при изтриването на опита.');
		} finally {
			isDeleting = false;
			openDelete = false;
		}
	}
</script>

<div
	class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
>
	<!-- Header: User info + badges + actions -->
	<div class="flex items-start justify-between gap-3">
		<!-- User info and badges -->
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap lg:items-center gap-2">
				<!-- User name -->
				<span class="font-semibold text-gray-900 dark:text-gray-100">
					{attempt.user.firstName}
					{attempt.user.lastName}
				</span>
				<!-- Attempt number badge -->
				<span
					class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
				>
					#{attempt.attemptNumber}
				</span>
				<!-- Status badge -->
				<span
					class={cn(
						'rounded-full px-2 py-0.5 text-xs font-medium',
						attempt.status === 'Graded'
							? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
							: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
					)}
				>
					{displayAttemptStatus(attempt.status)}
				</span>
			</div>

			<!-- Test title -->
			<div class="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
				{attempt.test.title}
			</div>

			<!-- Email -->
			<div class="truncate text-xs text-gray-500 dark:text-gray-500">
				{attempt.user.email}
			</div>
		</div>

		<!-- Desktop Actions (hidden on mobile) -->
		<div class="hidden shrink-0 lg:items-center gap-2 sm:flex">
			{#if showGradeButton}
				<Button
					variant="default"
					size="sm"
					href="/control-centre-v1/tests/attempts/{attempt.id}/grade"
					class="gap-1"
				>
					<Pencil class="h-4 w-4" />
					Оцени
				</Button>
			{:else}
				<Button
					variant="outline"
					size="sm"
					href="/control-centre-v1/tests/attempts/{attempt.id}/grade"
					class="gap-1"
				>
					<Eye class="h-4 w-4" />
					Преглед
				</Button>
			{/if}

			{#if isAdmin}
				<Button variant="destructive" size="sm" class="gap-1" onclick={() => (openDelete = true)}>
					<Trash2 class="h-4 w-4" />
					Изтрий
				</Button>
			{/if}
		</div>
	</div>

	<!-- Stats grid -->
	<div
		class="mt-3 flex flex-wrap gap-3 border-t lg:gap-x-6 border-gray-100 pt-3 text-sm dark:border-gray-700"
	>
		<!-- Duration -->
		<div class="flex lg:items-center gap-2 flex-col items-start lg:flex-row">
			<span class="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline">Време:</span>
			<span class="text-xs text-gray-500 dark:text-gray-400 block lg:hidden">Продължителност</span>
			<span class="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
				<Clock class="h-3.5 w-3.5" />
				{getDuration()}
			</span>
		</div>

		<!-- Started date -->
		<div class="flex lg:items-center gap-2 flex-col items-start lg:flex-row">
			<span class="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline">Започнат:</span>
			<span class="text-xs text-gray-500 dark:text-gray-400 block lg:hidden">Започнат</span>
			<span class="font-medium text-gray-700 dark:text-gray-300">
				{formatDate(attempt.startedAt)}
			</span>
		</div>

		<!-- Submitted date -->
		<div class="flex lg:items-center gap-2 flex-col items-start lg:flex-row">
			<span class="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline">Предаден:</span>
			<span class="text-xs text-gray-500 dark:text-gray-400 block lg:hidden">Предаден</span>
			<span class="font-medium text-gray-700 dark:text-gray-300">
				{formatDate(attempt.submittedAt)}
			</span>
		</div>

		<!-- Score -->
		<div class="flex lg:items-center gap-2 flex-col items-start lg:flex-row">
			<span class="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline">Точки:</span>
			<span class="text-xs text-gray-500 dark:text-gray-400 block lg:hidden">Резултат</span>
			<span
				class={cn(
					'font-bold',
					getScorePercentage() >= 80
						? 'text-green-600 dark:text-green-400'
						: getScorePercentage() >= 50
							? 'text-amber-600 dark:text-amber-400'
							: 'text-red-600 dark:text-red-400'
				)}
			>
				{attempt.totalScore.toFixed(1)} / {attempt.test.maxScore}
			</span>
		</div>

		{#if attempt.gradedAt}
			<!-- Graded date -->
			<div class="flex lg:items-center gap-2 flex-col items-start lg:flex-row">
				<span class="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline">Оценен:</span>
				<span class="text-xs text-gray-500 dark:text-gray-400 block lg:hidden">Оценен</span>
				<span class="font-medium text-gray-700 dark:text-gray-300">
					{formatDate(attempt.gradedAt)}
				</span>
			</div>
		{/if}
	</div>

	<!-- Mobile Actions (visible only on mobile) -->
	<div
		class="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700 sm:hidden"
	>
		{#if showGradeButton}
			<Button
				variant="default"
				size="sm"
				href="/control-centre-v1/tests/attempts/{attempt.id}/grade"
				class="flex-1 gap-1"
			>
				<Pencil class="h-4 w-4" />
				Оцени
			</Button>
		{:else}
			<Button
				variant="outline"
				size="sm"
				href="/control-centre-v1/tests/attempts/{attempt.id}/grade"
				class="flex-1 gap-1"
			>
				<Eye class="h-4 w-4" />
				Преглед
			</Button>
		{/if}

		{#if isAdmin}
			<Button variant="destructive" size="sm" class="shrink-0" onclick={() => (openDelete = true)}>
				<Trash2 class="h-4 w-4" />
			</Button>
		{/if}
	</div>
</div>

{#if isAdmin}
	<ResponsiveDialog bind:open={openDelete} disabled={isDeleting} closeButtonText="Отказ">
		{#snippet title()}
			Изтриване на опит
		{/snippet}

		{#snippet description()}
			Сигурни ли сте, че искате да изтриете този опит? Това действие е необратимо и ще изтрие всички
			отговори на ученика за този тест.
		{/snippet}

		{#snippet content()}
			<div>
				<span class="font-semibold">{attempt.user.firstName} {attempt.user.lastName}</span>
				- Опит #{attempt.attemptNumber}
				<br />
				<span class="text-muted-foreground text-sm">{attempt.test.title}</span>
			</div>
		{/snippet}

		{#snippet actionButton()}
			<Button
				disabled={isDeleting}
				variant="destructive"
				type="submit"
				class="bg-destructive! text-destructive-foreground z-10 w-full"
				onclick={handleDelete}
			>
				{isDeleting ? 'Изтриване...' : 'Изтрий'}
			</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
