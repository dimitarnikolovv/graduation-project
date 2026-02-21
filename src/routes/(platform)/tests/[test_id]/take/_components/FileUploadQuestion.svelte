<script lang="ts">
	/**
	 * FileUploadQuestion Component
	 *
	 * Renders a file upload question with:
	 * - Drag-and-drop file upload zone
	 * - File preview (thumbnails for images, icons for documents)
	 * - Progress indicator during upload
	 * - Delete uploaded files
	 * - QR code button to open mobile upload modal
	 * - Display uploaded file count vs max allowed
	 */
	import { Button } from '$lib/components/ui/button';
	import type { FileUploadConfig } from '$lib/types/tests';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import FileIcon from '@lucide/svelte/icons/file';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileText from '@lucide/svelte/icons/file-text';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { toast } from 'svelte-sonner';
	import { onMount, onDestroy } from 'svelte';
	import {
		deleteTestFileRemote,
		getUploadedFilesRemote,
		generateUploadTokenRemote
	} from '../test.remote';
	import MobileUploadModal from './MobileUploadModal.svelte';

	// ============================================================================
	// TYPE DEFINITIONS
	// ============================================================================

	type UploadedFile = {
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
		/** ID of the current test attempt */
		attemptId: string;
		/** ID of the question */
		questionId: string;
		/** Configuration for this file upload question */
		config: FileUploadConfig;
		/** Initially uploaded file IDs (from server) */
		initialFileIds: string[];
		/** Whether inputs should be disabled (e.g., attempt is locked) */
		disabled?: boolean;
		/** Callback when files change (for parent tracking) */
		onFilesChange?: (questionId: string, fileIds: string[]) => void;
	};

	let {
		attemptId,
		questionId,
		config,
		initialFileIds,
		disabled = false,
		onFilesChange
	}: Props = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	/** Files that have been uploaded to the server */
	let uploadedFiles = $state<UploadedFile[]>([]);

	/** Whether a file is currently being uploaded */
	let isUploading = $state(false);

	/** Name of file currently being uploaded */
	let uploadingFileName = $state<string | null>(null);

	/** Whether the drag zone is active (file being dragged over) */
	let isDragActive = $state(false);

	/** Hidden file input reference */
	let fileInputRef = $state<HTMLInputElement | null>(null);

	/** Whether mobile upload modal is open */
	let isMobileModalOpen = $state(false);

	/** Upload token for mobile upload */
	let uploadToken = $state<string | null>(null);

	/** Polling interval for mobile uploads */
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	/** Whether files are being refreshed */
	let isRefreshing = $state(false);

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	// Load initially uploaded files once on mount
	onMount(() => {
		if (initialFileIds.length > 0) {
			loadUploadedFiles();
		}
	});

	// Cleanup polling on unmount
	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	async function loadUploadedFiles() {
		try {
			const result = await getUploadedFilesRemote({ attemptId, questionId });
			if (result.files) {
				uploadedFiles = result.files;
			}
		} catch (error) {
			console.error('Failed to load uploaded files', error);
		}
	}

	async function refreshFiles() {
		if (isRefreshing) return;

		isRefreshing = true;
		try {
			const result = await getUploadedFilesRemote({ attemptId, questionId });
			if (result.files) {
				const oldCount = uploadedFiles.length;
				uploadedFiles = result.files;

				// Notify parent if files changed
				if (result.files.length !== oldCount) {
					onFilesChange?.(
						questionId,
						uploadedFiles.map((f) => f.id)
					);
				}

				if (result.files.length > oldCount) {
					toast.success(`${result.files.length - oldCount} нов(и) файл(а) намерен(и)`);
				}
			}
		} catch (error) {
			console.error('Failed to refresh files', error);
			toast.error('Неуспешно обновяване на файловете');
		} finally {
			isRefreshing = false;
		}
	}

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/** Total number of files (uploaded + uploading) */
	let totalFiles = $derived(uploadedFiles.length + (isUploading ? 1 : 0));

	/** Whether max files limit is reached */
	let isMaxFilesReached = $derived(totalFiles >= config.maxFiles);

	/** Whether the user can upload more files */
	let canUpload = $derived(!disabled && !isMaxFilesReached && !isUploading);

	/** Get human-readable file types */
	let allowedTypesDisplay = $derived.by(() => {
		return config.allowedTypes
			.map((type) => {
				if (type === 'image/*') return 'изображения';
				if (type === 'application/pdf') return 'PDF';
				if (type.startsWith('image/')) return type.replace('image/', '');
				return type;
			})
			.join(', ');
	});

	// ============================================================================
	// FILE VALIDATION
	// ============================================================================

	function validateFile(file: File): string | null {
		// Check file size
		const maxSizeBytes = config.maxFileSizeMB * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			return `Файлът е твърде голям (максимум ${config.maxFileSizeMB} MB)`;
		}

		// Check file type
		const isAllowed = config.allowedTypes.some((allowed) => {
			if (allowed.endsWith('/*')) {
				const category = allowed.replace('/*', '');
				return file.type.startsWith(category + '/');
			}
			return file.type === allowed;
		});

		if (!isAllowed) {
			return `Неразрешен тип файл. Позволени: ${allowedTypesDisplay}`;
		}

		return null;
	}

	// ============================================================================
	// FILE UPLOAD HANDLING
	// ============================================================================

	async function handleFiles(files: FileList | File[]) {
		const fileArray = Array.from(files);

		// Check how many more files can be uploaded
		const remainingSlots = config.maxFiles - uploadedFiles.length;
		if (remainingSlots <= 0) {
			toast.error(`Достигнат е максималният брой файлове (${config.maxFiles})`);
			return;
		}

		// Limit to remaining slots
		const filesToUpload = fileArray.slice(0, remainingSlots);

		for (const file of filesToUpload) {
			const validationError = validateFile(file);
			if (validationError) {
				toast.error(validationError);
				continue;
			}

			await uploadFile(file);
		}
	}

	async function uploadFile(file: File) {
		isUploading = true;
		uploadingFileName = file.name;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('attemptId', attemptId);
		formData.append('questionId', questionId);

		try {
			const response = await fetch('/api/test-upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Неуспешно качване');
			}

			const result = await response.json();

			if (result.success && result.file) {
				uploadedFiles = [...uploadedFiles, result.file];

				// Notify parent
				onFilesChange?.(
					questionId,
					uploadedFiles.map((f) => f.id)
				);

				toast.success('Файлът е качен успешно');
			} else {
				throw new Error('Неуспешно качване');
			}
		} catch (error) {
			console.error('Upload failed', error);
			toast.error(error instanceof Error ? error.message : 'Неуспешно качване на файла');
		} finally {
			isUploading = false;
			uploadingFileName = null;
		}
	}

	async function deleteFile(fileId: string) {
		disabled = true;
		try {
			const result = await deleteTestFileRemote({
				attemptId,
				questionId,
				fileId
			});

			if (result.success) {
				uploadedFiles = uploadedFiles.filter((f) => f.id !== fileId);

				// Notify parent
				onFilesChange?.(
					questionId,
					uploadedFiles.map((f) => f.id)
				);

				toast.success('Файлът е изтрит');
			} else {
				throw new Error('Неуспешно изтриване');
			}
		} catch (error) {
			console.error('Delete failed', error);
			toast.error('Неуспешно изтриване на файла');
		} finally {
			disabled = false;
		}
	}

	// ============================================================================
	// DRAG AND DROP HANDLING
	// ============================================================================

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!canUpload) return;
		isDragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragActive = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragActive = false;

		if (!canUpload) return;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFiles(files);
		}
	}

	function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFiles(target.files);
		}
		// Reset input
		target.value = '';
	}

	function openFilePicker() {
		if (canUpload && fileInputRef) {
			fileInputRef.click();
		}
	}

	// ============================================================================
	// MOBILE UPLOAD HANDLING
	// ============================================================================

	async function openMobileUploadModal() {
		try {
			const result = await generateUploadTokenRemote({ attemptId, questionId });
			if (result.token) {
				uploadToken = result.token;
				isMobileModalOpen = true;
				startPolling();
			} else {
				throw new Error('Неуспешно генериране на токен');
			}
		} catch (error) {
			console.error('Failed to generate upload token', error);
			toast.error('Неуспешно генериране на линк за мобилно качване');
		}
	}

	function closeMobileUploadModal() {
		isMobileModalOpen = false;
		uploadToken = null;
		stopPolling();
	}

	function startPolling() {
		if (pollInterval) return;

		pollInterval = setInterval(async () => {
			try {
				const result = await getUploadedFilesRemote({ attemptId, questionId });
				if (result.files) {
					const oldCount = uploadedFiles.length;
					uploadedFiles = result.files;

					if (result.files.length > oldCount) {
						// New files uploaded from mobile
						onFilesChange?.(
							questionId,
							uploadedFiles.map((f) => f.id)
						);
					}
				}
			} catch (error) {
				console.error('Polling failed', error);
			}
		}, 3000);
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	// ============================================================================
	// HELPER FUNCTIONS
	// ============================================================================

	function getFileIcon(contentType: string) {
		if (contentType.startsWith('image/')) return ImageIcon;
		if (contentType === 'application/pdf') return FileText;
		return FileIcon;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function getAcceptString(): string {
		return config.allowedTypes.join(',');
	}
</script>

<div class="space-y-4">
	<!-- Instructions -->
	{#if config.instructions}
		<p class="text-sm text-muted-foreground">{config.instructions}</p>
	{/if}

	<!-- File count indicator -->
	<div class="flex items-center justify-between text-sm">
		<div class="flex items-center gap-2">
			<span class="text-muted-foreground">
				Качени файлове: {uploadedFiles.length} / {config.maxFiles}
			</span>
			<Button
				variant="ghost"
				size="icon-sm"
				class="h-6 w-6"
				onclick={refreshFiles}
				disabled={isRefreshing}
				title="Обнови списъка с файлове"
			>
				<RefreshCw class="h-3.5 w-3.5 {isRefreshing ? 'animate-spin' : ''}" />
			</Button>
		</div>
		<span class="text-muted-foreground">
			Позволени типове: {allowedTypesDisplay} (макс. {config.maxFileSizeMB} MB)
		</span>
	</div>

	<!-- Drop zone -->
	<div
		role="button"
		tabindex={canUpload ? 0 : -1}
		class="relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
			{isDragActive
			? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
			: 'border-gray-300 dark:border-gray-600'}
			{canUpload
			? 'cursor-pointer hover:border-blue-400 hover:bg-gray-50 dark:hover:border-blue-500 dark:hover:bg-gray-800/50'
			: 'cursor-not-allowed opacity-60'}"
		ondragenter={handleDragEnter}
		ondragleave={handleDragLeave}
		ondragover={handleDragOver}
		ondrop={handleDrop}
		onclick={openFilePicker}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') openFilePicker();
		}}
	>
		{#if isUploading}
			<Loader2 class="mx-auto h-12 w-12 animate-spin text-blue-500" />
			<p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
				Качване на {uploadingFileName}...
			</p>
		{:else}
			<Upload class="mx-auto h-12 w-12 text-gray-400" />
			<p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
				{#if isMaxFilesReached}
					Максималният брой файлове е достигнат
				{:else if disabled}
					Качването е деактивирано
				{:else}
					Плъзнете и пуснете файлове тук или кликнете за избор
				{/if}
			</p>
		{/if}

		<!-- Hidden file input for clicking -->
		<input
			bind:this={fileInputRef}
			type="file"
			class="hidden"
			accept={getAcceptString()}
			multiple={config.maxFiles > 1}
			disabled={!canUpload}
			onchange={handleFileInputChange}
		/>
	</div>

	<!-- Mobile upload button -->
	{#if canUpload}
		<Button variant="outline" class="w-full gap-2" onclick={openMobileUploadModal}>
			<Smartphone class="h-4 w-4" />
			Качи от телефон (QR код)
		</Button>
	{/if}

	<!-- Uploaded files list -->
	{#if uploadedFiles.length > 0}
		<div class="space-y-2">
			{#each uploadedFiles as file (file.id)}
				{@const Icon = getFileIcon(file.contentType)}
				<div
					class="flex items-center gap-3 rounded-lg border bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
				>
					<!-- File preview/icon -->
					{#if file.contentType.startsWith('image/')}
						<div class="h-12 w-12 shrink-0 overflow-hidden rounded bg-gray-100">
							<img
								src="/api/file/{file.fileKey}"
								alt={file.name}
								class="h-full w-full object-cover"
							/>
						</div>
					{:else}
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700"
						>
							<Icon class="h-6 w-6 text-gray-500" />
						</div>
					{/if}

					<!-- File info -->
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{file.name}</p>
						<p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
					</div>

					<!-- Delete button -->
					{#if !disabled}
						<Button
							variant="ghost"
							size="icon-sm"
							class="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
							onclick={() => deleteFile(file.id)}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Mobile Upload Modal -->
{#if isMobileModalOpen && uploadToken}
	<MobileUploadModal token={uploadToken} onClose={closeMobileUploadModal} />
{/if}
