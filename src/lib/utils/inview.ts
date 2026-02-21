import { tick } from 'svelte';
import type { ActionReturn } from 'svelte/action';

export type Prefix = 'inview';
export type EventBase = 'change' | 'leave' | 'enter' | 'init';
export type Event = `${Prefix}_${EventBase}`;

export type Options = {
	root?: HTMLElement | null;
	rootMargin?: string;
	threshold?: number | number[];
	unobserveOnEnter?: boolean;
};

export type Position = {
	x?: number;
	y?: number;
};

// Types below needs to be manually copied to additional-svelte.jsx.d.ts file - more details there
type Direction = 'up' | 'down' | 'left' | 'right';

export type ScrollDirection = {
	vertical?: Direction;
	horizontal?: Direction;
};

export type ObserverEventDetails = {
	inView: boolean;
	entry: IntersectionObserverEntry;
	scrollDirection: ScrollDirection;
	node: HTMLElement;
	observer: IntersectionObserver;
};

export type LifecycleEventDetails = {
	node: HTMLElement;
	observer: IntersectionObserver;
};

export interface Attributes {
	oninview_change?: (e: CustomEvent<ObserverEventDetails>) => void;
	oninview_enter?: (e: CustomEvent<ObserverEventDetails>) => void;
	oninview_leave?: (e: CustomEvent<ObserverEventDetails>) => void;
	oninview_init?: (e: CustomEvent<LifecycleEventDetails>) => void;
}

const defaultOptions: Options = {
	root: null,
	rootMargin: '0px',
	threshold: 0,
	unobserveOnEnter: false
};

const createEvent = <T = ObserverEventDetails>(name: Event, detail: T): CustomEvent<T> =>
	new CustomEvent(name, { detail });

export function inview(
	node: HTMLElement,
	options: Options = {}
): ActionReturn<Options, Attributes> {
	const { root, rootMargin, threshold, unobserveOnEnter }: Options = {
		...defaultOptions,
		...options
	};

	let prevPos: Position = {
		x: undefined,
		y: undefined
	};

	let scrollDirection: ScrollDirection = {
		vertical: undefined,
		horizontal: undefined
	};

	if (typeof IntersectionObserver !== 'undefined' && node) {
		const observer = new IntersectionObserver(
			(entries, _observer) => {
				entries.forEach((singleEntry) => {
					if (prevPos.y && prevPos.y > singleEntry.boundingClientRect.y) {
						scrollDirection.vertical = 'up';
					} else {
						scrollDirection.vertical = 'down';
					}

					if (prevPos.x && prevPos.x > singleEntry.boundingClientRect.x) {
						scrollDirection.horizontal = 'left';
					} else {
						scrollDirection.horizontal = 'right';
					}

					prevPos = {
						y: singleEntry.boundingClientRect.y,
						x: singleEntry.boundingClientRect.x
					};

					const detail: ObserverEventDetails = {
						inView: singleEntry.isIntersecting,
						entry: singleEntry,
						scrollDirection,
						node,
						observer: _observer
					};

					node.dispatchEvent(createEvent('inview_change', detail));

					if (singleEntry.isIntersecting) {
						node.dispatchEvent(createEvent('inview_enter', detail));

						// eslint-disable-next-line @typescript-eslint/no-unused-expressions
						unobserveOnEnter && _observer.unobserve(node);
					} else {
						node.dispatchEvent(createEvent('inview_leave', detail));
					}
				});
			},
			{
				root,
				rootMargin,
				threshold
			}
		);

		tick().then(() => {
			node.dispatchEvent(createEvent<LifecycleEventDetails>('inview_init', { observer, node }));
		});

		observer.observe(node);

		return {
			destroy() {
				observer.unobserve(node);
			}
		};
	}

	return {
		destroy() {
			// No cleanup needed if IntersectionObserver is not supported
		},
		update(newOptions: Options) {
			Object.assign(options, newOptions);
			prevPos = { x: undefined, y: undefined };
			scrollDirection = { vertical: undefined, horizontal: undefined };
		}
	};
}
