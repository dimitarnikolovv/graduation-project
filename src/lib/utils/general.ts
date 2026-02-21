import { encodeBase32LowerCase } from '@oslojs/encoding';
import { toast } from 'svelte-sonner';
import type { SuperValidated } from 'sveltekit-superforms';

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
	toast.success('Копирано успешно.');
}

// Utility function to convert snake_case to camelCase
export function toCamelCase(input: string): string {
	return input.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function uniqueOrThrow<T>(values: T[]): T {
	if (values.length > 0) throw new Error('Found unique or existent value');
	return values[0]!;
}

export function stripFieldsFromForm<T extends Record<string, unknown>, K extends keyof T>(
	form: SuperValidated<T>,
	fields: K[]
): SuperValidated<Omit<T, K>> {
	// Create a shallow copy of the form
	const sanitizedForm = { ...form, data: { ...form.data } };

	// Remove specified fields from the data object
	for (const field of fields) {
		delete sanitizedForm.data[field];
	}

	// Return the sanitized form with updated type
	return sanitizedForm as SuperValidated<Omit<T, K>>;
}

export function omitFieldsFromObject<T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	keysToRemove: K[]
): Omit<T, K> {
	const result = { ...obj };

	for (const key of keysToRemove) {
		delete result[key];
	}

	return result;
}

export function formatLargeNumber(value: number, minThreshold: number = 1000): string {
	if (value < minThreshold) return value.toString();

	const units = [
		{ suffix: 'T', divisor: 1_000_000_000_000 },
		{ suffix: 'B', divisor: 1_000_000_000 },
		{ suffix: 'M', divisor: 1_000_000 },
		{ suffix: 'K', divisor: 1_000 }
	];

	for (const { suffix, divisor } of units) {
		if (value >= divisor) {
			return `${Math.floor(value / divisor)}${suffix}`;
		}
	}

	return value.toString();
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
		if (timeout !== null) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => {
			timeout = null;
			// Explicitly discard any return value
			void func.apply(this, args);
		}, wait);
	};
}

export function getPercentageDifference(
	current: number,
	previous: number
): {
	difference: number;
	isPositive: boolean;
	rawDifference: number;
} {
	if (previous === 0) {
		// Avoid division by zero
		return {
			difference: current === 0 ? 0 : 100,
			isPositive: current >= 0,
			rawDifference: current - previous
		};
	}

	const diff = ((current - previous) / previous) * 100;
	return {
		difference: Math.round(diff * 100) / 100,
		isPositive: diff >= 0,
		rawDifference: current - previous
	};
}

export function escapeHtml(str: string) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function generateId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.

	// Check if in the browser and if the crypto API is available
	if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
		const bytes = window.crypto.getRandomValues(new Uint8Array(15));
		const id = encodeBase32LowerCase(bytes);
		return id;
	}

	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

/**
 * Generate a short token for URLs (8 characters).
 * Used for mobile upload tokens.
 */
export function generateShortToken() {
	// 5 bytes = 40 bits of entropy, encoded as 8 base32 characters
	if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
		const bytes = window.crypto.getRandomValues(new Uint8Array(5));
		return encodeBase32LowerCase(bytes);
	}

	const bytes = crypto.getRandomValues(new Uint8Array(5));
	return encodeBase32LowerCase(bytes);
}

/**
 * Slugify a string (supports Cyrillic -> Latin transliteration).
 * @example
 * slugify("Mathematics") // "mathematics"
 * slugify("Човекът и природата") // "chovekat-i-prirodata"
 */
export function slugify(input: string): string {
	// Basic Cyrillic to Latin map (can be expanded if needed)
	const cyrillicMap: Record<string, string> = {
		а: 'a',
		б: 'b',
		в: 'v',
		г: 'g',
		д: 'd',
		е: 'e',
		ж: 'zh',
		з: 'z',
		и: 'i',
		й: 'y',
		к: 'k',
		л: 'l',
		м: 'm',
		н: 'n',
		о: 'o',
		п: 'p',
		р: 'r',
		с: 's',
		т: 't',
		у: 'u',
		ф: 'f',
		х: 'h',
		ц: 'ts',
		ч: 'ch',
		ш: 'sh',
		щ: 'sht',
		ъ: 'a',
		ь: '',
		ю: 'yu',
		я: 'ya',

		А: 'a',
		Б: 'b',
		В: 'v',
		Г: 'g',
		Д: 'd',
		Е: 'e',
		Ж: 'zh',
		З: 'z',
		И: 'i',
		Й: 'y',
		К: 'k',
		Л: 'l',
		М: 'm',
		Н: 'n',
		О: 'o',
		П: 'p',
		Р: 'r',
		С: 's',
		Т: 't',
		У: 'u',
		Ф: 'f',
		Х: 'h',
		Ц: 'ts',
		Ч: 'ch',
		Ш: 'sh',
		Щ: 'sht',
		Ъ: 'a',
		Ь: '',
		Ю: 'yu',
		Я: 'ya'
	};

	// Replace Cyrillic chars
	let result = input
		.split('')
		.map((char) => cyrillicMap[char] ?? char)
		.join('');

	// Normalize, remove accents
	result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

	// Lowercase
	result = result.toLowerCase();

	// Replace non-alphanumeric with hyphens
	result = result.replace(/[^a-z0-9]+/g, '-');

	// Trim hyphens
	result = result.replace(/^-+|-+$/g, '');

	return result;
}
export function sliceLongText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return text.slice(0, maxLength) + '...';
}

export function camelizeKeys<T>(value: unknown): T {
	if (Array.isArray(value)) {
		return value.map((v) => camelizeKeys(v)) as unknown as T;
	}
	if (value && typeof value === 'object' && value.constructor === Object) {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			const newKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
			out[newKey] = camelizeKeys(v);
		}
		return out as T;
	}
	return value as T;
}
