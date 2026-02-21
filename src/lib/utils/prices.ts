/**
 * Converts a price in cents to a real price (dollars).
 * @param priceInCents The price in cents (e.g. 2345 for $23.45).
 * @returns The price in dollars (e.g. 23.45).
 *
 * @example
 * const realPrice = priceInCentsToRealPrice(1999);
 * console.log(realPrice); // Outputs: 19.99
 */
export function priceInCentsToRealPrice(priceInCents: number): number {
	return Math.round((priceInCents / 100) * 100) / 100;
}

/**
 * Converts a real price (dollars) to a price in cents.
 * @param price The price in dollars (e.g. 23.45).
 * @returns The price in cents (e.g. 2345).
 *
 * @example
 * const priceInCents = realPriceToPriceInCents(19.99);
 * console.log(priceInCents); // Outputs: 1999
 */
export function realPriceToPriceInCents(price: number): number {
	return Math.round(price * 100);
}
