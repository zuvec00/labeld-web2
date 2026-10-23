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
 * Mirrors `_hasPendingCustomerCourierBooking` in the mobile order details
 * screen. Remove the UI lock this drives once web can book couriers (S-2).
 */
export function hasPendingCustomerCourierBooking(
	order: Pick<StoreOrderDoc, "shipping" | "terminalShipmentId" | "fulfillmentStatus">,
): boolean {
	return (
		order.shipping?.mode === "terminal_live" &&
		!!order.shipping.terminal &&
		typeof order.shipping.terminal === "object" &&
		!order.terminalShipmentId &&
		(order.fulfillmentStatus ?? "").trim().toLowerCase() !== "cancelled"
	);
}
