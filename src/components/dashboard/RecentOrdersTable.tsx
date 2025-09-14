// components/dashboard/RecentOrdersTable.tsx
"use client";

import { OrderWithVendorStatus } from "@/types/orders";
import {
	getOrderItemsSummary,
	formatLagos,
	getLineFulfillmentStatus,
} from "@/lib/orders/helpers";
import { formatNaira } from "@/lib/orders/helpers";
import FulfillmentStatusBadge from "@/components/orders/FulfillmentStatusBadge";
import { ExternalLink } from "lucide-react";

interface RecentOrdersTableProps {
	orders: OrderWithVendorStatus[];
	onOrderClick?: (order: OrderWithVendorStatus) => void;
	loading?: boolean;
	className?: string;
}

export default function RecentOrdersTable({
	orders,
	onOrderClick,
	loading = false,
	className = "",
}: RecentOrdersTableProps) {
	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Recent Orders</h3>
				<div className="space-y-3">
					{[1, 2, 3, 4, 5].map((i) => (
						<div
							key={i}
							className="animate-pulse flex items-center justify-between p-3 border border-stroke rounded-lg"
						>
							<div className="flex items-center gap-3">
								<div className="h-8 w-16 bg-stroke rounded"></div>
								<div className="h-4 w-24 bg-stroke rounded"></div>
							</div>
							<div className="h-4 w-20 bg-stroke rounded"></div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Recent Orders</h3>
				<div className="text-center py-8">
					<div className="text-4xl mb-2">📦</div>
					<div className="text-text-muted">No recent orders</div>
					<div className="text-xs text-text-muted mt-1">
						Orders will appear here as they come in
					</div>
				</div>
			</div>
		);
	}

	const getFulfillmentAggregateStatus = (order: OrderWithVendorStatus) => {
		if (!order.fulfillmentLines) return "fulfilled";

		const vendorOwnedLineKeys = order.lineItems
			.filter((item) => item._type === "merch")
			.map((item) => `merch:${item.merchItemId}`);

		if (vendorOwnedLineKeys.length === 0) return "fulfilled";

		const statuses = vendorOwnedLineKeys.map((lineKey) => {
			const line = order.fulfillmentLines?.[lineKey];
			return line ? getLineFulfillmentStatus(line) : "unfulfilled";
		});

		const hasUnfulfilled = statuses.some((status) => status === "unfulfilled");
		const hasFulfilled = statuses.some((status) =>
			["fulfilled", "shipped", "delivered"].includes(status)
		);

		if (hasUnfulfilled && hasFulfilled) return "partial";
		if (hasUnfulfilled) return "unfulfilled";
		return "fulfilled";
	};

	const getBuyerInfo = (order: OrderWithVendorStatus) => {
		if (order.deliverTo?.email) {
			return order.deliverTo.email;
		}
		if (order.buyerUserId) {
			return `User ${order.buyerUserId.slice(0, 8)}...`;
		}
		return "Guest";
	};

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text">Recent Orders</h3>
				<div className="text-xs text-text-muted">
					Last {orders.length} orders
				</div>
			</div>

			<div className="space-y-2">
				{orders.map((order) => {
					const fulfillmentStatus = getFulfillmentAggregateStatus(order);
					const buyerInfo = getBuyerInfo(order);
					const orderDate =
						order.createdAt?.toDate?.() || new Date(order.createdAt);

					return (
						<div
							key={order.id}
							className={`flex items-center justify-between p-3 border border-stroke rounded-lg hover:border-cta/20 transition-colors ${
								onOrderClick ? "cursor-pointer" : ""
							}`}
							onClick={() => onOrderClick?.(order)}
						>
							<div className="flex items-center gap-3 min-w-0 flex-1">
								{/* Order ID */}
								<div className="text-xs font-mono text-text-muted bg-background px-2 py-1 rounded border">
									{order.id.slice(0, 8)}...
								</div>

								{/* Date */}
								<div className="text-xs text-text-muted whitespace-nowrap">
									{formatLagos(orderDate)}
								</div>

								{/* Buyer */}
								<div className="text-sm text-text truncate min-w-0">
									{buyerInfo}
								</div>

								{/* Items */}
								<div className="text-xs text-text-muted truncate min-w-0">
									{getOrderItemsSummary(
										order.visibleLineItems || order.lineItems
									)}
								</div>
							</div>

							<div className="flex items-center gap-3">
								{/* Fulfillment Status */}
								<FulfillmentStatusBadge
									status={fulfillmentStatus}
									type="aggregate"
								/>

								{/* Total */}
								<div className="text-sm font-medium text-text">
									{formatNaira(order.amount.totalMinor)}
								</div>

								{/* Click indicator */}
								{onOrderClick && (
									<ExternalLink className="w-3 h-3 text-text-muted" />
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Footer */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span>Total Orders: {orders.length}</span>
					<span>
						Total Value:{" "}
						{formatNaira(
							orders.reduce((sum, order) => sum + order.amount.totalMinor, 0)
						)}
					</span>
				</div>
			</div>
		</div>
	);
}
