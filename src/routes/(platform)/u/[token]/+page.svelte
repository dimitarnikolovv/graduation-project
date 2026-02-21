<script lang="ts">
	/**
	 * Mobile Upload Page
	 *
	 * A minimal, mobile-optimized page for uploading files from a phone.
	 * Features:
	 * - Camera capture button
	 * - Gallery picker button
	 * - Upload progress indicator
	 * - Success/error feedback
	 * - Countdown timer for token expiration
	 * - List of uploaded files
	 */
	import { Button } from '$lib/components/ui/button';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import Camera from '@lucide/svelte/icons/camera';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileIcon from '@lucide/svelte/icons/file';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const { data } = $props();

	// ============================================================================
	// TYPES
	// ============================================================================

	type UploadedFile = {
		id: string;
		name: string;
		size: number;
		contentType: string;
	};

	// ============================================================================
	// STATE
	// ============================================================================

	type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

	let uploadStatus = $state<UploadStatus>('idle');
	let errorMessage = $state<string | null>(null);
	// Initialize with existing files from server
	let uploadedFiles = $state<UploadedFile[]>(data.existingFiles ?? []);

	let cameraInputRef = $state<HTMLInputElement | null>(null);
	let galleryInputRef = $state<HTMLInputElement | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	// Timer state
	let remainingSeconds = $state(0);
	let isExpired = $state(false);
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// ============================================================================
	// TIMER
	// ============================================================================

	onMount(() => {
		// Calculate initial remaining time
		const expiresAt = new Date(data.expiresAt).getTime();
		updateRemainingTime(expiresAt);

		// Update every second
		timerInterval = setInterval(() => {
			updateRemainingTime(expiresAt);
		}, 1000);

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});

	function updateRemainingTime(expiresAt: number) {
		const now = Date.now();
		const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
		remainingSeconds = remaining;
		isExpired = remaining <= 0;

		if (isExpired && timerInterval) {
			clearInterval(timerInterval);
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	let allowedTypesDisplay = $derived.by(() => {
		return data.config.allowedTypes
			.map((type: string) => {
				if (type === 'image/*') return 'изображения';
				if (type === 'application/pdf') return 'PDF';
				if (type.startsWith('image/')) return type.replace('image/', '');
				return type;
			})
			.join(', ');
	});

	let acceptString = $derived(data.config.allowedTypes.join(','));

	let isImageOnly = $derived(
		data.config.allowedTypes.every((t: string) => t.startsWith('image/') || t === 'image/*')
	);

	let allowMultiple = $derived(data.config.maxFiles > 1);

	let canUploadMore = $derived(uploadedFiles.length < data.config.maxFiles);

	let isTimeLow = $derived(remainingSeconds > 0 && remainingSeconds <= 120); // Less than 2 minutes

	// ============================================================================
	// FILE UPLOAD
	// ============================================================================

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) return;

		for (const file of Array.from(files)) {
			if (!canUploadMore) {
				errorMessage = `Максималният брой файлове (${data.config.maxFiles}) е достигнат`;
				uploadStatus = 'error';
				break;
			}
			await uploadFile(file);
		}

		// Reset input
		target.value = '';
	}

	async function uploadFile(file: File) {
		// Validate file size
		const maxSizeBytes = data.config.maxFileSizeMB * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			uploadStatus = 'error';
			errorMessage = `Файлът е твърде голям (максимум ${data.config.maxFileSizeMB} MB)`;
			return;
		}

		// Validate file type
		const isAllowedType = data.config.allowedTypes.some((allowed: string) => {
			if (allowed.endsWith('/*')) {
				const category = allowed.replace('/*', '');
				return file.type.startsWith(category + '/');
			}
			return file.type === allowed;
		});

		if (!isAllowedType) {
			uploadStatus = 'error';
			errorMessage = `Неразрешен тип файл. Позволени: ${allowedTypesDisplay}`;
			return;
		}

		uploadStatus = 'uploading';
		errorMessage = null;

		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await fetch(`/u/${page.params.token}/upload`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Неуспешно качване');
			}

			const result = await response.json();

			if (result.success && result.file) {
				// Add to uploaded files list
				uploadedFiles = [
					...uploadedFiles,
					{
						id: result.file.id,
						name: result.file.name,
						size: result.file.size,
						contentType: result.file.contentType
					}
				];

				uploadStatus = 'success';

				// Reset to idle after showing success
				setTimeout(() => {
					uploadStatus = 'idle';
				}, 2000);
			} else {
				throw new Error('Неуспешно качване');
			}
		} catch (err) {
			uploadStatus = 'error';
			errorMessage = err instanceof Error ? err.message : 'Неуспешно качване';
		}
	}

	function openCamera() {
		if (isExpired) return;
		cameraInputRef?.click();
	}

	function openGallery() {
		if (isExpired) return;
		galleryInputRef?.click();
	}

	function openFilePicker() {
		if (isExpired) return;
		fileInputRef?.click();
	}

	// ============================================================================
	// HELPERS
	// ============================================================================

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
</script>

<svelte:head>
	<title>Качване на файл | {data.testTitle}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Header -->
	<header class="bg-white px-4 py-4 shadow-sm dark:bg-gray-800">
		<div class="mx-auto max-w-md">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h1 class="text-lg font-semibold text-gray-900 dark:text-white">
						{data.testTitle}
					</h1>
					<p class="text-sm text-muted-foreground">Въпрос {data.questionNumber}</p>
				</div>

				<!-- Timer -->
				<div
					class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
						{isExpired
						? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
						: isTimeLow
							? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
							: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}"
				>
					<Clock class="h-4 w-4" />
					{#if isExpired}
						Изтекъл
					{:else}
						{formatTime(remainingSeconds)}
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="mx-auto max-w-md px-4 py-8">
		<!-- Expired message -->
		{#if isExpired}
			<div class="mb-6 rounded-lg bg-red-50 p-6 dark:bg-red-950/30">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900"
					>
						<AlertCircle class="h-5 w-5 text-red-600 dark:text-red-400" />
					</div>
					<div>
						<p class="font-medium text-red-800 dark:text-red-200">Линкът е изтекъл</p>
						<p class="text-sm text-red-600 dark:text-red-300">
							Моля, генерирайте нов линк от компютъра.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Question content -->
		<div
			class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
				Въпрос
			</div>
			<div class="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
				<RenderStyledHtml renderAsInlineBlock={true}>
					{@html data.questionStem}
				</RenderStyledHtml>
			</div>
			{#if data.config.instructions}
				<div
					class="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-300"
				>
					<span class="font-medium">Инструкции:</span>
					{data.config.instructions}
				</div>
			{/if}
		</div>

		<!-- Uploaded files list -->
		{#if uploadedFiles.length > 0}
			<div
				class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="mb-3 flex items-center justify-between">
					<div class="text-sm font-medium text-gray-900 dark:text-gray-100">Качени файлове</div>
					<span
						class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
					>
						{uploadedFiles.length} / {data.config.maxFiles}
					</span>
				</div>
				<div class="space-y-2">
					{#each uploadedFiles as file (file.id)}
						{@const Icon = getFileIcon(file.contentType)}
						<div class="flex items-center gap-3 rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-200 dark:bg-gray-600"
							>
								<Icon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
									{file.name}
								</p>
								<p class="text-xs text-muted-foreground">
									{formatFileSize(file.size)}
								</p>
							</div>
							<Check class="h-5 w-5 shrink-0 text-green-500" />
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Info card -->
		{#if !isExpired && canUploadMore}
			<div class="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
				<p class="text-sm text-blue-800 dark:text-blue-200">
					Качете файл от камерата или галерията на вашето устройство.
				</p>
				<p class="mt-2 text-xs text-blue-600 dark:text-blue-300">
					Позволени типове: {allowedTypesDisplay}
					<br />
					Максимален размер: {data.config.maxFileSizeMB} MB
					{#if data.config.maxFiles > 1}
						<br />
						Оставащи файлове: {data.config.maxFiles - uploadedFiles.length} от {data.config
							.maxFiles}
					{/if}
				</p>
			</div>
		{:else if !isExpired && !canUploadMore}
			<div class="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
				<p class="text-sm font-medium text-green-800 dark:text-green-200">
					Максималният брой файлове е достигнат.
				</p>
				<p class="mt-1 text-xs text-green-600 dark:text-green-300">
					Можете да затворите тази страница.
				</p>
			</div>
		{/if}

		<!-- Upload status -->
		{#if uploadStatus === 'uploading'}
			<div class="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<div class="flex items-center gap-3">
					<Loader2 class="h-6 w-6 animate-spin text-blue-600" />
					<div class="flex-1">
						<p class="font-medium">Качване...</p>
					</div>
				</div>
			</div>
		{:else if uploadStatus === 'success'}
			<div class="mb-6 rounded-lg bg-green-50 p-6 dark:bg-green-950/30">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
					>
						<Check class="h-5 w-5 text-green-600 dark:text-green-400" />
					</div>
					<div>
						<p class="font-medium text-green-800 dark:text-green-200">Файлът е качен успешно!</p>
					</div>
				</div>
			</div>
		{:else if uploadStatus === 'error'}
			<div class="mb-6 rounded-lg bg-red-50 p-6 dark:bg-red-950/30">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900"
					>
						<X class="h-5 w-5 text-red-600 dark:text-red-400" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-red-800 dark:text-red-200">Грешка при качване</p>
						<p class="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Upload buttons -->
		{#if !isExpired && canUploadMore}
			<div class="space-y-4">
				<!-- Camera button (for images only) -->
				{#if isImageOnly}
					<Button
						class="h-16 w-full gap-3 text-lg"
						onclick={openCamera}
						disabled={uploadStatus === 'uploading'}
					>
						<Camera class="h-6 w-6" />
						Снимай с камера
					</Button>

					<Button
						variant="secondary"
						class="h-16 w-full gap-3 text-lg"
						onclick={openGallery}
						disabled={uploadStatus === 'uploading'}
					>
						<ImageIcon class="h-6 w-6" />
						{allowMultiple ? 'Избери изображения' : 'Избери от галерия'}
					</Button>
				{:else}
					<Button
						class="h-16 w-full gap-3 text-lg"
						onclick={openFilePicker}
						disabled={uploadStatus === 'uploading'}
					>
						<FileIcon class="h-6 w-6" />
						{allowMultiple ? 'Избери файлове' : 'Избери файл'}
					</Button>

					{#if data.config.allowedTypes.some((t: string) => t.startsWith('image/'))}
						<Button
							variant="secondary"
							class="h-16 w-full gap-3 text-lg"
							onclick={openCamera}
							disabled={uploadStatus === 'uploading'}
						>
							<Camera class="h-6 w-6" />
							Снимай с камера
						</Button>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Hidden inputs -->
		<input
			bind:this={cameraInputRef}
			type="file"
			accept="image/*"
			capture="environment"
			class="hidden"
			onchange={handleFileSelect}
		/>

		<input
			bind:this={galleryInputRef}
			type="file"
			accept={acceptString}
			multiple={allowMultiple}
			class="hidden"
			onchange={handleFileSelect}
		/>

		<input
			bind:this={fileInputRef}
			type="file"
			accept={acceptString}
			multiple={allowMultiple}
			class="hidden"
			onchange={handleFileSelect}
		/>

		<!-- Footer info -->
		{#if !isExpired}
			<div class="mt-8 text-center text-xs text-muted-foreground">
				<p>Качените файлове ще се появят автоматично на компютъра ви.</p>
				{#if uploadedFiles.length > 0}
					<p class="mt-1">Можете да затворите тази страница.</p>
				{/if}
			</div>

			<!-- Warning about expiration -->
			{#if isTimeLow}
				<div class="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
					<p class="text-xs text-amber-800 dark:text-amber-200">
						Линкът изтича скоро! Побързайте с качването.
					</p>
				</div>
			{/if}
		{/if}
	</main>
</div>
