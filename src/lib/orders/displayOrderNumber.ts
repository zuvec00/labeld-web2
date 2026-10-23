/**
 * The order number customers see in messages and documents. Same rule as mobile
 * `StoreOrder.displayOrderNumber`: the backend's sequential number ("#1042")
 * when there is one, otherwise "#ST-" plus the first 8 characters of the id.
 *
 * Use this for anything customer-facing so web, mobile and the generated PDFs
 * all name the same order the same way.
 */
export function displayOrderNumber(order: {
	id: string;
	orderNumber?: number | null;
}): string {
	if (order.orderNumber != null && order.orderNumber > 0) {
		return `#${order.orderNumber}`;
	}
	const fallback = order.id.length >= 8 ? order.id.slice(0, 8) : order.id;
	return `#ST-${fallback.toUpperCase()}`;
}
