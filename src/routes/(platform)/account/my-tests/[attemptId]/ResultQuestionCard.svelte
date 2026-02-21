<script lang="ts">
	/**
	 * ResultQuestionCard Component
	 *
	 * Displays a single question with the student's answer compared to the correct answer.
	 * Features:
	 * - Shows question stem
	 * - Highlights correct options in green
	 * - Highlights incorrect selections in red
	 * - Shows points awarded vs max points
	 * - For text/file upload questions, shows "pending review" status (manual grading needed)
	 * - For file upload questions, displays uploaded files with download links
	 */

	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { QuestionTypeEnum } from '$lib/types/enums';
	import type { ChoiceConfig, TextConfig, FileUploadConfig } from '$lib/types/tests';
	import { cn } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import Minus from '@lucide/svelte/icons/minus';
	import Clock from '@lucide/svelte/icons/clock';
	import FileIcon from '@lucide/svelte/icons/file';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import Download from '@lucide/svelte/icons/download';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { Button } from '$lib/components/ui/button';

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

	/** Shape of an answer object from the database */
	type Answer = {
		id: string;
		response: { selected?: string[]; text?: string; fileIds?: string[] } | null;
		awardedScore: number;
	};

	/** File info from the server */
	type FileInfo = {
		id: string;
		name: string;
		size: number;
		contentType: string;
		fileKey: string;
	};

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		/** The question to display */
		question: Question;
		/** The question number (1-based, for display) */
		questionNumber: number;
		/** The student's answer (null if not answered) */
		answer: Answer | null;
		/** Whether the entire attempt has been fully graded */
		isAttemptGraded?: boolean;
		/** Map of file IDs to file info (for file upload questions) */
		filesMap?: Record<string, FileInfo>;
	};

	let {
		question,
		questionNumber,
		answer,
		isAttemptGraded = false,
		filesMap = {}
	}: Props = $props();

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/** Whether this is a choice question (single or multiple) */
	let isChoiceQuestion = $derived(
		question.type === QuestionTypeEnum.SingleChoice ||
			question.type === QuestionTypeEnum.MultipleChoice
	);

	/** Whether this is a text question (needs manual grading) */
	let isTextQuestion = $derived(question.type === QuestionTypeEnum.Text);

	/** Whether this is a file upload question (needs manual grading) */
	let isFileUploadQuestion = $derived(question.type === QuestionTypeEnum.FileUpload);

	/** Whether this is a manually graded question (text or file upload) */
	let isManuallyGraded = $derived(isTextQuestion || isFileUploadQuestion);

	/** The student's selected option IDs */
	let selectedIds = $derived.by(() => {
		if (!answer?.response || !('selected' in answer.response)) return [];
		return answer.response.selected ?? [];
	});

	/** The correct option IDs (for choice questions) */
	let correctIds = $derived.by(() => {
		if (!isChoiceQuestion) return [];
		const config = question.config as ChoiceConfig;
		return config.correct.map((id) => id.toString());
	});

	/** The uploaded files (for file upload questions) */
	let uploadedFiles = $derived.by(() => {
		if (!isFileUploadQuestion || !answer?.response || !('fileIds' in answer.response)) return [];
		const fileIds = answer.response.fileIds ?? [];
		return fileIds.map((id) => filesMap[id]).filter((f): f is FileInfo => !!f);
	});

	/** Whether the answer is fully correct (applies to both auto-graded and manually graded questions) */
	let isCorrect = $derived(answer ? answer.awardedScore === question.points : false);

	/** Whether the answer is partially correct (some points awarded but not full) */
	let isPartiallyCorrect = $derived(
		answer ? answer.awardedScore > 0 && answer.awardedScore < question.points : false
	);

	/** Whether any answer was provided */
	let hasAnswer = $derived.by(() => {
		if (!answer?.response) return false;
		if ('selected' in answer.response) return (answer.response.selected?.length ?? 0) > 0;
		if ('text' in answer.response) return !!answer.response.text;
		if ('fileIds' in answer.response) return (answer.response.fileIds?.length ?? 0) > 0;
		return false;
	});

	/** Whether this manually graded question has been graded (has a score > 0 or attempt is fully graded) */
	let isManualGraded = $derived(
		isManuallyGraded && hasAnswer && (isAttemptGraded || (answer?.awardedScore ?? 0) > 0)
	);

	/** Whether this manually graded question has an answer and is still pending review */
	let isPendingReview = $derived(isManuallyGraded && hasAnswer && !isManualGraded);

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	/**
	 * Checks if an option was selected by the student.
	 */
	function isSelected(optionId: number): boolean {
		return selectedIds.includes(optionId.toString());
	}

	/**
	 * Checks if an option is a correct answer.
	 */
	function isCorrectOption(optionId: number): boolean {
		return correctIds.includes(optionId.toString());
	}

	/**
	 * Gets the status of an option for styling.
	 * - 'correct': Option is correct and was selected
	 * - 'incorrect': Option was selected but is wrong
	 * - 'missed': Option is correct but was not selected
	 * - 'neutral': Option is neither correct nor selected
	 */
	function getOptionStatus(optionId: number): 'correct' | 'incorrect' | 'missed' | 'neutral' {
		const selected = isSelected(optionId);
		const correct = isCorrectOption(optionId);

		if (selected && correct) return 'correct';
		if (selected && !correct) return 'incorrect';
		if (!selected && correct) return 'missed';
		return 'neutral';
	}

	/**
	 * Gets the card border/background style based on question result.
	 */
	function getCardStyle(): string {
		// Manually graded questions with answers that are still pending review (purple)
		if (isPendingReview) {
			return 'border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800/30';
		}
		// Correct answer - full points (green)
		if (isCorrect) {
			return 'border-green-300 dark:border-green-700 bg-white dark:bg-gray-800/30';
		}
		// Partially correct (amber) - for manually graded questions with some points
		if (isPartiallyCorrect && isManuallyGraded) {
			return 'border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800/30';
		}
		// Wrong answer (red) - for answered questions with no/low points
		if (hasAnswer && (answer?.awardedScore ?? 0) < question.points) {
			return 'border-red-300 dark:border-red-700 bg-white dark:bg-gray-800/30';
		}
		// No answer (gray)
		return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800';
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
</script>

<!-- Question Card Container -->
<div class={cn('rounded-xl border p-4 shadow-sm sm:p-6', getCardStyle())}>
	<!-- Header: Question number, points, and result indicator -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<!-- Question number badge -->
			<div class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">
				Въпрос {questionNumber}
			</div>
			<!-- Points display -->
			<div
				class={cn(
					'rounded-lg px-3 py-1.5 text-sm font-medium',
					isCorrect
						? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
						: isPartiallyCorrect
							? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'
							: isPendingReview
								? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200'
								: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
				)}
			>
				{#if isPendingReview}
					? / {question.points}
				{:else}
					{answer?.awardedScore ?? 0} / {question.points}
				{/if}
				{question.points === 1 ? 'точка' : 'точки'}
			</div>
		</div>

		<!-- Result indicator -->
		{#if isCorrect}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-green-200 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-800 dark:text-green-200"
			>
				<Check class="h-4 w-4" /> Вярно
			</span>
		{:else if isPartiallyCorrect}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-800 dark:text-amber-200"
			>
				<Check class="h-4 w-4" /> Частично вярно
			</span>
		{:else if isPendingReview}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-purple-200 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-800 dark:text-purple-200"
			>
				<Clock class="h-4 w-4" /> Очаква проверка
			</span>
		{:else if hasAnswer}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-red-200 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-800 dark:text-red-200"
			>
				<X class="h-4 w-4" /> Грешно
			</span>
		{:else}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
			>
				<Minus class="h-4 w-4" /> Без отговор
			</span>
		{/if}
	</div>

	<!-- Question Stem -->
	<div class="mb-4">
		<h3 class="text-lg leading-relaxed font-medium text-gray-900 dark:text-gray-100">
			<RenderStyledHtml renderAsInlineBlock={true}>
				{@html question.stem}
			</RenderStyledHtml>
		</h3>
	</div>

	<!-- Answer Options (for choice questions) -->
	{#if isChoiceQuestion}
		{@const choiceConfig = question.config as ChoiceConfig}
		<div class="space-y-2">
			{#each choiceConfig.options as option}
				{@const status = getOptionStatus(option.id)}
				<div
					class={cn(
						'flex items-center gap-3 rounded-lg border p-3 transition-colors',
						status === 'correct' &&
							'border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/50',
						status === 'incorrect' &&
							'border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/50',
						status === 'missed' &&
							'border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/40',
						status === 'neutral' &&
							'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
					)}
				>
					<!-- Status icon -->
					<div class="flex h-6 w-6 shrink-0 items-center justify-center">
						{#if status === 'correct'}
							<Check class="h-5 w-5 text-green-700 dark:text-green-300" />
						{:else if status === 'incorrect'}
							<X class="h-5 w-5 text-red-700 dark:text-red-300" />
						{:else if status === 'missed'}
							<Check class="h-5 w-5 text-amber-700 dark:text-amber-300" />
						{:else}
							<div class="h-4 w-4 rounded-full border-2 border-gray-400 dark:border-gray-500"></div>
						{/if}
					</div>

					<!-- Option text -->
					<div class="flex-1">
						<RenderStyledHtml renderAsInlineBlock={true}>
							{@html option.text}
						</RenderStyledHtml>
					</div>

					<!-- Labels -->
					<div class="flex gap-1.5">
						{#if isCorrectOption(option.id)}
							<span
								class="rounded bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-800 dark:text-green-200"
							>
								Верен
							</span>
						{/if}
						{#if isSelected(option.id) && !isCorrectOption(option.id)}
							<span
								class="rounded bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-800 dark:text-red-200"
							>
								Избран
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<div class="mt-4 flex flex-wrap gap-4 text-xs font-medium">
			<span class="inline-flex items-center gap-1.5">
				<div
					class="h-4 w-4 rounded border border-green-400 bg-green-200 dark:border-green-600 dark:bg-green-800"
				></div>
				<span class="text-gray-700 dark:text-gray-300">Верен и избран</span>
			</span>
			<span class="inline-flex items-center gap-1.5">
				<div
					class="h-4 w-4 rounded border border-red-400 bg-red-200 dark:border-red-600 dark:bg-red-800"
				></div>
				<span class="text-gray-700 dark:text-gray-300">Грешно избран</span>
			</span>
			<span class="inline-flex items-center gap-1.5">
				<div
					class="h-4 w-4 rounded border border-amber-400 bg-amber-200 dark:border-amber-600 dark:bg-amber-800"
				></div>
				<span class="text-gray-700 dark:text-gray-300">Пропуснат верен</span>
			</span>
		</div>
	{:else if isTextQuestion}
		<!-- Text question answer -->
		{@const textConfig = question.config as TextConfig}
		<div class="space-y-4">
			<!-- Student's answer -->
			<div>
				<div class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
					Вашият отговор:
				</div>
				<div
					class={cn(
						'rounded-lg border p-3 text-sm',
						isCorrect
							? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30'
							: isPartiallyCorrect
								? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30'
								: isManualGraded && hasAnswer
									? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
									: hasAnswer
										? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/30'
										: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
					)}
				>
					{#if answer?.response && 'text' in answer.response && answer.response.text}
						<RenderStyledHtml renderAsInlineBlock={true}>
							{@html answer.response.text}
						</RenderStyledHtml>
					{:else}
						<span class="italic text-muted-foreground">Няма отговор</span>
					{/if}
				</div>
			</div>

			<!-- Sample answer (if provided) -->
			{#if textConfig.sampleAnswer}
				<div>
					<div class="mb-2 text-sm font-semibold text-green-700 dark:text-green-300">
						Примерен отговор:
					</div>
					<div
						class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-900/30"
					>
						<RenderStyledHtml renderAsInlineBlock={true}>
							{@html textConfig.sampleAnswer}
						</RenderStyledHtml>
					</div>
				</div>
			{/if}

			<!-- Note about manual grading (only show if pending review) -->
			{#if isPendingReview}
				<div
					class="flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
				>
					<Clock class="mt-0.5 h-4 w-4 shrink-0" />
					<span>
						<strong>Забележка:</strong> Текстовите въпроси се оценяват ръчно от преподавател. Резултатът
						ще бъде актуализиран след проверка.
					</span>
				</div>
			{:else if isManualGraded}
				<!-- Show grading result for text questions -->
				<div
					class={cn(
						'flex items-start gap-2 rounded-lg border p-3 text-sm',
						isCorrect
							? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
							: isPartiallyCorrect
								? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
								: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
					)}
				>
					{#if isCorrect}
						<Check class="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							<strong>Оценено:</strong> Пълен брой точки ({answer?.awardedScore ??
								0}/{question.points}).
						</span>
					{:else if isPartiallyCorrect}
						<Check class="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							<strong>Оценено:</strong> Частичен брой точки ({answer?.awardedScore ??
								0}/{question.points}).
						</span>
					{:else}
						<X class="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							<strong>Оценено:</strong>
							{answer?.awardedScore ?? 0}/{question.points} точки.
						</span>
					{/if}
				</div>
			{/if}
		</div>
	{:else if isFileUploadQuestion}
		<!-- File upload question answer -->
		{@const fileConfig = question.config as FileUploadConfig}
		<div class="space-y-4">
			<!-- Instructions (if provided) -->
			{#if fileConfig.instructions}
				<div class="text-sm text-muted-foreground">
					<span class="font-medium">Инструкции:</span>
					{fileConfig.instructions}
				</div>
			{/if}

			<!-- Uploaded files -->
			<div>
				<div class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
					Качени файлове:
				</div>
				{#if uploadedFiles.length > 0}
					<div class="space-y-2">
						{#each uploadedFiles as file (file.id)}
							{@const Icon = getFileIcon(file.contentType)}
							<div
								class={cn(
									'flex items-center gap-3 rounded-lg border p-3',
									isCorrect
										? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30'
										: isPartiallyCorrect
											? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30'
											: isManualGraded
												? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
												: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/30'
								)}
							>
								<!-- File thumbnail/icon -->
								{#if file.contentType.startsWith('image/')}
									<a
										href="/api/file/{file.fileKey}"
										target="_blank"
										rel="noopener noreferrer"
										class="h-12 w-12 block shrink-0 overflow-hidden rounded bg-gray-100"
									>
										<img
											src="/api/file/{file.fileKey}"
											alt={file.name}
											class="h-full w-full object-cover"
										/>
									</a>
								{:else}
									<div
										class="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700"
									>
										<Icon class="h-6 w-6 text-gray-500" />
									</div>
								{/if}

								<!-- File info -->
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
										{file.name}
									</p>
									<p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
								</div>

								<!-- Actions -->
								<div class="flex items-center gap-1">
									<Button
										href="/api/file/{file.fileKey}"
										target="_blank"
										rel="noopener noreferrer"
										variant="ghost"
										size="icon-sm"
										title="Отвори в нов прозорец"
									>
										<ExternalLink class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										href="/api/file/{file.fileKey}?download=true"
										size="icon-sm"
										title="Изтегли"
									>
										<Download class="h-4 w-4" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50"
					>
						<span class="italic text-muted-foreground">Няма качени файлове</span>
					</div>
				{/if}
			</div>

			<!-- Note about manual grading (only show if pending review) -->
			{#if isPendingReview}
				<div
					class="flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
				>
					<Clock class="mt-0.5 h-4 w-4 shrink-0" />
					<span>
						<strong>Забележка:</strong> Въпросите с качени файлове се оценяват ръчно от преподавател.
						Резултатът ще бъде актуализиран след проверка.
					</span>
				</div>
			{:else if isManualGraded}
				<!-- Show grading result -->
				<div
					class={cn(
						'flex items-start gap-2 rounded-lg border p-3 text-sm',
						isCorrect
							? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
							: isPartiallyCorrect
								? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
								: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
					)}
				>
					{#if isCorrect}
						<Check class="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							<strong>Оценено:</strong> Пълен брой точки ({answer?.awardedScore ??
								0}/{question.points}).
						</span>
					{:else if isPartiallyCorrect}
						<Check class="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							<strong>Оценено:</strong> Частичен брой точки ({answer?.awardedScore ??
								0}/{question.points}).
						</span>
					{:else}
						<X class="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							<strong>Оценено:</strong>
							{answer?.awardedScore ?? 0}/{question.points} точки.
						</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
