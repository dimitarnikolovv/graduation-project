<script lang="ts">
	/**
	 * GradeQuestionCard Component
	 *
	 * Displays a question with the student's answer and allows teachers
	 * to assign points for text questions or review auto-graded questions.
	 */

	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import { QuestionTypeEnum } from '$lib/types/enums';
	import type { ChoiceConfig, TextConfig, FileUploadConfig, FileUploadAnswerResponse } from '$lib/types/tests';
	import { cn } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import Save from '@lucide/svelte/icons/save';
	import FileIcon from '@lucide/svelte/icons/file';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import Download from '@lucide/svelte/icons/download';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { toast } from 'svelte-sonner';
	import { updateAnswerScoreRemote } from '../../../attempts.remote';

	// ============================================================================
	// TYPES
	// ============================================================================

	type Question = {
		id: string;
		type: QuestionTypeEnum;
		stem: string;
		points: number;
		config: ChoiceConfig | TextConfig | FileUploadConfig;
		order: number;
	};

	type Answer = {
		id: string;
		response: { selected?: string[]; text?: string; fileIds?: string[] } | null;
		awardedScore: number;
	};

	type FileInfo = {
		id: string;
		displayName: string;
		originalName: string;
		size: number;
		contentType: string;
		fileKey: string;
	};

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		question: Question;
		questionNumber: number;
		answer: Answer | null;
		filesMap?: Map<string, FileInfo>;
		onScoreUpdate: (newTotalScore: number) => void;
	};

	let { question, questionNumber, answer, filesMap, onScoreUpdate }: Props = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let scoreInput = $state(answer?.awardedScore?.toString() ?? '0');
	let saving = $state(false);

	// ============================================================================
	// DERIVED
	// ============================================================================

	let isChoiceQuestion = $derived(
		question.type === QuestionTypeEnum.SingleChoice ||
			question.type === QuestionTypeEnum.MultipleChoice
	);
	let isTextQuestion = $derived(question.type === QuestionTypeEnum.Text);
	let isFileUploadQuestion = $derived(question.type === QuestionTypeEnum.FileUpload);

	let selectedIds = $derived.by(() => {
		if (!answer?.response || !('selected' in answer.response)) return [];
		return answer.response.selected ?? [];
	});

	let correctIds = $derived.by(() => {
		if (!isChoiceQuestion) return [];
		const config = question.config as ChoiceConfig;
		return config.correct.map((id) => id.toString());
	});

	let uploadedFileIds = $derived.by(() => {
		if (!answer?.response || !('fileIds' in answer.response)) return [];
		return (answer.response as FileUploadAnswerResponse).fileIds ?? [];
	});

	let uploadedFiles = $derived.by(() => {
		if (!filesMap || uploadedFileIds.length === 0) return [];
		return uploadedFileIds
			.map((id) => filesMap.get(id))
			.filter((f): f is FileInfo => f !== undefined);
	});

	let hasAnswer = $derived.by(() => {
		if (!answer?.response) return false;
		if ('selected' in answer.response) return (answer.response.selected?.length ?? 0) > 0;
		if ('text' in answer.response) return !!answer.response.text;
		if ('fileIds' in answer.response) return (answer.response.fileIds?.length ?? 0) > 0;
		return false;
	});

	let isAutoGraded = $derived(isChoiceQuestion);
	let currentScore = $derived(answer?.awardedScore ?? 0);

	// ============================================================================
	// HELPERS
	// ============================================================================

	function isSelected(optionId: number): boolean {
		return selectedIds.includes(optionId.toString());
	}

	function isCorrectOption(optionId: number): boolean {
		return correctIds.includes(optionId.toString());
	}

	function getOptionStatus(optionId: number): 'correct' | 'incorrect' | 'missed' | 'neutral' {
		const selected = isSelected(optionId);
		const correct = isCorrectOption(optionId);

		if (selected && correct) return 'correct';
		if (selected && !correct) return 'incorrect';
		if (!selected && correct) return 'missed';
		return 'neutral';
	}

	function getFileIcon(contentType: string) {
		if (contentType.startsWith('image/')) return ImageIcon;
		if (contentType === 'application/pdf') return FileTextIcon;
		return FileIcon;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// ============================================================================
	// ACTIONS
	// ============================================================================

	async function saveScore() {
		if (!answer) return;

		const score = parseFloat(scoreInput);
		if (isNaN(score) || score < 0) {
			toast.error('Моля, въведете валидна оценка.');
			return;
		}

		if (score > question.points) {
			toast.error(`Оценката не може да надвишава ${question.points} точки.`);
			return;
		}

		saving = true;
		try {
			const result = await updateAnswerScoreRemote({
				answerId: answer.id,
				score
			});
			toast.success('Оценката е записана.');
			onScoreUpdate(result.totalScore);
		} catch (err) {
			console.error('Failed to save score', err);
			toast.error('Грешка при записване на оценката.');
		} finally {
			saving = false;
		}
	}
</script>

<div
	class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800"
>
	<!-- Header -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<div class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">
				Въпрос {questionNumber}
			</div>
			<div
				class="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
			>
				{question.points} {question.points === 1 ? 'точка' : 'точки'}
			</div>
		{#if isAutoGraded}
			<span
				class="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
			>
				Автоматично оценен
			</span>
		{:else if isFileUploadQuestion}
			<span
				class="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
			>
				Прикачен файл
			</span>
		{:else}
			<span
				class="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
			>
				За ръчна оценка
			</span>
		{/if}
		</div>

		<!-- Current score -->
		<div class="text-sm font-medium">
			Оценка: <span class="text-lg font-bold text-blue-600 dark:text-blue-400"
				>{currentScore}</span
			>
			/ {question.points}
		</div>
	</div>

	<!-- Question Stem -->
	<div class="mb-4">
		<h3 class="text-lg leading-relaxed font-medium text-gray-900 dark:text-gray-100">
			<RenderStyledHtml renderAsInlineBlock={true}>
				{@html question.stem}
			</RenderStyledHtml>
		</h3>
	</div>

	<!-- Answer Display -->
	{#if isChoiceQuestion}
		{@const choiceConfig = question.config as ChoiceConfig}
		<div class="space-y-2">
			{#each choiceConfig.options as option}
				{@const status = getOptionStatus(option.id)}
				<div
					class={cn(
						'flex items-center gap-3 rounded-lg border p-3',
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
					<div class="flex h-6 w-6 shrink-0 items-center justify-center">
						{#if status === 'correct'}
							<Check class="h-5 w-5 text-green-600 dark:text-green-400" />
						{:else if status === 'incorrect'}
							<X class="h-5 w-5 text-red-600 dark:text-red-400" />
						{:else if status === 'missed'}
							<Check class="h-5 w-5 text-amber-600 dark:text-amber-400" />
						{:else}
							<div
								class="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
							></div>
						{/if}
					</div>

					<div class="flex-1">
						<RenderStyledHtml renderAsInlineBlock={true}>
							{@html option.text}
						</RenderStyledHtml>
					</div>

					<div class="flex gap-1.5">
						{#if isCorrectOption(option.id)}
							<span
								class="rounded bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200"
							>
								Верен
							</span>
						{/if}
						{#if isSelected(option.id) && !isCorrectOption(option.id)}
							<span
								class="rounded bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-800 dark:text-red-200"
							>
								Избран
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else if isTextQuestion}
		{@const textConfig = question.config as TextConfig}
		<div class="space-y-4">
			<!-- Student's answer -->
			<div>
				<div class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
					Отговор на ученика:
				</div>
				<div
					class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50"
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

			<!-- Sample answer -->
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

			<!-- Score input -->
			{#if answer}
				<div
					class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30"
				>
					<label for="score-{question.id}" class="text-sm font-medium text-blue-800 dark:text-blue-200">
						Оценка:
					</label>
					<Input
						id="score-{question.id}"
						type="number"
						min="0"
						max={question.points}
						step="0.5"
						bind:value={scoreInput}
						class="w-24"
					/>
					<span class="text-sm text-blue-700 dark:text-blue-300">/ {question.points}</span>
					<Button
						size="sm"
						onclick={saveScore}
						disabled={saving}
						class="ml-auto gap-1"
					>
						<Save class="h-4 w-4" />
						{saving ? 'Записване...' : 'Запази'}
					</Button>
				</div>
			{/if}
		</div>
	{:else if isFileUploadQuestion}
		{@const fileConfig = question.config as FileUploadConfig}
		<div class="space-y-4">
			<!-- Instructions if present -->
			{#if fileConfig.instructions}
				<div
					class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50"
				>
					<span class="font-medium">Инструкции:</span>
					{fileConfig.instructions}
				</div>
			{/if}

			<!-- Uploaded files -->
			<div>
				<div class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
					Качени файлове ({uploadedFiles.length} / {fileConfig.maxFiles}):
				</div>

				{#if uploadedFiles.length > 0}
					<div class="space-y-2">
						{#each uploadedFiles as file (file.id)}
							{@const Icon = getFileIcon(file.contentType)}
							<div
								class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
							>
								<!-- File preview/icon -->
								{#if file.contentType.startsWith('image/')}
									<div class="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
										<a href="/api/file/{file.fileKey}" target="_blank" rel="noopener noreferrer">
											<img
												src="/api/file/{file.fileKey}"
												alt={file.originalName}
												class="h-full w-full object-cover hover:opacity-80 transition-opacity"
											/>
										</a>
									</div>
								{:else}
									<div
										class="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700"
									>
										<Icon class="h-8 w-8 text-gray-500" />
									</div>
								{/if}

								<!-- File info -->
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{file.originalName}</p>
									<p class="text-xs text-muted-foreground">
										{formatFileSize(file.size)} • {file.contentType}
									</p>
								</div>

								<!-- Actions -->
								<div class="flex gap-1">
									<Button
										variant="outline"
										size="icon-sm"
										href="/api/file/{file.fileKey}"
										target="_blank"
										rel="noopener noreferrer"
										title="Отвори в нов прозорец"
									>
										<ExternalLink class="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon-sm"
										href="/api/file/{file.fileKey}?download=true"
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
						class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
					>
						Няма качени файлове
					</div>
				{/if}
			</div>

			<!-- Score input for file upload questions (manual grading) -->
			{#if answer}
				<div
					class="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/30"
				>
					<label for="score-{question.id}" class="text-sm font-medium text-orange-800 dark:text-orange-200">
						Оценка:
					</label>
					<Input
						id="score-{question.id}"
						type="number"
						min="0"
						max={question.points}
						step="0.5"
						bind:value={scoreInput}
						class="w-24"
					/>
					<span class="text-sm text-orange-700 dark:text-orange-300">/ {question.points}</span>
					<Button
						size="sm"
						onclick={saveScore}
						disabled={saving}
						class="ml-auto gap-1"
					>
						<Save class="h-4 w-4" />
						{saving ? 'Записване...' : 'Запази'}
					</Button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- No answer message -->
	{#if !hasAnswer}
		<div
			class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
		>
			Ученикът не е дал отговор на този въпрос.
		</div>
	{/if}
</div>

