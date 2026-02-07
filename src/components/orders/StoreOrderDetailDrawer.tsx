// components/orders/StoreOrderDetailDrawer.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { StoreOrderWithVendorStatus, TimelineEvent } from "@/types/orders";
import { formatCurrency } from "@/lib/wallet/mock";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toMillis } from "@/lib/firebase/utils";
import { useToast } from "@/app/hooks/use-toast";
import {
	getStoreOrderTimeline,
	updateStoreFulfillmentStatus,
	getStoreFulfillmentLines,
} from "@/lib/firebase/callables/shipping";

interface StoreOrderDetailDrawerProps {
	order: StoreOrderWithVendorStatus | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: () => void;
}

export default function StoreOrderDetailDrawer({
	order,
	isOpen,
	onClose,
	onUpdate,
}: StoreOrderDetailDrawerProps) {
	const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
	const [loading, setLoading] = useState(false);
	const [fulfillmentLines, setFulfillmentLines] = useState<any[]>([]);
	const [updatingLines, setUpdatingLines] = useState<Set<string>>(new Set());
	const { toast } = useToast();

	const loadTimelineEvents = useCallback(async () => {
		if (!order) return;

		setLoading(true);
		try {
			const result = await getStoreOrderTimeline({ orderId: order.id });
			if (result.data.success) {
				setTimelineEvents(result.data.timeline);
			}
		} catch (error) {
			console.error("Error loading timeline events:", error);
			// Fallback to mock timeline
			const mockTimeline: TimelineEvent[] = [
				{
					type: "order_created",
					actor: "system",
					message: "Store order created",
					at: order.createdAt,
				},
				{
					type: "payment_captured",
					actor: "system",
					message: "Payment captured successfully",
					at: order.paidAt || order.createdAt,
				},
			];
			setTimelineEvents(mockTimeline);
		} finally {
			setLoading(false);
		}
	}, [order]);

	const loadFulfillmentLines = useCallback(async () => {
		if (!order) return;

		try {
			const result = await getStoreFulfillmentLines({ orderId: order.id });
			if (result.data.success) {
				setFulfillmentLines(result.data.lines);
			}
		} catch (error) {
			console.error("Error loading fulfillment lines:", error);
		}
	}, [order]);

	useEffect(() => {
		if (order && isOpen) {
			loadTimelineEvents();
			loadFulfillmentLines();
		}
	}, [order, isOpen, loadTimelineEvents, loadFulfillmentLines]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "text-accent";
			case "pending":
				return "text-edit";
			case "failed":
				return "text-alert";
			case "refunded":
				return "text-text-muted";
			case "cancelled":
				return "text-text-muted";
			default:
				return "text-text-muted";
		}
	};

	const getFulfillmentColor = (status: string) => {
		switch (status) {
			case "delivered":
				return "text-accent";
			case "shipped":
				return "text-cta";
			case "fulfilled":
				return "text-accent";
			case "partial":
				return "text-edit";
			case "unfulfilled":
				return "text-alert";
			default:
				return "text-text-muted";
		}
	};

	const formatOrderId = (id: string) => {
		return `ST-${id.slice(-6)}`;
	};

	const handleUpdateFulfillmentStatus = async (
		lineKey: string,
		status: string,
	) => {
		if (!order) return;

		// Add this line to the updating set
		setUpdatingLines((prev) => new Set(prev).add(lineKey));

		try {
			// Find the current fulfillment line to get qtyFulfilled
			const currentLine = fulfillmentLines.find(
				(line) => line.lineKey === lineKey,
			);
			const qtyFulfilled = currentLine?.qtyFulfilled || 0;

			const result = await updateStoreFulfillmentStatus({
				orderId: order.id,
				lineKey,
				status: status as any,
				qtyFulfilled: qtyFulfilled, // Explicitly pass qtyFulfilled to avoid undefined
			});

			// Show success toast with email notification info
			if (result.data.success) {
				if (result.data.emailSent) {
					toast({
						title: "Status Updated Successfully",
						description: `Fulfillment status updated to ${status}. Customer has been notified via email.`,
						duration: 5000,
					});
				} else {
					toast({
						title: "Status Updated Successfully",
						description: `Fulfillment status updated to ${status}.`,
						duration: 3000,
					});
				}
			}

			// Reload data
			await loadFulfillmentLines();
			await loadTimelineEvents();
			onUpdate(); // Refresh parent component
		} catch (error) {
			console.error("Error updating fulfillment status:", error);
			toast({
				title: "Update Failed",
				description: "Failed to update fulfillment status. Please try again.",
				variant: "destructive",
				duration: 5000,
			});
		} finally {
			// Remove this line from the updating set
			setUpdatingLines((prev) => {
				const newSet = new Set(prev);
				newSet.delete(lineKey);
				return newSet;
			});
		}
	};

	if (!isOpen || !order) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-hidden">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Drawer */}
			<div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-bg border-l border-stroke shadow-2xl">
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-stroke">
						<div>
							<h2 className="text-xl font-semibold text-text">
								Store Order {formatOrderId(order.id)}
							</h2>
							<p className="text-sm text-text-muted">
								Created{" "}
								{formatDistanceToNow(toMillis(order.createdAt), {
									addSuffix: true,
								})}
							</p>
						</div>
						<Button text="Close" variant="outline" onClick={onClose} />
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6 space-y-6">
						{/* Order Status */}
						<div className="bg-surface rounded-lg p-4">
							<h3 className="text-lg font-medium text-text mb-3">
								Order Status
							</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-text-muted">Payment Status</p>
									<p className={`font-medium ${getStatusColor(order.status)}`}>
										{order.status.charAt(0).toUpperCase() +
											order.status.slice(1)}
									</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">Fulfillment Status</p>
									<p
										className={`font-medium ${getFulfillmentColor(
											order.fulfillmentAggregateStatus || "unfulfilled",
										)}`}
									>
										{order.fulfillmentAggregateStatus
											? order.fulfillmentAggregateStatus
													.charAt(0)
													.toUpperCase() +
												order.fulfillmentAggregateStatus.slice(1)
											: "Unfulfilled"}
									</p>
								</div>
							</div>
						</div>

						{/* Customer Information */}
						<div className="bg-surface rounded-lg p-4">
							<h3 className="text-lg font-medium text-text mb-3">
								Customer Information
							</h3>
							<div className="space-y-2">
								<div>
									<p className="text-sm text-text-muted">Name</p>
									<p className="font-medium text-text">
										{order.deliverTo?.fullName || "Not provided"}
									</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">Email</p>
									<p className="font-medium text-text">
										{order.deliverTo?.email || "Not provided"}
									</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">Phone</p>
									<p className="font-medium text-text">
										{order.deliverTo?.phone || "Not provided"}
									</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">Notes</p>
									<p className="font-medium text-text">
										{order.deliverTo?.notes || "Not provided"}
									</p>
								</div>
							</div>
						</div>

						{/* Order Items */}
						<div className="bg-surface rounded-lg p-4">
							<h3 className="text-lg font-medium text-text mb-3">
								Order Items
							</h3>
							<div className="space-y-3">
								{order.lineItems.map((item, index) => (
									<div
										key={index}
										className="flex items-center justify-between py-2 border-b border-stroke/50 last:border-b-0"
									>
										<div className="flex-1">
											<p className="font-medium text-text">{item.name}</p>
											<div className="text-sm text-text-muted space-x-2">
												<span>Qty: {item.qty}</span>
												{item.size && <span>Size: {item.size}</span>}
												{item.color && (
													<span className="flex items-center gap-1">
														Color:{" "}
														{typeof item.color === "object" ? (
															<>
																{(item.color as any).label}
																<span
																	className="inline-block w-3 h-3 rounded-full border border-stroke/20 ml-1"
																	style={{
																		backgroundColor: (item.color as any).hex,
																	}}
																/>
															</>
														) : (
															item.color
														)}
													</span>
												)}
											</div>
										</div>
										<div className="text-right">
											<p className="font-medium text-text">
												{formatCurrency(item.subtotalMinor)}
											</p>
											<p className="text-sm text-text-muted">
												{formatCurrency(item.unitPriceMinor)} each
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Fulfillment Management */}
						<div className="bg-surface rounded-lg p-4">
							<h3 className="text-lg font-medium text-text mb-3">
								Fulfillment Management
							</h3>
							{fulfillmentLines.length > 0 ? (
								<div className="space-y-4">
									{fulfillmentLines.map((line, index) => (
										<div
											key={index}
											className="border border-stroke/50 rounded-lg p-3"
										>
											<div className="flex items-center justify-between mb-3">
												<div>
													<p className="font-medium text-text">
														{line.lineKey.replace("product:", "")}
													</p>
													<p className="text-sm text-text-muted">
														Qty: {line.qtyFulfilled}/{line.qtyOrdered}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<span
														className={`px-2 py-1 rounded text-xs font-medium ${getFulfillmentColor(
															line.status,
														)}`}
													>
														{line.status}
													</span>
													<div className="flex items-center gap-2">
														<select
															value={line.status}
															onChange={(e) =>
																handleUpdateFulfillmentStatus(
																	line.lineKey,
																	e.target.value,
																)
															}
															disabled={updatingLines.has(line.lineKey)}
															className="text-xs border border-stroke rounded px-2 py-1 bg-bg text-text disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<option value="unfulfilled">Unfulfilled</option>
															<option value="fulfilled">Fulfilled</option>
															<option value="shipped">Shipped</option>
															<option value="delivered">Delivered</option>
															<option value="cancelled">Cancelled</option>
														</select>
														{updatingLines.has(line.lineKey) && (
															<div className="w-4 h-4 border-2 border-cta border-t-transparent rounded-full animate-spin"></div>
														)}
													</div>
												</div>
											</div>

											{line.shipping && (
												<div className="text-xs text-text-muted space-y-1">
													<p>Method: {line.shipping.method}</p>
													{line.shipping.trackingNumber && (
														<p>Tracking: {line.shipping.trackingNumber}</p>
													)}
													{line.shipping.carrier && (
														<p>Carrier: {line.shipping.carrier}</p>
													)}
												</div>
											)}

											{line.notes && (
												<div className="mt-2 p-2 bg-bg rounded text-xs text-text-muted">
													<strong>Notes:</strong> {line.notes}
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-4">
									<div className="flex flex-col items-center justify-center gap-2">
										<div className="w-6 h-6 border-2 border-cta border-t-transparent rounded-full animate-spin"></div>
										<span className="text-text-muted text-sm">
											Loading fulfillment lines...
										</span>
									</div>
								</div>
							)}
							<div className="text-xs text-calm-1 mt-4 text-center">
								<span>
									Note: Customers are automatically emailed after every update
									to fulfillment or shipping info.
								</span>
							</div>
						</div>

						{/* Order Summary */}
						<div className="bg-surface rounded-lg p-4">
							<h3 className="text-lg font-medium text-text mb-3">
								Order Summary
							</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-text-muted">Subtotal</span>
									<span className="font-medium text-text">
										{formatCurrency(order.amount.itemsSubtotalMinor)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted">Shipping</span>
									<span className="font-medium text-text">
										{(order.amount.shippingMinor ?? 0) > 0
											? formatCurrency(order.amount.shippingMinor ?? 0)
											: "Free"}
									</span>
								</div>
								<div className="flex justify-between text-lg font-semibold border-t border-stroke pt-2">
									<span>Total</span>
									<span className="text-accent">
										{formatCurrency(
											order.amount.itemsSubtotalMinor +
												(order.amount.shippingMinor ?? 0),
										)}
									</span>
								</div>
							</div>
						</div>

						{/* Shipping Information */}
						{order.shipping && (
							<div className="bg-surface rounded-lg p-4">
								<h3 className="text-lg font-medium text-text mb-3">
									Shipping Information
								</h3>
								<div className="space-y-2">
									<div>
										<p className="text-sm text-text-muted">Method</p>
										<p className="font-medium text-text capitalize">
											{order.shipping.method}
										</p>
									</div>
									{order.shipping.address && (
										<div>
											<p className="text-sm text-text-muted">Address</p>
											<div className="text-text">
												{order.shipping.address?.name && (
													<p>{order.shipping.address.name}</p>
												)}
												{order.shipping.address?.address && (
													<p>{order.shipping.address.address}</p>
												)}
												{order.shipping.address?.city &&
													order.shipping.address?.state && (
														<p>
															{order.shipping.address.city},{" "}
															{order.shipping.address.state}
														</p>
													)}
												{order.shipping.address?.postalCode && (
													<p>{order.shipping.address.postalCode}</p>
												)}
											</div>
										</div>
									)}
									{order.shipping.pickupAddress && (
										<div>
											<p className="text-sm text-text-muted">Pickup Address</p>
											<p className="font-medium text-text">
												{order.shipping.pickupAddress}
											</p>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Timeline */}
						<div className="bg-surface rounded-lg p-4">
							<h3 className="text-lg font-medium text-text mb-3">
								Order Timeline
							</h3>
							{loading ? (
								<div className="text-center py-4">
									<div className="w-6 h-6 border-2 border-cta border-t-transparent rounded-full animate-spin mx-auto"></div>
								</div>
							) : (
								<div className="space-y-3">
									{timelineEvents.map((event, index) => (
										<div key={index} className="flex items-start gap-3">
											<div className="w-2 h-2 bg-cta rounded-full mt-2 flex-shrink-0"></div>
											<div className="flex-1">
												<p className="text-sm text-text">{event.message}</p>
												<p className="text-xs text-text-muted">
													{formatDistanceToNow(toMillis(event.at), {
														addSuffix: true,
													})}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Footer */}
					<div className="p-6 border-t border-stroke">
						<div className="flex gap-3">
							<Button
								text="Refresh Data"
								variant="outline"
								onClick={async () => {
									await loadFulfillmentLines();
									await loadTimelineEvents();
									onUpdate();
								}}
								disabled={loading || updatingLines.size > 0}
								className="flex-1"
							/>
							<Button
								text="Close"
								variant="secondary"
								onClick={onClose}
								className="flex-1"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
