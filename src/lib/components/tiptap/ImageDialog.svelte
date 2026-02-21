<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import type { Editor } from '@tiptap/core';
	import Button from '../ui/button/button.svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import LinkIcon from '@lucide/svelte/icons/link';
	import X from '@lucide/svelte/icons/x';
	import TextAlignStart from '@lucide/svelte/icons/text-align-start';
	import TextAlignCenter from '@lucide/svelte/icons/text-align-center';
	import TextAlignEnd from '@lucide/svelte/icons/text-align-end';
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte';
	import { untrack } from 'svelte';

	type Props = {
		editor: Editor | null;
		open: boolean;
		imageUrl?: string;
		imageWidth?: string;
		imageAlign?: 'left' | 'center' | 'right';
		imageDisplay?: 'inline' | 'block';
		isEditingExisting?: boolean;
		editingNodePos?: number;
	};

	let {
		editor = $bindable(),
		open = $bindable(),
		imageUrl,
		imageWidth,
		imageAlign,
		imageDisplay,
		isEditingExisting = false,
		editingNodePos = 0
	}: Props = $props();

	// Image dialog state
	let imageInput = $state(imageUrl || '');
	let imageError: string | null = $state(null);
	let imagePreview: string | null = $state(null);
	let uploadMode: 'url' | 'file' = $state('url');
	let selectedFile: File | null = $state(null);
	let fileInput: HTMLInputElement | undefined = $state();
	let widthInput = $state(imageWidth || '100%');
	let alignInput: 'left' | 'center' | 'right' = $state(imageAlign || 'center');
	let displayInput: 'inline' | 'block' = $state(imageDisplay || 'block');

	function validateImageUrl(url: string) {
		if (!url.trim()) {
			imagePreview = null;
			imageError = null;
			return false;
		}

		// Basic URL validation
		try {
			new URL(url);
			imageError = null;
			imagePreview = url;
			return true;
		} catch {
			imageError = 'Невалиден URL адрес.';
			imagePreview = null;
			return false;
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				imageError = 'Моля, изберете валиден файл с изображение.';
				selectedFile = null;
				imagePreview = null;
				return;
			}

			// Validate file size (max 2MB)
			if (file.size > 2 * 1024 * 1024) {
				imageError = 'Файлът е твърде голям. Максималният размер е 2MB.';
				selectedFile = null;
				imagePreview = null;
				return;
			}

			selectedFile = file;
			imageError = null;

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function clearFile() {
		selectedFile = null;
		imagePreview = null;
		imageError = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function handleImageSubmit() {
		if (uploadMode === 'url') {
			if (!imageInput.trim()) {
				imageError = 'Моля, въведете URL адрес на изображението.';
				return;
			}

			if (!validateImageUrl(imageInput)) {
				return;
			}

			insertImage(imageInput);
		} else {
			if (!selectedFile) {
				imageError = 'Моля, изберете файл с изображение.';
				return;
			}

			// Convert file to base64 and insert
			const reader = new FileReader();
			reader.onload = (e) => {
				const base64Url = e.target?.result as string;
				insertImage(base64Url);
			};
			reader.readAsDataURL(selectedFile);
		}
	}

	function insertImage(src: string) {
		const attrs = {
			src,
			customWidth: widthInput,
			align: alignInput,
			display: displayInput
		};

		if (isEditingExisting) {
			// Update existing image node
			editor?.chain().setNodeSelection(editingNodePos).setImage(attrs).focus().run();
		} else {
			// Insert new image node
			editor?.chain().focus().setImage(attrs).run();
		}

		// Reset dialog state
		resetDialog();
	}

	function resetDialog() {
		open = false;
		imageInput = '';
		imageError = null;
		imagePreview = null;
		selectedFile = null;
		widthInput = '100%';
		alignInput = 'center';
		displayInput = 'block';
		isEditingExisting = false;
		editingNodePos = 0;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Watch for changes in imageInput to update preview
	$effect(() => {
		if (open && uploadMode === 'url') {
			validateImageUrl(imageInput);
		}
	});

	// Auto-adjust width when switching between inline and block
	$effect(() => {
		if (open && !isEditingExisting) {
			// When switching to inline mode, suggest a smaller default width
			if (displayInput === 'inline' && widthInput === '100%') {
				widthInput = 'auto';
			}
			// When switching to block mode, suggest full width
			else if (displayInput === 'block' && widthInput === 'auto') {
				widthInput = '100%';
			}
		}
	});

	// Reset state when dialog opens
	$effect(() => {
		if (open) {
			untrack(() => {
				imageInput = imageUrl || '';
				widthInput = imageWidth || '100%';
				alignInput = imageAlign || 'center';
				displayInput = imageDisplay || 'block';
				uploadMode = 'url';
				selectedFile = null;
				imageError = null;
				// Set preview to existing image URL if editing, otherwise clear it
				imagePreview = imageUrl || null;
				if (fileInput) {
					fileInput.value = '';
				}
			});
		}
	});
</script>

<!-- Image Dialog -->
<Dialog.Root bind:open>
	<Dialog.Content class="w-full sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>
				{isEditingExisting ? 'Редактирай' : 'Вмъкни'} изображение
			</Dialog.Title>
			<Dialog.Description>
				Можете да вмъкнете изображение като въведете URL адрес или като качите файл от вашия
				компютър.
			</Dialog.Description>
		</Dialog.Header>

		<ScrollArea orientation="vertical" class="-mx-2 max-h-[calc(100vh-200px)]">
			<div class="space-y-4 px-2">
				<!-- Upload mode selector -->
				<div class="flex gap-2">
					<button
						type="button"
						class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {uploadMode ===
						'url'
							? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
							: 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}"
						onclick={() => (uploadMode = 'url')}
					>
						<LinkIcon size={16} />
						URL адрес
					</button>
					<button
						type="button"
						class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {uploadMode ===
						'file'
							? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
							: 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}"
						onclick={() => (uploadMode = 'file')}
					>
						<Upload size={16} />
						Качи файл
					</button>
				</div>

				{#if uploadMode === 'url'}
					<!-- URL input -->
					<div class="space-y-2">
						<label for="image-url" class="text-sm font-medium">URL адрес на изображението</label>
						<Textarea
							id="image-url"
							bind:value={imageInput}
							placeholder="https://example.com/image.jpg"
							class="thin-scrollbar max-h-30 font-mono text-wrap wrap-anywhere"
							rows={2}
						/>
					</div>
				{:else}
					<!-- File upload -->
					<div class="space-y-2">
						<label for="image-file" class="text-sm font-medium">Изберете файл с изображение</label>
						<div class="flex items-center gap-2">
							<input
								bind:this={fileInput}
								type="file"
								id="image-file"
								accept="image/*"
								onchange={handleFileSelect}
								class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:border-gray-600 dark:file:bg-blue-950 dark:file:text-blue-300"
							/>
							{#if selectedFile}
								<button
									type="button"
									onclick={clearFile}
									class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
									title="Премахни файла"
								>
									<X size={16} />
								</button>
							{/if}
						</div>
						{#if selectedFile}
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Избран файл: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
							</p>
						{/if}
					</div>
				{/if}

				<!-- Display mode selector -->
				<div class="space-y-2">
					<span class="text-sm font-medium">Начин на показване</span>
					<div class="flex gap-2">
						<button
							type="button"
							class="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {displayInput ===
							'inline'
								? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
								: 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}"
							onclick={() => (displayInput = 'inline')}
						>
							На един ред с текста
						</button>
						<button
							type="button"
							class="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {displayInput ===
							'block'
								? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
								: 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}"
							onclick={() => (displayInput = 'block')}
						>
							Блоков елемент
						</button>
					</div>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						{displayInput === 'inline'
							? 'Изображението ще бъде на един ред с текста'
							: 'Изображението ще бъде на отделен ред'}
					</p>
				</div>

				<!-- Image sizing controls -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="image-width" class="text-sm font-medium">Ширина</label>
						<Input
							autocomplete="off"
							id="image-width"
							bind:value={widthInput}
							placeholder="100%, 500px, auto"
							class="font-mono"
						/>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							Използвайте <span class="font-mono font-bold">%</span>,
							<span class="font-mono font-bold">px</span>
							или <span class="font-mono font-bold">auto</span>
						</p>
					</div>

					{#if displayInput === 'block'}
						<div class="space-y-2">
							<span class="text-sm font-medium">Подравняване</span>
							<div class="flex gap-2">
								<button
									type="button"
									class="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {alignInput ===
									'left'
										? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
										: 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}"
									onclick={() => (alignInput = 'left')}
									title="Ляво"
								>
									<TextAlignStart size={16} />
								</button>
								<button
									type="button"
									class="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {alignInput ===
									'center'
										? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
										: 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}"
									onclick={() => (alignInput = 'center')}
									title="Център"
								>
									<TextAlignCenter size={16} />
								</button>
								<button
									type="button"
									class="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {alignInput ===
									'right'
										? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
										: 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}"
									onclick={() => (alignInput = 'right')}
									title="Дясно"
								>
									<TextAlignEnd size={16} />
								</button>
							</div>
						</div>
					{/if}
				</div>

				{#if imageError}
					<div
						class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
					>
						<strong>Грешка:</strong>
						{imageError}
					</div>
				{/if}

				{#if imagePreview}
					<div class="space-y-2">
						<span class="block text-sm font-medium">Преглед</span>
						<div class="rounded-md border bg-gray-50 p-4 dark:bg-gray-900">
							{#if displayInput === 'inline'}
								<div class="text-base">
									Това е пример текст,
									<img
										src={imagePreview}
										alt="Преглед на изображението"
										class="inline-block rounded align-middle"
										style="width: {widthInput}; height: auto;"
										onerror={() => {
											imageError = 'Не може да се зареди изображението.';
											imagePreview = null;
										}}
									/>
									който показва как изображението ще изглежда на реда.
								</div>
							{:else}
								<div class="w-full">
									<img
										src={imagePreview}
										alt="Преглед на изображението"
										class="rounded object-contain"
										style="width: {widthInput}; margin-left: {alignInput === 'left'
											? '0'
											: alignInput === 'right'
												? 'auto'
												: 'auto'}; margin-right: {alignInput === 'left'
											? 'auto'
											: alignInput === 'right'
												? '0'
												: 'auto'}; display: block;"
										onerror={() => {
											imageError = 'Не може да се зареди изображението.';
											imagePreview = null;
										}}
									/>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</ScrollArea>

		<Dialog.Footer>
			<Dialog.Close class="flex flex-1">
				<Button class="flex-1" variant="outline">Отказ</Button>
			</Dialog.Close>
			<Button
				type="button"
				class="flex-1"
				onclick={handleImageSubmit}
				disabled={uploadMode === 'url'
					? !imageInput.trim() || !!imageError
					: !selectedFile || !!imageError}
			>
				{isEditingExisting ? 'Запази' : 'Вмъкни'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
