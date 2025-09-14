// components/GatedRecentOrders.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import RecentOrdersTable from "./dashboard/RecentOrdersTable";
import { Lock, ShoppingBag, Package } from "lucide-react";
import { OrderWithVendorStatus } from "@/types/orders";

interface GatedRecentOrdersProps {
	orders: OrderWithVendorStatus[];
	onOrderClick?: (order: { id: string }) => void;
	loading?: boolean;
	className?: string;
}

export default function GatedRecentOrders({
	orders,
	onOrderClick,
	loading = false,
	className = "",
}: GatedRecentOrdersProps) {
	const ordersEnabled = isFeatureEnabled("orders");

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
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
			</div>
		);
	}

	if (ordersEnabled) {
		// Show real data when orders are enabled
		return (
			<RecentOrdersTable
				orders={orders}
				onOrderClick={onOrderClick}
				loading={loading}
				className={className}
			/>
		);
	}

	// Show locked state when orders are disabled
	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 opacity-70 cursor-not-allowed relative ${className}`}
			title="Unlocking later this season"
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text-muted">Recent Orders</h3>
				<div className="flex items-center gap-2">
					<ShoppingBag className="w-4 h-4 text-text-muted opacity-50" />
					<Lock className="w-4 h-4 text-text-muted opacity-70" />
				</div>
			</div>

			<div className="space-y-2">
				{/* Locked order rows */}
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className="flex items-center justify-between p-3 bg-background/50 border border-stroke/50 rounded-lg"
					>
						<div className="flex items-center gap-3 min-w-0 flex-1">
							{/* Order ID */}
							<div className="text-xs font-mono text-text-muted bg-background px-2 py-1 rounded border opacity-50">
								—...
							</div>

							{/* Date */}
							<div className="text-xs text-text-muted whitespace-nowrap">—</div>

							{/* Buyer */}
							<div className="text-sm text-text-muted truncate min-w-0">—</div>

							{/* Items */}
							<div className="text-xs text-text-muted truncate min-w-0">—</div>
						</div>

						<div className="flex items-center gap-3">
							{/* Fulfillment Status */}
							<div className="text-xs px-2 py-1 rounded-full bg-background/50 border border-stroke/50 text-text-muted">
								—
							</div>

							{/* Total */}
							<div className="text-sm font-medium text-text-muted">—</div>

							{/* Click indicator */}
							<Package className="w-3 h-3 text-text-muted opacity-50" />
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span>Total Orders: —</span>
					<span>Total Value: —</span>
				</div>
			</div>

			{/* Empty state message */}
			<div className="mt-4 pt-3 border-t border-stroke/50 text-center">
				<div className="text-sm text-text-muted mb-2">
					Order management coming soon
				</div>
				<div className="text-xs text-text-muted">
					Track orders, fulfillment, and customer details
				</div>
			</div>

			{/* Dropping soon indicator */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-center gap-2">
					<div className="w-2 h-2 bg-edit rounded-full animate-pulse"></div>
					<span className="text-xs text-edit">Drops with Orders</span>
				</div>
			</div>
		</div>
	);
}
