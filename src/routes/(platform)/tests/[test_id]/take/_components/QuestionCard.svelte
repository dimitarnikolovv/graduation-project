<script lang="ts">
	/**
	 * QuestionCard Component
	 *
	 * Renders a single question with its answer input fields.
	 * Supports four question types:
	 * - SingleChoice: Radio buttons (only one option can be selected)
	 * - MultipleChoice: Checkboxes (multiple options can be selected)
	 * - Text: Textarea for free-form text answers
	 * - FileUpload: File upload with drag-drop and mobile support
	 *
	 * Features:
	 * - Self-contained answer management (saves directly to server)
	 * - Visual feedback for save status (saving, saved, error)
	 * - Answered/unanswered indicators
	 * - Disabled state for locked attempts
	 * - Debounced text input saving
	 */
	import { goto } from '$app/navigation';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { QuestionTypeEnum } from '$lib/types/enums';
	import type { AnswerResponse, ChoiceConfig, TextConfig, FileUploadConfig } from '$lib/types/tests';
	import Check from '@lucide/svelte/icons/check';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import { toast } from 'svelte-sonner';
	import { saveAnswerRemote } from '../test.remote';
	import MultipleChoiceOption from './MultipleChoiceOption.svelte';
	import SingleChoiceGroup from './SingleChoiceGroup.svelte';
	import FileUploadQuestion from './FileUploadQuestion.svelte';

	// ============================================================================
	// TYPE DEFINITIONS
	// ============================================================================

	/** Shape of a question object */
	type Question = {
		id: string;
		type: QuestionTypeEnum;
		stem: string;
		points: number;
		config: ChoiceConfig | TextConfig | FileUploadConfig;
	};

	/** Save status for the answer */
	type SaveState = 'idle' | 'saving' | 'saved' | 'error';

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		/** The question to display */
		question: Question;
		/** The question number (1-based, for display) */
		questionNumber: number;
		/** ID of the current test attempt */
		attemptId: string;
		/** Initial answer from server (if any) */
		initialAnswer: AnswerResponse | null;
		/** Whether inputs should be disabled (e.g., attempt is locked) */
		disabled?: boolean;
		/** Callback when answer state changes (for parent tracking) */
		onAnswerChange?: (questionId: string, isAnswered: boolean) => void;
	};

	let {
		question,
		questionNumber,
		attemptId,
		initialAnswer,
		disabled = false,
		onAnswerChange
	}: Props = $props();

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	/**
	 * Checks if an answer response has actual content (selected options, text, or files).
	 */
	function hasAnswerContent(response: AnswerResponse | null): boolean {
		if (!response) return false;
		if ('selected' in response) return (response.selected?.length ?? 0) > 0;
		if ('text' in response) return !!response.text;
		if ('fileIds' in response) return (response.fileIds?.length ?? 0) > 0;
		return false;
	}

	/**
	 * Gets initial file IDs from the answer response.
	 */
	function getInitialFileIds(): string[] {
		if (initialAnswer && 'fileIds' in initialAnswer && Array.isArray(initialAnswer.fileIds)) {
			return initialAnswer.fileIds;
		}
		return [];
	}

	// ============================================================================
	// STATE
	// ============================================================================

	/** Current answer response for this question */
	let answer = $state<AnswerResponse | null>(initialAnswer);

	/** Current save status - initialized to 'saved' if there's an existing answer from server */
	let saveStatus = $state<SaveState>(hasAnswerContent(initialAnswer) ? 'saved' : 'idle');

	/** Debounce timer for text input */
	let textTimer: ReturnType<typeof setTimeout> | null = null;

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/**
	 * Gets the currently selected option IDs for choice questions.
	 */
	let selectedOptions = $derived.by(() => {
		if (answer && 'selected' in answer && Array.isArray(answer.selected)) {
			return answer.selected.map((v) => v.toString());
		}
		return [];
	});

	/**
	 * Gets the current text value for text questions.
	 */
	let textValue = $derived.by(() => {
		if (answer && 'text' in answer && typeof answer.text === 'string') {
			return answer.text;
		}
		return '';
	});

	/**
	 * Whether the question has been answered.
	 */
	let isAnswered = $derived.by(() => {
		if (!answer) return false;
		if ('selected' in answer) return (answer.selected?.length ?? 0) > 0;
		if ('text' in answer) return !!answer.text;
		if ('fileIds' in answer) return (answer.fileIds?.length ?? 0) > 0;
		return false;
	});

	/**
	 * Returns a human-readable label for the current save status.
	 */
	function getStatusLabel() {
		switch (saveStatus) {
			case 'saving':
				return 'Записване...';
			case 'saved':
				return 'Записано';
			case 'error':
				return 'Грешка при запис';
			default:
				return 'Очаква отговор';
		}
	}

	/**
	 * Persists an answer to the server and updates local state.
	 */
	async function persistAnswer(response: AnswerResponse) {
		if (disabled) return;

		// Update local state optimistically
		answer = response;
		saveStatus = 'saving';

		// Notify parent of answer change
		const wasAnswered =
			('selected' in response && (response.selected?.length ?? 0) > 0) ||
			('text' in response && !!response.text);
		onAnswerChange?.(question.id, wasAnswered);

		try {
			const result = await saveAnswerRemote({
				attemptId,
				questionId: question.id,
				response
			});

			// Check if the attempt was already submitted by the system
			if (result && 'alreadySubmitted' in result && result.alreadySubmitted) {
				toast.info(result.message, {
					description: 'Ще бъдете пренасочени към резултатите.'
				});
				// Redirect to results page after a short delay
				setTimeout(() => {
					void goto(`/account/my-tests/${attemptId}`);
				}, 1500);
				return;
			}

			// Check if test was closed
			if (result && 'testClosed' in result && result.testClosed) {
				toast.warning(result.message, {
					description: 'Ще бъдете пренасочени към резултатите.'
				});
				// Redirect to results page after a short delay
				setTimeout(() => {
					void goto(`/account/my-tests/${attemptId}`);
				}, 1500);
				return;
			}

			saveStatus = 'saved';
		} catch (error) {
			console.error('Failed to save answer', error);
			saveStatus = 'error';
			toast.error('Неуспешно записване на отговора. Опитайте отново.');
		}
	}

	/**
	 * Handles text input with debouncing.
	 */
	function handleTextInput(text: string) {
		if (disabled) return;

		// Update local state immediately for responsive UI
		answer = { text };
		saveStatus = 'saving';

		// Notify parent immediately (for tracking)
		onAnswerChange?.(question.id, !!text);

		// Clear any existing timer
		if (textTimer) clearTimeout(textTimer);

		// Set new debounced save timer (700ms delay)
		textTimer = setTimeout(() => {
			void persistAnswer({ text });
			textTimer = null;
		}, 700);
	}

	/**
	 * Handles blur event on text input - saves immediately.
	 */
	function handleTextBlur() {
		if (textTimer) {
			clearTimeout(textTimer);
			textTimer = null;
		}
		void persistAnswer({ text: textValue });
	}
</script>

<!-- Question Card Container -->
<section
	id="question-{questionNumber}-section"
	class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800"
>
	<!-- Fixes the anchor offset for in-page navigation -->
	<span id="question-{questionNumber}" class="block -mt-52 pb-52"></span>
	<!-- Header: Question number, points, and status indicators -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<!-- Question number badge -->
			<div class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">
				Въпрос {questionNumber}
			</div>
			<!-- Points badge -->
			<div
				class="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
			>
				{question.points}
				{question.points === 1 ? 'точка' : 'точки'}
			</div>
			<!-- Answered/Unanswered indicator -->
			{#if isAnswered}
				<span
					class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-200"
				>
					<Check class="h-4 w-4" /> Записано
				</span>
			{:else}
				<span
					class="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-100"
				>
					<AlertTriangle class="h-4 w-4" /> Не е отговорено
				</span>
			{/if}
		</div>

		<!-- Save status label -->
		<div class="text-xs font-medium text-muted-foreground">
			{getStatusLabel()}
		</div>
	</div>

	<!-- Question Stem (the question text) -->
	<div class="mb-4">
		<h3 class="text-lg leading-relaxed font-medium text-gray-900 dark:text-gray-100">
			<RenderStyledHtml renderAsInlineBlock={true}>
				{@html question.stem}
			</RenderStyledHtml>
		</h3>
	</div>

	<!-- Answer Input: Rendered based on question type -->
	{#if question.type === QuestionTypeEnum.SingleChoice || question.type === QuestionTypeEnum.MultipleChoice}
		{@const choiceConfig = question.config as ChoiceConfig}

		<!-- Single Choice: Radio buttons -->
		{#if question.type === QuestionTypeEnum.SingleChoice}
			<SingleChoiceGroup
				{selectedOptions}
				{choiceConfig}
				questionId={question.id}
				{disabled}
				{persistAnswer}
			/>
		{:else}
			<!-- Multiple Choice: Checkboxes -->
			<div class="space-y-3">
				{#each choiceConfig.options as option (option.id)}
					<MultipleChoiceOption
						questionId={question.id}
						{option}
						bind:selectedOptions
						{disabled}
						{persistAnswer}
					/>
				{/each}
			</div>
		{/if}
	{:else if question.type === QuestionTypeEnum.Text}
		<!-- Text Question: Textarea -->
		{@const textConfig = question.config as TextConfig}
		<div class="space-y-3">
			<Textarea
				class="min-h-32 w-full resize-none rounded-lg border p-4"
				placeholder="Въведете вашия отговор тук..."
				value={textValue}
				{disabled}
				oninput={(event) => handleTextInput((event.target as HTMLTextAreaElement).value)}
				onblur={handleTextBlur}
				maxlength={textConfig.maxLength}
			/>
			<!-- Character counter -->
			<div class="text-xs text-muted-foreground">
				{textValue.length}/{textConfig.maxLength} символа
			</div>
		</div>
	{:else if question.type === QuestionTypeEnum.FileUpload}
		<!-- File Upload Question -->
		{@const fileConfig = question.config as FileUploadConfig}
		<FileUploadQuestion
			{attemptId}
			questionId={question.id}
			config={fileConfig}
			initialFileIds={getInitialFileIds()}
			{disabled}
			onFilesChange={(qId, fileIds) => {
				answer = { fileIds };
				saveStatus = 'saved';
				onAnswerChange?.(qId, fileIds.length > 0);
			}}
		/>
	{/if}
</section>
