// components/orders/OrderDetailDrawer.tsx
import { OrderWithVendorStatus } from "@/types/orders";
import { getLineKey, getLineItemSummary } from "@/lib/orders/helpers";
import StatusBadge from "./StatusBadge";
import Money from "./Money";
import Date from "./Date";

interface OrderDetailDrawerProps {
	order: OrderWithVendorStatus | null;
	isOpen: boolean;
	onClose: () => void;
}

export default function OrderDetailDrawer({
	order,
	isOpen,
	onClose,
}: OrderDetailDrawerProps) {
	if (!isOpen || !order) return null;

	const getVendorStatusForLine = (line: any) => {
		const lineKey = getLineKey(line);
		return order.vendorLineStatuses?.[lineKey] || "paid";
	};

	const getVisibilityReasonLabel = (reason?: string) => {
		switch (reason) {
			case "organizer":
				return "You are the event organizer";
			case "brand":
				return "You are the brand owner";
			case "both":
				return "You are both organizer and brand owner";
			default:
				return "Order visible to you";
		}
	};

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

			{/* Drawer */}
			<div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-bg border-l border-stroke z-50 overflow-y-auto">
				<div className="p-6 space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-text">Order Details</h2>
						<button
							onClick={onClose}
							className="p-2 hover:bg-surface rounded-lg transition-colors"
						>
							<svg
								className="w-5 h-5 text-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Order Summary */}
					<div className="rounded-lg bg-surface border border-stroke p-4">
						<div className="flex items-center justify-between mb-3">
							<div>
								<h3 className="font-medium text-text">Order #{order.id}</h3>
								<p className="text-sm text-text-muted">
									<Date timestamp={order.createdAt} />
								</p>
							</div>
							<div className="text-right">
								<div className="text-lg font-semibold text-text">
									<Money amountMinor={order.amount.totalMinor} />
								</div>
								<StatusBadge status={order.status} />
							</div>
						</div>

						{order.visibilityReason && (
							<div className="mt-3 p-2 bg-accent/10 border border-accent/20 rounded-lg">
								<p className="text-xs text-accent">
									{getVisibilityReasonLabel(order.visibilityReason)}
								</p>
							</div>
						)}
					</div>

					{/* Customer Information */}
					<div className="rounded-lg bg-surface border border-stroke p-4">
						<h3 className="font-medium text-text mb-3">Customer</h3>
						<div className="space-y-2">
							<div>
								<span className="text-sm text-text-muted">Email:</span>
								<span className="text-sm text-text ml-2">
									{order.deliverTo?.email || "—"}
								</span>
							</div>
							<div>
								<span className="text-sm text-text-muted">Phone:</span>
								<span className="text-sm text-text ml-2">
									{order.deliverTo?.phone || "—"}
								</span>
							</div>
						</div>
					</div>

					{/* Event Information */}
					<div className="rounded-lg bg-surface border border-stroke p-4">
						<h3 className="font-medium text-text mb-3">Event</h3>
						<div className="space-y-2">
							<div>
								<span className="text-sm text-text-muted">Event:</span>
								<span className="text-sm text-text ml-2">
									{order.eventTitle || "Unknown Event"}
								</span>
							</div>
							<div>
								<span className="text-sm text-text-muted">Event ID:</span>
								<span className="text-sm font-mono text-text-muted ml-2">
									{order.eventId}
								</span>
							</div>
						</div>
					</div>

					{/* Line Items */}
					<div className="rounded-lg bg-surface border border-stroke p-4">
						<h3 className="font-medium text-text mb-3">Items</h3>
						<div className="space-y-3">
							{(order.visibleLineItems || order.lineItems).map(
								(line, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-3 bg-bg rounded-lg border border-stroke/50"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="text-sm font-medium text-text">
													{getLineItemSummary(line)}
												</span>
												{line._type === "merch" && (
													<StatusBadge
														status={getVendorStatusForLine(line)}
														type="vendor"
													/>
												)}
											</div>

											<div className="text-xs text-text-muted space-y-1">
												{line._type === "ticket" && (
													<>
														<div>Type: {line.admitType || "General"}</div>
														<div>ID: {line.ticketTypeId}</div>
													</>
												)}
												{line._type === "merch" && (
													<>
														{line.size && <div>Size: {line.size}</div>}
														{line.color && <div>Color: {line.color}</div>}
														<div>ID: {line.merchItemId}</div>
													</>
												)}
											</div>
										</div>

										<div className="text-right">
											<div className="text-sm font-medium text-text">
												<Money amountMinor={line.subtotalMinor} />
											</div>
											<div className="text-xs text-text-muted">
												{line.qty} × <Money amountMinor={line.unitPriceMinor} />
											</div>
										</div>
									</div>
								)
							)}
						</div>
					</div>

					{/* Payment Information */}
					<div className="rounded-lg bg-surface border border-stroke p-4">
						<h3 className="font-medium text-text mb-3">Payment</h3>
						<div className="space-y-2">
							<div>
								<span className="text-sm text-text-muted">Provider:</span>
								<span className="text-sm text-text ml-2 capitalize">
									{order.provider || "—"}
								</span>
							</div>
							{order.providerRef?.initRef && (
								<div>
									<span className="text-sm text-text-muted">Init Ref:</span>
									<span className="text-sm font-mono text-text-muted ml-2">
										{order.providerRef.initRef}
									</span>
								</div>
							)}
							{order.providerRef?.verifyRef && (
								<div>
									<span className="text-sm text-text-muted">Verify Ref:</span>
									<span className="text-sm font-mono text-text-muted ml-2">
										{order.providerRef.verifyRef}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Order Breakdown */}
					<div className="rounded-lg bg-surface border border-stroke p-4">
						<h3 className="font-medium text-text mb-3">Breakdown</h3>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-text-muted">Items Subtotal:</span>
								<Money amountMinor={order.amount.itemsSubtotalMinor} />
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-text-muted">Fees:</span>
								<Money amountMinor={order.amount.feesMinor} />
							</div>
							<div className="border-t border-stroke/50 pt-2">
								<div className="flex justify-between font-medium">
									<span className="text-text">Total:</span>
									<Money amountMinor={order.amount.totalMinor} />
								</div>
							</div>
						</div>
					</div>

					{/* Timestamps */}
					<div className="rounded-lg bg-surface border border-stroke p-4">
						<h3 className="font-medium text-text mb-3">Timeline</h3>
						<div className="space-y-2 text-sm">
							<div>
								<span className="text-text-muted">Created:</span>
								<span className="text-text ml-2">
									<Date timestamp={order.createdAt} />
								</span>
							</div>
							{order.paidAt && (
								<div>
									<span className="text-text-muted">Paid:</span>
									<span className="text-text ml-2">
										<Date timestamp={order.paidAt} />
									</span>
								</div>
							)}
							{order.updatedAt && (
								<div>
									<span className="text-text-muted">Updated:</span>
									<span className="text-text ml-2">
										<Date timestamp={order.updatedAt} />
									</span>
								</div>
							)}
							{order.cancelledAt && (
								<div>
									<span className="text-text-muted">Cancelled:</span>
									<span className="text-text ml-2">
										<Date timestamp={order.cancelledAt} />
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
