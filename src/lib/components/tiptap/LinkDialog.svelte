<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import type { Editor } from '@tiptap/core';
	import Button from '../ui/button/button.svelte';
	import LinkIcon from '@lucide/svelte/icons/link';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Unlink from '@lucide/svelte/icons/unlink';
	import z from 'zod';
	import { Input } from '../ui/input';
	import Checkbox from '../ui/checkbox/checkbox.svelte';

	type Props = {
		editor: Editor | null;
		open: boolean;
		linkUrl?: string;
		linkText?: string;
		isEditingExisting?: boolean;
	};

	let {
		editor = $bindable(),
		open = $bindable(),
		linkUrl,
		linkText,
		isEditingExisting = $bindable(false)
	}: Props = $props();

	// Link dialog state
	let urlInput = $state(linkUrl || '');
	let textInput = $state(linkText || '');
	let linkError: string | null = $state(null);
	let openInNewTab = $state(true);

	function validateUrl(url: string) {
		const schema = z.url();

		if (!url.trim()) {
			linkError = null;
			return false;
		}

		// Basic URL validation
		try {
			schema.parse(url);
			linkError = null;
			return true;
		} catch {
			linkError = 'Невалиден URL адрес.';
			return false;
		}
	}

	function handleLinkSubmit() {
		if (!urlInput.trim()) {
			linkError = 'Моля, въведете URL адрес.';
			return;
		}

		if (!validateUrl(urlInput)) {
			return;
		}

		if (isEditingExisting) {
			// Update existing link
			editor
				?.chain()
				.focus()
				.extendMarkRange('link')
				.setLink({
					href: urlInput,
					target: openInNewTab ? '_blank' : undefined,
					rel: openInNewTab ? 'noopener noreferrer' : undefined
				})
				.run();
		} else {
			// Insert new link
			const hasSelection = !editor?.state.selection.empty;

			if (hasSelection) {
				// If there's selected text, make it a link
				const { from, to } = editor?.state.selection || { from: 0, to: 0 };
				editor
					?.chain()
					.focus()
					.setLink({
						href: urlInput,
						target: openInNewTab ? '_blank' : undefined,
						rel: openInNewTab ? 'noopener noreferrer' : undefined
					})
					.run();

				// Move cursor to the end of the link
				editor?.chain().focus().setTextSelection(to).run();
			} else {
				// If no selection, insert the URL as both text and link
				const linkText = textInput.trim() || urlInput;
				const currentPos = editor?.state.selection.from || 0;

				// Insert the link with a space after it
				editor
					?.chain()
					.focus()
					.insertContent(
						`<a href="${urlInput}"${openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${linkText}</a> `
					)
					.run();

				// Position cursor after the link and space
				const newPos = currentPos + linkText.length + 2; // +2 for the space and closing tag
				editor?.chain().focus().setTextSelection(newPos).run();
			}
		}

		// Reset dialog state
		open = false;
		urlInput = '';
		textInput = '';
		linkError = null;
		openInNewTab = true;
		isEditingExisting = false;
	}

	function handleRemoveLink() {
		editor?.chain().focus().extendMarkRange('link').unsetLink().run();

		// Reset dialog state
		open = false;
		urlInput = '';
		textInput = '';
		linkError = null;
		openInNewTab = true;
		isEditingExisting = false;
	}

	// Watch for changes in urlInput to validate
	$effect(() => {
		if (open) {
			validateUrl(urlInput);
		}
	});

	// Reset state when dialog opens
	$effect(() => {
		if (open) {
			urlInput = linkUrl || '';
			textInput = linkText || '';
			linkError = null;
			openInNewTab = true;
			isEditingExisting = isEditingExisting;
		}
	});
</script>

<!-- Link Dialog -->
<Dialog.Root bind:open>
	<Dialog.Content class="w-full sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>
				{isEditingExisting ? 'Редактирай' : 'Вмъкни'} връзка
			</Dialog.Title>
			<Dialog.Description>
				Въведете URL адрес за създаване на връзка. Можете да изберете дали връзката да се отваря в
				нов прозорец.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<!-- URL input -->
			<div class="space-y-2">
				<label for="link-url" class="text-sm font-medium">URL адрес *</label>
				<Input
					autocomplete="off"
					id="link-url"
					bind:value={urlInput}
					onkeypress={(e) => {
						if (e.key === 'Enter') {
							handleLinkSubmit();
						}
					}}
					placeholder="https://example.com или mailto:email@example.com"
					class="font-mono"
				/>
			</div>

			<!-- Link text input (optional) -->
			<div class="space-y-2">
				<label for="link-text" class="text-sm font-medium">Текст на връзката (по избор)</label>
				<Input
					autocomplete="off"
					id="link-text"
					bind:value={textInput}
					placeholder="Оставете празно, за да използвате URL адреса като текст"
					onkeypress={(e) => {
						if (e.key === 'Enter') {
							handleLinkSubmit();
						}
					}}
				/>
			</div>

			<!-- Open in new tab option -->
			<div class="flex items-center space-x-2">
				<Checkbox
					id="open-new-tab"
					bind:checked={openInNewTab}
					class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
				/>
				<label for="open-new-tab" class="cursor-pointer text-sm font-medium">
					Отваряй в нов прозорец
				</label>
			</div>

			{#if linkError}
				<div
					class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
				>
					<strong>Грешка:</strong>
					{linkError}
				</div>
			{/if}

			<!-- URL preview -->
			{#if urlInput && !linkError}
				<div class="space-y-2">
					<span class="block text-sm font-medium">Преглед</span>
					<div class="rounded-md border bg-gray-50 p-3 dark:bg-gray-900">
						<div class="flex items-center gap-2">
							<LinkIcon size={16} class="text-blue-500" />
							<a
								href={urlInput}
								target={openInNewTab ? '_blank' : undefined}
								rel={openInNewTab ? 'noopener noreferrer' : undefined}
								class="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							>
								{textInput || urlInput}
							</a>
							{#if openInNewTab}
								<ExternalLink size={14} class="text-gray-400" />
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Dialog.Close class="flex flex-1">
				<Button class="flex-1" variant="outline">Отказ</Button>
			</Dialog.Close>
			{#if isEditingExisting}
				<Button type="button" class="flex-1" variant="destructive" onclick={handleRemoveLink}>
					<Unlink size={16} class="mr-2" />
					Премахни връзката
				</Button>
			{/if}
			<Button
				type="button"
				class="flex-1"
				onclick={handleLinkSubmit}
				disabled={!urlInput.trim() || !!linkError}
			>
				{isEditingExisting ? 'Запази' : 'Вмъкни'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
