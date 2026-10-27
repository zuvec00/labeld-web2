import type { StoreOrderDoc } from "@/types/orders";

/**
 * A customer-paid courier order that has been quoted but not yet booked.
 *
 * Manual fulfilment must be blocked in this state: the buyer's shipping payment
 * is only settled with the courier when the booking runs, so marking the order
 * delivered by hand would close it with the parcel never dispatched and the
 * shipping money never moved. A cancelled shipment is excluded on purpose, so
 * the brand has a manual way out instead of being trapped.
 *
 * Covers both couriers (Terminal and Shipbubble). Mirrors
 * `_hasPendingCustomerCourierBooking` in the mobile order details screen.
 * Remove the UI lock this drives once web can book couriers (S-2).
 */
export function hasPendingCustomerCourierBooking(
	order: Pick<
		StoreOrderDoc,
		"shipping" | "terminalShipmentId" | "shipbubbleOrderId" | "fulfillmentStatus"
	>,
): boolean {
	const cancelled =
		(order.fulfillmentStatus ?? "").trim().toLowerCase() === "cancelled";
	if (order.shipping?.mode !== "terminal_live") return false;

	// Shipbubble checkout: pending until a Shipbubble order id is saved.
	if (
		order.shipping.provider === "shipbubble" &&
		order.shipping.shipbubble &&
		typeof order.shipping.shipbubble === "object"
	) {
		return !order.shipbubbleOrderId?.trim() && !cancelled;
	}

	return (
		!!order.shipping.terminal &&
		typeof order.shipping.terminal === "object" &&
		!order.terminalShipmentId &&
		!cancelled
	);
}
