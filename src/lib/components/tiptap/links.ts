import type { Editor } from '@tiptap/core';

export type LinkExtentProps = {
	editor: Editor;
	pos: number;
};

export function findLinkExtent({ editor, pos }: LinkExtentProps) {
	if (!editor) return null;

	let linkStart = pos;
	let linkEnd = pos;
	let linkMark = null;

	// First, check if we're at a position that has a link mark
	const resolvedPos = editor.state.doc.resolve(pos);
	linkMark = resolvedPos.marks().find((mark) => mark.type.name === 'link');

	if (!linkMark) {
		// If not at the exact position, try to find a link mark in the surrounding area
		for (let i = Math.max(0, pos - 1); i <= Math.min(editor.state.doc.content.size, pos + 1); i++) {
			const testPos = editor.state.doc.resolve(i);
			// Check if the test position has a link mark
			linkMark = testPos.marks().find((mark) => mark.type.name === 'link');
			if (linkMark) {
				// Found a link mark nearby
				linkStart = i;
				linkEnd = i;
				break;
			}
		}
	} else {
		linkStart = pos;
		linkEnd = pos;
	}

	if (!linkMark) return null;

	// Expand backwards to find the start of the link
	while (linkStart > 0) {
		const testPos = editor.state.doc.resolve(linkStart - 1);
		const testMark = testPos.marks().find((mark) => mark.type.name === 'link');

		// If the mark at the test position matches the original link mark, continue expanding
		if (testMark && testMark.attrs.href === linkMark.attrs.href) {
			linkStart--;
		} else {
			// Move back to the last position that had the link mark
			linkStart--;
			// No more matching link mark, stop expanding
			break;
		}
	}

	// Expand forwards to find the end of the link
	while (linkEnd < editor.state.doc.content.size) {
		const testPos = editor.state.doc.resolve(linkEnd + 1);
		const testMark = testPos.marks().find((mark) => mark.type.name === 'link');
		if (testMark && testMark.attrs.href === linkMark.attrs.href) {
			linkEnd++;
		} else {
			break;
		}
	}

	return {
		start: linkStart,
		end: linkEnd,
		mark: linkMark,
		url: linkMark.attrs.href,
		text: editor.state.doc.textBetween(linkStart, linkEnd)
	};
}
