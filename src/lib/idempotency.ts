/**
 * Utility functions for generating stable idempotency keys
 */

/**
 * Generate a stable idempotency key for checkout attempts
 * This creates a deterministic key based on event, buyer, and cart contents
 */
export function makeIdempotencyKey(
	eventId: string, 
	buyerEmail: string, 
	now: number, 
	cartHash: string
): string {
	// Simple deterministic key format: eventId:email:cartHash:timestamp
	return `${eventId}:${buyerEmail}:${cartHash}:${now}`;
}

/**
 * Generate a cart hash from cart items
 * Normalizes items to create a consistent hash for the same cart contents
 */
export function generateCartHash(items: any[]): string {
	if (items.length === 0) return "empty";
	
	// Sort items by type and ID for consistent ordering
	const normalizedItems = items
		.map(item => ({
			type: item._type,
			id: item._type === "ticket" ? item.ticketTypeId : item.merchItemId,
			qty: item.qty,
			variant: item.variantKey || null,
			price: item.unitPriceMinor
		}))
		.sort((a, b) => {
			// Sort by type first, then by ID
			if (a.type !== b.type) return a.type.localeCompare(b.type);
			return (a.id || "").localeCompare(b.id || "");
		});
	
	// Create a simple hash from the normalized items
	return JSON.stringify(normalizedItems);
}

/**
 * Generate a complete idempotency key for the current checkout
 * Combines event, buyer, cart, and timestamp
 */
export function generateCheckoutIdempotencyKey(
	eventId: string,
	buyerEmail: string,
	items: any[]
): string {
	const now = Date.now();
	const cartHash = generateCartHash(items);
	return makeIdempotencyKey(eventId, buyerEmail, now, cartHash);
}
