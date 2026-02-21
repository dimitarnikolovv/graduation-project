<script lang="ts">
	import 'katex/dist/katex.min.css';
	import katex from 'katex';
	import type { Snippet } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		class?: string;
		renderAsInlineBlock?: boolean;
		renderInline?: boolean;
		doProseStyling?: boolean;
	};
	let {
		children,
		class: className,
		renderAsInlineBlock = false,
		renderInline = false,
		doProseStyling = true
	}: Props = $props();

	let container: HTMLDivElement | null = null;
	let observer: MutationObserver | null = null;

	function renderLatexElement(el: Element) {
		// skip if already processed
		if ((el as HTMLElement).dataset.katexProcessed === '1') return;

		const expr = (el as HTMLElement).dataset.latex ?? '';
		if (!expr) return;

		const type = ((el as HTMLElement).dataset.type ?? '').toLowerCase();
		const displayMode = type === 'block-math' || type === 'display-math';

		try {
			const html = katex.renderToString(expr, {
				throwOnError: false,
				displayMode,
				output: 'html' // or 'htmlAndMathml' if you want MathML
			});
			// replace only this node (keep surrounding DOM intact)
			el.replaceWith(createFragment(html));
		} catch {
			// fallback: render the raw text
			const span = document.createElement('span');
			span.textContent = expr;
			el.replaceWith(span);
		}
	}

	function renderLatexInContainer(root: HTMLElement) {
		const nodes = root.querySelectorAll('[data-latex]');
		nodes.forEach(renderLatexElement);
	}

	function createFragment(html: string) {
		const tpl = document.createElement('template');
		tpl.innerHTML = html.trim();
		// mark all produced nodes so we don't re-process them
		tpl.content.querySelectorAll('*').forEach((n) => {
			(n as HTMLElement).dataset.katexProcessed = '1';
		});
		return tpl.content.cloneNode(true);
	}

	onMount(() => {
		if (!container) return;

		// initial pass
		renderLatexInContainer(container);

		// observe future changes in children
		observer = new MutationObserver((mutations) => {
			for (const m of mutations) {
				// process newly added nodes (and their subtrees)
				m.addedNodes.forEach((node) => {
					if (!(node instanceof HTMLElement)) return;
					if (node.matches('[data-latex]')) renderLatexElement(node);
					// also process any descendants
					const descendants = node.querySelectorAll?.('[data-latex]');
					descendants?.forEach(renderLatexElement);
				});
			}
		});

		observer.observe(container, { childList: true, subtree: true });
	});

	onDestroy(() => {
		observer?.disconnect();
		observer = null;
	});
</script>

<div
	class={cn(
		doProseStyling && 'prose dark:prose-invert [&_li_p]:my-0!',
		!renderAsInlineBlock && !renderInline && 'document overflow-x-auto',
		renderInline && 'inline',
		renderAsInlineBlock && 'inline-block',
		className
	)}
	bind:this={container}
>
	{@render children?.()}
</div>

<style lang="postcss">
	@reference 'tailwindcss';

	.document {
		@apply mx-auto w-full max-w-[90ch] max-sm:text-sm;
	}

	:global(.document h1) {
		@apply text-3xl font-bold;
	}
	:global(.document h2) {
		@apply text-2xl font-bold;
	}
	:global(.document h3) {
		@apply text-xl font-bold;
	}
	:global(.document h4) {
		@apply text-lg font-bold;
	}
	:global(.document h5) {
		@apply text-base font-bold;
	}
	:global(.document h6) {
		@apply text-sm font-bold;
	}
</style>
