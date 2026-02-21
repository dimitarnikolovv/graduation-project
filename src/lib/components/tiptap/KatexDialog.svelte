<script lang="ts">
	import katex from 'katex';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { Editor } from '@tiptap/core';
	import Button from '../ui/button/button.svelte';
	import { useId } from 'bits-ui';
	import { ScrollArea } from '../ui/scroll-area';

	type Props = {
		editor: Editor | null;
		open: boolean;
		katexMode: 'inline' | 'block';
		katexInput?: string;
		isEditingExisting?: boolean;
		editingNodePos?: number;
	};

	let {
		editor = $bindable(),
		open = $bindable(),
		katexMode,
		katexInput,
		isEditingExisting = false,
		editingNodePos = 0
	}: Props = $props();

	let katexInputId = useId();

	let katexInputRef: HTMLTextAreaElement | null = $state(null);

	function focusKatexInput(open: boolean) {
		if (open && katexInputRef) {
			katexInputRef?.focus();
		}
	}

	// KaTeX dialog state
	let katexError: string | null = $state(null);
	let katexPreview: string | null = $state(null);

	function validateKatex(latex: string | undefined) {
		if (!latex) {
			katexPreview = null;
			katexError = null;
			return false;
		}

		try {
			const html = katex.renderToString(latex, {
				throwOnError: true,
				displayMode: katexMode === 'block'
			});
			katexError = null;
			katexPreview = html;
			return true;
		} catch (error) {
			katexError = error instanceof Error ? error.message : 'Невалиден KaTeX израз.';
			katexPreview = null;
			return false;
		}
	}

	function handleKatexSubmit() {
		if (!katexInput) {
			katexError = 'Моля, въведете KaTeX израз.';
			return;
		}

		if (!validateKatex(katexInput)) {
			return;
		}

		if (isEditingExisting) {
			// Update existing math node
			if (katexMode === 'inline') {
				editor
					?.chain()
					.setNodeSelection(editingNodePos)
					.updateInlineMath({ latex: katexInput })
					.focus()
					.run();
			} else {
				editor
					?.chain()
					.setNodeSelection(editingNodePos)
					.updateBlockMath({ latex: katexInput })
					.focus()
					.run();
			}
		} else {
			// Insert new math node
			if (katexMode === 'inline') {
				editor?.chain().insertInlineMath({ latex: katexInput }).focus().run();
			} else {
				editor?.chain().insertBlockMath({ latex: katexInput }).focus().run();
			}
		}

		open = false;
		katexInput = undefined;
		katexError = null;
		katexPreview = null;
		isEditingExisting = false;
		editingNodePos = 0;
	}

	// Watch for changes in katexInput to update preview
	$effect(() => {
		if (open) {
			validateKatex(katexInput);
		}
	});
</script>

<!-- KaTeX Dialog -->
<Dialog.Root bind:open onOpenChangeComplete={focusKatexInput}>
	<Dialog.Content class="w-full sm:max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>
				{isEditingExisting ? 'Редактирай' : 'Вмъкни'}
				{katexMode === 'inline' ? 'вмъкнат' : 'блоков'} израз
			</Dialog.Title>
			<Dialog.Description>
				Въведете KaTeX израз. {katexMode === 'inline'
					? 'Изразът ще се показва на един ред с текста.'
					: 'Изразът ще се показва като блок на отделен ред.'}
				Можете да използвате стандартен KaTeX синтаксис. За повече информация вижте
				<a
					href="/documents/katex-docs.pdf"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 underline hover:text-blue-800"
					>документа с разрешени команди и символи</a
				>.
			</Dialog.Description>
		</Dialog.Header>

		<ScrollArea orientation="vertical" class="-mx-2 max-h-[calc(100vh-200px)] min-w-0">
			<div class="space-y-4 px-2">
				<div class="space-y-2">
					<label for={katexInputId} class="text-sm font-medium">KaTeX израз</label>
					<Textarea
						bind:value={katexInput}
						id={katexInputId}
						bind:ref={katexInputRef}
						placeholder="Въведете KaTeX израз (напр. x^2 + y^2 = z^2)"
						class="max-h-[400px] min-h-24 font-mono"
					/>
				</div>

				{#if katexError}
					<div
						class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
					>
						<strong>Грешка:</strong>
						{katexError}
					</div>
				{/if}

				{#if katexPreview && katexPreview.length > 0}
					<div class="space-y-2">
						<span class="block text-sm font-medium">Преглед</span>
						<div
							class="katex-preview thin-scrollbar overflow-x-auto rounded-md border bg-gray-50 p-4 dark:bg-gray-900"
						>
							<div class:text-center={katexMode === 'block'}>
								{@html katexPreview}
							</div>
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
				onclick={handleKatexSubmit}
				disabled={!katexInput || !!katexError}
			>
				{isEditingExisting ? 'Запази' : 'Вмъкни'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
