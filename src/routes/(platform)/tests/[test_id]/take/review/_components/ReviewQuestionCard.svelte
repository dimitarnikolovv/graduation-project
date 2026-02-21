<script lang="ts">
	/**
	 * ReviewQuestionCard Component
	 *
	 * Displays a single question with its answer for the review page.
	 * Used before final submission to let students verify their answers.
	 * Features:
	 * - Shows question stem and answer
	 * - Visual indicator for answered/unanswered status
	 * - Renders HTML content in both stem and answers
	 * - Handles choice, text, and file upload question types
	 */

	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { Button } from '$lib/components/ui/button';
	import { QuestionTypeEnum } from '$lib/types/enums';
	import type { AnswerResponse, ChoiceConfig } from '$lib/types/tests';
	import FileIcon from '@lucide/svelte/icons/file';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	// ============================================================================
	// TYPE DEFINITIONS
	// ============================================================================

	/** Shape of a question object */
	type Question = {
		id: string;
		type: QuestionTypeEnum;
		stem: string;
		config: unknown;
	};

	/** File info from the server */
	type FileInfo = {
		id: string;
		name: string;
		size: number;
		contentType: string;
	};

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		/** The question to display */
		question: Question;
		/** The question number (1-based, for display) */
		questionNumber: number;
		/** The student's response to this question (null if not answered) */
		response: AnswerResponse | null;
		/** Base link to the test-taking page */
		testLink: string;
		/** Number of questions per page (for calculating target page) */
		limit: number;
		/** Map of file IDs to file info (for file upload questions) */
		filesMap?: Record<string, FileInfo>;
	};

	let { question, questionNumber, response, testLink, limit, filesMap = {} }: Props = $props();
	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	/**
	 * Gets the text labels of selected options for choice questions.
	 * Looks up each selected option ID in the question config to get its text.
	 *
	 * @returns Array of selected option texts (HTML strings)
	 */
	function getSelectedLabels(): string[] {
		// Guard: No response or no selections
		if (!response || !('selected' in response) || !response.selected?.length) {
			return [];
		}

		let choiceConfig = question.config as ChoiceConfig;

		// Map selected IDs to their option texts
		return response.selected
			.map((selectedId) =>
				choiceConfig.options.find((opt) => opt.id.toString() === selectedId.toString())
			)
			.filter(Boolean)
			.map((opt) => opt?.text ?? '')
			.filter(Boolean);
	}

	/**
	 * Gets the text answer for text questions.
	 *
	 * @returns The text answer, or empty string if not answered
	 */
	function getTextAnswer(): string {
		if (!response || !('text' in response)) return '';
		return response.text ?? '';
	}

	/**
	 * Gets the uploaded files for file upload questions.
	 *
	 * @returns Array of file info objects
	 */
	function getUploadedFiles(): FileInfo[] {
		if (!response || !('fileIds' in response) || !response.fileIds?.length) {
			return [];
		}
		return response.fileIds
			.map((id) => filesMap[id])
			.filter((f): f is FileInfo => !!f);
	}

	/**
	 * Gets the appropriate icon for a file based on its content type.
	 */
	function getFileIcon(contentType: string) {
		if (contentType.startsWith('image/')) return ImageIcon;
		if (contentType === 'application/pdf') return FileTextIcon;
		return FileIcon;
	}

	/**
	 * Formats file size in human-readable format.
	 */
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/** True if this is a choice question (single or multiple) */
	let isChoiceQuestion = $derived(
		question.type === QuestionTypeEnum.SingleChoice ||
		question.type === QuestionTypeEnum.MultipleChoice
	);

	/** True if this is a text question */
	let isTextQuestion = $derived(question.type === QuestionTypeEnum.Text);

	/** True if this is a file upload question */
	let isFileUploadQuestion = $derived(question.type === QuestionTypeEnum.FileUpload);

	/** Array of selected option labels (for choice questions) */
	let selectedLabels = $derived(getSelectedLabels());

	/** The text answer (for text questions) */
	let textAnswer = $derived(getTextAnswer());

	/** Array of uploaded files (for file upload questions) */
	let uploadedFiles = $derived(getUploadedFiles());

	/** True if the question has any answer */
	let hasAnswer = $derived(
		selectedLabels.length > 0 || !!textAnswer || uploadedFiles.length > 0
	);

	// Calculate which page this question is on
	const targetPage = Math.ceil(questionNumber / limit);

	const questionUrl = `${testLink}?page=${targetPage}#question-${questionNumber}`;
</script>

<!-- Review Card Container -->
<div
	class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60"
>
	<!-- Header: Question number, stem, and status badge -->
	<div class="mb-2 flex items-start justify-between gap-3">
		<div class="flex flex-col gap-1">
			<!-- Question number label -->
			<a class="text-xs w-fit uppercase text-muted-foreground hover:underline" href={questionUrl}
				>Въпрос {questionNumber}</a
			>
			<!-- Question stem (the question text) -->
			<div class="font-medium text-foreground">
				<RenderStyledHtml renderAsInlineBlock={true}>
					{@html question.stem}
				</RenderStyledHtml>
			</div>
		</div>

		<!-- Answered/Unanswered badge -->
		{#if hasAnswer}
			<span
				class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-200"
			>
				Попълнено
			</span>
		{:else}
			<span
				class="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-100"
			>
				Липсва отговор
			</span>
		{/if}
	</div>

	<!-- Answer Display -->
	<div
		class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-800/70"
	>
		<div class="font-semibold text-foreground mb-2">Отговор:</div>

		<!-- Choice Question: List of selected options -->
		{#if isChoiceQuestion && selectedLabels.length > 0}
			<ul class="space-y-1 text-foreground">
				{#each selectedLabels as label}
					<li class="rounded bg-white/60 px-2 py-1 dark:bg-gray-900/60">
						<RenderStyledHtml renderAsInlineBlock={true}>
							{@html label}
						</RenderStyledHtml>
					</li>
				{/each}
			</ul>
		<!-- Text Question: Show the text answer -->
		{:else if isTextQuestion && textAnswer}
			<div class="text-foreground">
				<RenderStyledHtml renderAsInlineBlock={true}>
					{@html textAnswer}
				</RenderStyledHtml>
			</div>
		<!-- File Upload Question: Show uploaded files -->
		{:else if isFileUploadQuestion && uploadedFiles.length > 0}
			<div class="space-y-2">
				{#each uploadedFiles as file (file.id)}
					{@const Icon = getFileIcon(file.contentType)}
					<div class="flex items-center gap-3 rounded bg-white/60 px-2 py-1.5 dark:bg-gray-900/60">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
							<Icon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-foreground">{file.name}</p>
							<p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
						</div>
					</div>
				{/each}
			</div>
		<!-- No Answer: Show placeholder -->
		{:else}
			<div class="text-foreground italic">---</div>
		{/if}
	</div>

	<Button variant="default" size="sm" class="mt-4" href={questionUrl}>Към въпроса</Button>
</div>
