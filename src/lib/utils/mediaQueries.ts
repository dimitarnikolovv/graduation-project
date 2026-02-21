import { MediaQuery } from 'svelte/reactivity';

export const smallScreen = new MediaQuery('max-width: 640px');

export const largeScreen = new MediaQuery('min-width: 1024px');

export const extraLargeScreen = new MediaQuery('min-width: 1280px');
