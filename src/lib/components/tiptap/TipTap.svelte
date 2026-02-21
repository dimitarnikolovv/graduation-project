<script lang="ts">
	import 'katex/dist/katex.min.css';
	import { untrack, type Component } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import TextAlign from '@tiptap/extension-text-align';
	import Color from '@tiptap/extension-color';
	import { TextStyle } from '@tiptap/extension-text-style';
	import MathExtension, { migrateMathStrings } from '@tiptap/extension-mathematics';
	import Image from '@tiptap/extension-image';
	import FontFamily from '@tiptap/extension-font-family';
	import Subscript from '@tiptap/extension-subscript';
	import Superscript from '@tiptap/extension-superscript';
	import Highlight from '@tiptap/extension-highlight';
	import Bold from '@lucide/svelte/icons/bold';
	import Italic from '@lucide/svelte/icons/italic';
	import UnderlineIcon from '@lucide/svelte/icons/underline';
	import Strikethrough from '@lucide/svelte/icons/strikethrough';
	import Code from '@lucide/svelte/icons/code';
	import Heading1 from '@lucide/svelte/icons/heading-1';
	import Heading2 from '@lucide/svelte/icons/heading-2';
	import Heading3 from '@lucide/svelte/icons/heading-3';
	import List from '@lucide/svelte/icons/list';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import Quote from '@lucide/svelte/icons/quote';
	import CodeBlockIcon from '@lucide/svelte/icons/code';
	import SubscriptIcon from '@lucide/svelte/icons/subscript';
	import SuperscriptIcon from '@lucide/svelte/icons/superscript';
	import TextAlignStart from '@lucide/svelte/icons/text-align-start';
	import TextAlignCenter from '@lucide/svelte/icons/text-align-center';
	import TextAlignEnd from '@lucide/svelte/icons/text-align-end';
	import TextAlignJustify from '@lucide/svelte/icons/text-align-justify';
	import Type from '@lucide/svelte/icons/type';
	import LinkIcon from '@lucide/svelte/icons/link';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Calculator from '@lucide/svelte/icons/calculator';
	import TextColorIcon from '@lucide/svelte/icons/type';
	import Highlighter from '@lucide/svelte/icons/highlighter';
	import SquareFunction from '@lucide/svelte/icons/square-function';
	import Heading4 from '@lucide/svelte/icons/heading-4';
	import Heading5 from '@lucide/svelte/icons/heading-5';
	import Heading6 from '@lucide/svelte/icons/heading-6';
	import type { IconProps } from '@lucide/svelte';
	import { cn, type WithElementRef } from '$lib/utils';
	import KatexDialog from './KatexDialog.svelte';
	import ImageDialog from './ImageDialog.svelte';
	import LinkDialog from './LinkDialog.svelte';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import { findLinkExtent } from './links';
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	> & {
		value: string | null | undefined;
		class?: string;
		includeImages?: boolean;
		minimal?: boolean;
	};

	let {
		value = $bindable(),
		class: className,
		includeImages = true,
		minimal = false,
		disabled = false,
		...restProps
	}: Props = $props();

	let element: HTMLDivElement | undefined = $state();
	let editor: Editor | null = $state(null);
	let textColor = $state('#000000');
	let backgroundColor = $state('#ffffff');

	// KaTeX dialog state
	let showKatexDialog = $state(false);
	let katexInput = $state('');
	let katexMode: 'inline' | 'block' = $state('inline');
	let isEditingExisting = $state(false);
	let editingNodePos = $state(0);

	// Image dialog state
	let showImageDialog = $state(false);
	let imageUrl = $state('');
	let imageWidth = $state('100%');
	let imageAlign: 'left' | 'center' | 'right' = $state('center');
	let imageDisplay: 'inline' | 'block' = $state('block');
	let isEditingImage = $state(false);
	let editingImagePos = $state(0);

	// Link dialog state
	let showLinkDialog = $state(false);
	let linkUrl = $state('');
	let linkText = $state('');
	let isEditingLink = $state(false);

	$effect(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3, 4, 5, 6]
					},
					link: {
						autolink: true,
						openOnClick: false,
						HTMLAttributes: {
							class: 'text-blue-500 underline'
						},
						protocols: ['https', 'mailto'],
						defaultProtocol: 'https'
					},
					codeBlock: {
						HTMLAttributes: {
							class: 'code-block'
						}
					},
					paragraph: {
						HTMLAttributes: {
							class: 'min-h-[1px]'
						}
					}
				}),
				MathExtension.configure({
					blockOptions: {
						onClick: (node, pos) => {
							openKatexDialog('block', node.attrs.latex, pos);
						}
					},
					inlineOptions: {
						onClick: (node, pos) => {
							openKatexDialog('inline', node.attrs.latex, pos);
						}
					},
					katexOptions: {
						throwOnError: false,
						output: 'html'
					}
				}),
				Image.extend({
					inline() {
						return true;
					},
					group() {
						return 'inline';
					},
					addAttributes() {
						return {
							...this.parent?.(),
							src: {
								default: null,
								parseHTML: (element) => element.getAttribute('src'),
								renderHTML: (attributes) => {
									if (!attributes.src) {
										return {};
									}
									return {
										src: attributes.src
									};
								}
							},
							customWidth: {
								default: '100%',
								parseHTML: (element) => element.getAttribute('data-width') || '100%',
								renderHTML: (attributes) => {
									return {
										'data-width': attributes.customWidth
									};
								}
							},
							align: {
								default: 'center',
								parseHTML: (element) => element.getAttribute('data-align') || 'center',
								renderHTML: (attributes) => {
									return {
										'data-align': attributes.align
									};
								}
							},
							display: {
								default: 'block',
								parseHTML: (element) => element.getAttribute('data-display') || 'block',
								renderHTML: (attributes) => {
									return {
										'data-display': attributes.display
									};
								}
							}
						};
					},
					renderHTML({ HTMLAttributes }) {
						const display = HTMLAttributes['data-display'] || 'block';
						const width = HTMLAttributes['data-width'] || '100%';
						const align = HTMLAttributes['data-align'] || 'center';

						let style = `max-width: 100%; height: auto; border-radius: 0.5rem;`;

						if (display === 'inline') {
							style += ` display: inline-block; vertical-align: middle; width: ${width};`;
						} else {
							style = `width: ${width}; ${style}`;
							const marginLeft = align === 'left' ? '0' : 'auto';
							const marginRight = align === 'right' ? '0' : 'auto';
							style += ` display: block; margin-left: ${marginLeft}; margin-right: ${marginRight};`;
						}

						return [
							'img',
							{ ...HTMLAttributes, style, class: `${display === 'inline' ? 'not-prose' : ''}` }
						];
					},
					addNodeView() {
						// renders the image in the editor
						return ({ node, getPos }) => {
							const display = node.attrs.display || 'block';

							// Create wrapper container
							const container = document.createElement(display === 'inline' ? 'span' : 'div');
							container.contentEditable = 'false';
							container.style.display = display === 'inline' ? 'inline' : 'block';

							const dom = document.createElement('img');
							dom.src = node.attrs.src;
							dom.setAttribute('data-width', node.attrs.customWidth);
							dom.setAttribute('data-align', node.attrs.align);
							dom.setAttribute('data-display', node.attrs.display);
							dom.className = `cursor-pointer`;

							// Set the inline style for width, alignment, and display
							const align = node.attrs.align;
							const width = node.attrs.customWidth || '100%';

							dom.style.maxWidth = '100%';
							dom.style.height = 'auto';
							dom.style.borderRadius = '0.5rem';

							if (display === 'inline') {
								dom.style.display = 'inline-block';
								dom.style.verticalAlign = 'middle';
								dom.style.width = width;
							} else {
								dom.style.width = width;
								dom.style.display = 'block';
								dom.style.marginLeft = align === 'left' ? '0' : 'auto';
								dom.style.marginRight = align === 'right' ? '0' : 'auto';
							}

							dom.addEventListener('click', (e) => {
								e.stopPropagation();
								const pos = typeof getPos === 'function' ? getPos() : 0;
								openImageDialog(
									node.attrs.src,
									node.attrs.customWidth,
									node.attrs.align,
									node.attrs.display,
									pos
								);
							});

							container.appendChild(dom);

							return { dom: container };
						};
					}
				}).configure({
					HTMLAttributes: {
						class: 'cursor-pointer'
					},
					allowBase64: true,
					resize: {
						enabled: true,
						alwaysPreserveAspectRatio: true
					}
				}),
				TextAlign.configure({
					types: ['heading', 'paragraph'],
					alignments: ['left', 'center', 'right', 'justify']
				}),
				Color,
				TextStyle,
				FontFamily,
				Subscript,
				Superscript,
				Highlight
			],
			content: untrack(() => value ?? ''),
			editorProps: {
				attributes: {
					class: 'tiptap'
				}
			},
			onCreate: ({ editor: currentEditor }) => {
				migrateMathStrings(currentEditor);
			},

			onUpdate: ({ editor: newEditor }) => {
				value = newEditor.getHTML();
			},
			onTransaction: ({ editor: newEditor }) => {
				// force re-render so editor.isActive works as expected
				editor = null;
				editor = newEditor;
			}
		});
	});

	$effect(() => {
		if (disabled) {
			untrack(() => editor?.setEditable(false));
		} else {
			untrack(() => editor?.setEditable(true));
		}
	});

	function openKatexDialog(mode: 'inline' | 'block', initialLatex = '', nodePos?: number) {
		katexMode = mode;
		katexInput = initialLatex;
		isEditingExisting = nodePos !== undefined;
		editingNodePos = nodePos || 0;
		showKatexDialog = true;
	}

	function openImageDialog(
		initialUrl = '',
		initialWidth = '100%',
		initialAlign: 'left' | 'center' | 'right' = 'center',
		initialDisplay: 'inline' | 'block' = 'block',
		nodePos?: number
	) {
		imageUrl = initialUrl;
		imageWidth = initialWidth;
		imageAlign = initialAlign;
		imageDisplay = initialDisplay;
		isEditingImage = nodePos !== undefined;
		editingImagePos = nodePos || 0;
		showImageDialog = true;
	}

	function openLinkDialog(initialUrl = '', initialText = '', isEditing = false) {
		linkUrl = initialUrl;
		linkText = initialText;
		isEditingLink = isEditing;
		showLinkDialog = true;
	}

	// Toolbar functions
	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleUnderline() {
		editor?.chain().focus().toggleUnderline().run();
	}

	function toggleStrike() {
		editor?.chain().focus().toggleStrike().run();
	}

	function toggleCode() {
		editor?.chain().focus().toggleCode().run();
	}

	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	function toggleCodeBlock() {
		editor?.chain().focus().toggleCodeBlock().run();
	}

	function setHeading(level: number) {
		editor
			?.chain()
			.focus()
			.toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
			.run();
	}

	function setParagraph() {
		editor?.chain().focus().setParagraph().run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleSubscript() {
		editor?.chain().focus().toggleSubscript().run();
	}

	function toggleSuperscript() {
		editor?.chain().focus().toggleSuperscript().run();
	}

	function setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify') {
		editor?.chain().focus().setTextAlign(alignment).run();
	}

	function setColor(color: string) {
		textColor = color;
		editor?.chain().focus().setColor(color).run();
	}

	function setBackgroundColor(color: string) {
		backgroundColor = color;
		editor?.chain().focus().setHighlight({ color }).run();
	}

	function setFontFamily(font: string) {
		editor?.chain().focus().setFontFamily(font).run();
	}

	function addLink() {
		if (!editor) return;

		const { from, to } = editor.state.selection;
		const selectedText = editor.state.doc.textBetween(from, to);

		// Function to find the full extent of a link at a given position

		// Check if we're in a link by looking at the current position
		const linkInfo = findLinkExtent({
			editor,
			pos: from
		});

		if (linkInfo) {
			// We're editing an existing link
			openLinkDialog(linkInfo.url, linkInfo.text, true);
		} else {
			// We're creating a new link
			// If there's selected text, use it as the link text
			// If no text is selected, leave it empty for the user to enter
			openLinkDialog('', selectedText, false);
		}
	}

	function addImage() {
		openImageDialog();
	}

	function toggleHighlight() {
		editor?.chain().focus().toggleHighlight().run();
	}

	function insertInlineMath() {
		const hasSelection = !editor?.state.selection.empty;

		if (hasSelection) {
			return editor?.chain().insertInlineMath({ latex: '' }).focus().run();
		}

		openKatexDialog('inline');
	}

	function insertBlockMath() {
		const hasSelection = !editor?.state.selection.empty;

		if (hasSelection && editor) {
			const { from, to } = editor.state.selection;
			const text = editor.state.doc.textBetween(from, to) || '';

			if (text.trim() !== '') {
				return editor.chain().insertBlockMath({ latex: text }).focus().run();
			}
		}

		openKatexDialog('block');
	}

	type MenuButtonProps = {
		title: string;
		onclick: () => void;
		isActive: boolean;
		Icon: Component<IconProps, {}, ''>;
	};
</script>

{#snippet menuButton({ title, onclick, isActive, Icon }: MenuButtonProps)}
	<button
		type="button"
		class={cn(
			'rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700',
			isActive && 'bg-gray-200 dark:bg-gray-600'
		)}
		{onclick}
		{title}
	>
		<Icon size={16} />
	</button>
{/snippet}

<div class="bg-background text-foreground rounded-md border">
	{#if editor}
		<!-- Toolbar -->
		<div class="flex flex-wrap gap-1 border-b p-2">
			<!-- Text formatting -->
			<div class="mr-2 flex gap-1 border-r pr-2">
				{@render menuButton({
					title: 'Bold',
					onclick: toggleBold,
					isActive: editor.isActive('bold'),
					Icon: Bold
				})}
				{@render menuButton({
					title: 'Italic',
					onclick: toggleItalic,
					isActive: editor.isActive('italic'),
					Icon: Italic
				})}
				{@render menuButton({
					title: 'Underline',
					onclick: toggleUnderline,
					isActive: editor.isActive('underline'),
					Icon: UnderlineIcon
				})}
				{@render menuButton({
					title: 'Strikethrough',
					onclick: toggleStrike,
					isActive: editor.isActive('strike'),
					Icon: Strikethrough
				})}
				{@render menuButton({
					title: 'Code',
					onclick: toggleCode,
					isActive: editor.isActive('code'),
					Icon: Code
				})}
				{@render menuButton({
					title: 'Highlight',
					onclick: toggleHighlight,
					isActive: editor.isActive('highlight'),
					Icon: Highlighter
				})}
			</div>

			<!-- Headings -->
			<div class="mr-2 flex gap-1 border-r pr-2">
				{#if !minimal}
					{@render menuButton({
						title: 'Heading 1',
						onclick: () => setHeading(1),
						isActive: editor.isActive('heading', { level: 1 }),
						Icon: Heading1
					})}
					{@render menuButton({
						title: 'Heading 2',
						onclick: () => setHeading(2),
						isActive: editor.isActive('heading', { level: 2 }),
						Icon: Heading2
					})}
					{@render menuButton({
						title: 'Heading 3',
						onclick: () => setHeading(3),
						isActive: editor.isActive('heading', { level: 3 }),
						Icon: Heading3
					})}
					{@render menuButton({
						title: 'Heading 4',
						onclick: () => setHeading(4),
						isActive: editor.isActive('heading', { level: 4 }),
						Icon: Heading4
					})}
					{@render menuButton({
						title: 'Heading 5',
						onclick: () => setHeading(5),
						isActive: editor.isActive('heading', { level: 5 }),
						Icon: Heading5
					})}
					{@render menuButton({
						title: 'Heading 6',
						onclick: () => setHeading(6),
						isActive: editor.isActive('heading', { level: 6 }),
						Icon: Heading6
					})}
				{/if}
				{@render menuButton({
					title: 'Normal Text',
					onclick: setParagraph,
					isActive: editor.isActive('paragraph'),
					Icon: Type
				})}
			</div>

			<!-- Lists -->
			<div class="mr-2 flex gap-1 border-r pr-2">
				{@render menuButton({
					title: 'Bullet List',
					onclick: toggleBulletList,
					isActive: editor.isActive('bulletList'),
					Icon: List
				})}
				{@render menuButton({
					title: 'Numbered List',
					onclick: toggleOrderedList,
					isActive: editor.isActive('orderedList'),
					Icon: ListOrdered
				})}
			</div>

			<!-- Block elements -->
			{#if !minimal}
				<div class="mr-2 flex gap-1 border-r pr-2">
					{@render menuButton({
						title: 'Blockquote',
						onclick: toggleBlockquote,
						isActive: editor.isActive('blockquote'),
						Icon: Quote
					})}
					{@render menuButton({
						title: 'Code Block',
						onclick: toggleCodeBlock,
						isActive: editor.isActive('codeBlock'),
						Icon: CodeBlockIcon
					})}
				</div>
			{/if}

			<!-- Script -->
			<div class="mr-2 flex gap-1 border-r pr-2">
				{@render menuButton({
					title: 'Subscript',
					onclick: toggleSubscript,
					isActive: editor.isActive('subscript'),
					Icon: SubscriptIcon
				})}
				{@render menuButton({
					title: 'Superscript',
					onclick: toggleSuperscript,
					isActive: editor.isActive('superscript'),
					Icon: SuperscriptIcon
				})}
			</div>

			<!-- Alignment -->
			{#if !minimal}
				<div class="mr-2 flex gap-1 border-r pr-2">
					{@render menuButton({
						title: 'Align Left',
						onclick: () => setTextAlign('left'),
						isActive: editor.isActive({ textAlign: 'left' }),
						Icon: TextAlignStart
					})}
					{@render menuButton({
						title: 'Align Center',
						onclick: () => setTextAlign('center'),
						isActive: editor.isActive({ textAlign: 'center' }),
						Icon: TextAlignCenter
					})}
					{@render menuButton({
						title: 'Align Right',
						onclick: () => setTextAlign('right'),
						isActive: editor.isActive({ textAlign: 'right' }),
						Icon: TextAlignEnd
					})}
					{@render menuButton({
						title: 'Justify',
						onclick: () => setTextAlign('justify'),
						isActive: editor.isActive({ textAlign: 'justify' }),
						Icon: TextAlignJustify
					})}
				</div>
			{/if}

			<!-- Colors -->
			<div class="mr-2 flex gap-1 border-r pr-2">
				<div class="relative">
					<input
						type="color"
						class="absolute h-8 w-8 cursor-pointer rounded border opacity-0"
						value={textColor}
						onchange={(e) => setColor((e.target as HTMLInputElement).value)}
						title="Text Color"
					/>
					<div
						class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 dark:border-gray-600"
						style="background-color: {textColor}"
					>
						<TextColorIcon
							size={14}
							class={textColor === '#000000' || textColor === '#ffffff'
								? 'text-gray-600 dark:text-gray-400'
								: ''}
							style={textColor !== '#000000' && textColor !== '#ffffff'
								? 'color: ' + (textColor === '#ffffff' ? '#000000' : '#ffffff')
								: ''}
						/>
					</div>
				</div>
				<div class="relative">
					<input
						type="color"
						class="absolute h-8 w-8 cursor-pointer rounded border opacity-0"
						value={backgroundColor}
						onchange={(e) => setBackgroundColor((e.target as HTMLInputElement).value)}
						title="Background Color"
					/>
					<div
						class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 dark:border-gray-600"
						style="background-color: {backgroundColor}"
					>
						<Highlighter
							size={14}
							class={backgroundColor === '#000000' || backgroundColor === '#ffffff'
								? 'text-gray-600 dark:text-gray-400'
								: ''}
							style={backgroundColor !== '#000000' && backgroundColor !== '#ffffff'
								? 'color: ' + (backgroundColor === '#ffffff' ? '#000000' : '#ffffff')
								: ''}
						/>
					</div>
				</div>
			</div>

			<!-- Font Family -->
			{#if !minimal}
				<div class="mr-2 flex gap-1 border-r pr-2">
					<select
						class="bg-background rounded border px-2 py-1 text-sm"
						onchange={(e) => setFontFamily((e.target as HTMLSelectElement).value)}
						title="Font Family"
					>
						<option value="">Default</option>
						<option value="Arial">Arial</option>
						<option value="Helvetica">Helvetica</option>
						<option value="Times New Roman">Times New Roman</option>
						<option value="Georgia">Georgia</option>
						<option value="Verdana">Verdana</option>
						<option value="Courier New">Courier New</option>
					</select>
				</div>
			{/if}

			<!-- Math and Media -->
			<div class="flex gap-1">
				{@render menuButton({
					title: 'Insert Inline Math',
					onclick: insertInlineMath,
					isActive: editor.isActive('inlineMath'),
					Icon: SquareFunction
				})}

				{#if !minimal}
					{@render menuButton({
						title: 'Insert Block Math',
						onclick: insertBlockMath,
						isActive: editor.isActive('blockMath'),
						Icon: Calculator
					})}
				{/if}

				{@render menuButton({
					title: 'Add Link',
					onclick: addLink,
					isActive: editor.isActive('link'),
					Icon: LinkIcon
				})}

				{#if !minimal || includeImages}
					{@render menuButton({
						title: 'Add Image',
						onclick: addImage,
						isActive: false,
						Icon: ImageIcon
					})}
				{/if}
			</div>
		</div>
	{/if}

	<!-- Editor -->
	<ScrollArea
		orientation="horizontal"
		class={cn('max-h-120 min-h-120 max-w-[calc(100vw-2rem)] overflow-auto', className)}
	>
		<div bind:this={element} class={cn('', className)}></div>
	</ScrollArea>
	<input {...restProps} class="sr-only" autocomplete="off" type="text" bind:value />
</div>

<KatexDialog
	bind:open={showKatexDialog}
	{katexInput}
	{katexMode}
	{isEditingExisting}
	{editingNodePos}
	{editor}
/>

<ImageDialog
	bind:open={showImageDialog}
	{imageUrl}
	{imageWidth}
	{imageAlign}
	{imageDisplay}
	isEditingExisting={isEditingImage}
	editingNodePos={editingImagePos}
	{editor}
/>

<LinkDialog
	bind:open={showLinkDialog}
	{linkUrl}
	{linkText}
	bind:isEditingExisting={isEditingLink}
	{editor}
/>

<style lang="postcss">
	:global(.ProseMirror) {
		overflow-x: auto;
		outline: none;
		padding: 1rem;
		min-height: 28rem;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.ProseMirror h1) {
		font-size: 2rem;
		font-weight: bold;
		margin: 1rem 0;
	}

	:global(.ProseMirror h2) {
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0.875rem 0;
	}

	:global(.ProseMirror h3) {
		font-size: 1.25rem;
		font-weight: bold;
		margin: 0.75rem 0;
	}

	:global(.ProseMirror h4) {
		font-size: 1.125rem;
		font-weight: bold;
		margin: 0.625rem 0;
	}

	:global(.ProseMirror h5) {
		font-size: 1rem;
		font-weight: bold;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror h6) {
		font-size: 0.875rem;
		font-weight: bold;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror blockquote) {
		border-left: 4px solid #e5e7eb;
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
	}

	:global(.ProseMirror code) {
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
	}

	:global(.ProseMirror pre) {
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.ProseMirror ul, .ProseMirror ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror ul) {
		list-style-type: disc;
	}

	:global(.ProseMirror ol) {
		list-style-type: decimal;
		counter-reset: list-counter;
	}

	:global(.ProseMirror li) {
		margin: 0.25rem 0;
	}

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
	}

	:global(.ProseMirror img[data-display='inline']) {
		display: inline-block;
		vertical-align: middle;
		/* max-height: 1.5em; */
		width: auto;
		margin: 0;
	}

	:global(.ProseMirror img[data-display='block']) {
		display: block;
		margin: 1rem 0;
	}

	:global(.ProseMirror a) {
		color: #3b82f6;
		text-decoration: underline;
	}

	:global(.ProseMirror a:hover) {
		color: #1d4ed8;
	}

	:global(.tiptap-mathematics-render) {
		padding: 0 0.25rem;

		&--editable {
			cursor: pointer;
			transition: background 0.2s;
		}
	}

	:global(.tiptap-mathematics-render--editable:hover) {
		background: #eee;
		color: #666;
		cursor: pointer;
	}

	:global(.tiptap-mathematics-render) {
		border-radius: 0.25rem;

		&[data-type='inline-math'] {
			display: inline-block;
		}

		&[data-type='block-math'] {
			display: block;
			margin: 1rem 0;
			padding: 1rem;
			text-align: center;
		}

		&.inline-math-error,
		&.block-math-error {
			background: var(--red-light);
			color: var(--red);
			border: 1px solid var(--red-dark);
			padding: 0.5rem;
			border-radius: 0.25rem;
		}
	}

	/* KaTeX preview styles in dialog */
	:global(.katex-preview .katex) {
		font-size: 1.2em;
	}

	:global(.katex-preview .katex-display) {
		margin: 0;
	}
</style>
