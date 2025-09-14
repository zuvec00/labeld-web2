// components/GatedFulfillmentSnapshot.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import FulfillmentSnapshot from "./dashboard/FulfillmentSnapshot";
import { Lock, Package, Truck, CheckCircle, XCircle } from "lucide-react";

interface GatedFulfillmentSnapshotProps {
	counts: {
		unfulfilled: number;
		shipped: number;
		delivered: number;
		cancelled: number;
	};
	onReviewOrders?: () => void;
	loading?: boolean;
	className?: string;
}

export default function GatedFulfillmentSnapshot({
	counts,
	onReviewOrders,
	loading = false,
	className = "",
}: GatedFulfillmentSnapshotProps) {
	const ordersEnabled = isFeatureEnabled("orders");

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
					<div className="space-y-3">
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className="animate-pulse flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 bg-stroke rounded"></div>
									<div className="h-3 bg-stroke rounded w-20"></div>
								</div>
								<div className="h-3 bg-stroke rounded w-8"></div>
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
			<FulfillmentSnapshot
				counts={counts}
				onReviewOrders={onReviewOrders}
				loading={loading}
				className={className}
			/>
		);
	}

	// Show locked state when orders are disabled
	const fulfillmentItems = [
		{
			status: "unfulfilled" as const,
			label: "Unfulfilled",
			icon: Package,
			color: "text-edit",
			bgColor: "bg-edit/10",
			borderColor: "border-edit/20",
		},
		{
			status: "shipped" as const,
			label: "Shipped",
			icon: Truck,
			color: "text-calm-1",
			bgColor: "bg-calm-1/10",
			borderColor: "border-calm-1/20",
		},
		{
			status: "delivered" as const,
			label: "Delivered",
			icon: CheckCircle,
			color: "text-accent",
			bgColor: "bg-accent/10",
			borderColor: "border-accent/20",
		},
		{
			status: "cancelled" as const,
			label: "Cancelled",
			icon: XCircle,
			color: "text-alert",
			bgColor: "bg-alert/10",
			borderColor: "border-alert/20",
		},
	];

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 opacity-70 cursor-not-allowed relative ${className}`}
			title="Unlocking later this season"
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text-muted">Fulfillment Snapshot</h3>
				<div className="flex items-center gap-2">
					<Package className="w-4 h-4 text-text-muted opacity-50" />
					<Lock className="w-4 h-4 text-text-muted opacity-70" />
				</div>
			</div>

			<div className="space-y-3">
				{fulfillmentItems.map((item) => {
					const Icon = item.icon;

					return (
						<div
							key={item.status}
							className={`flex items-center justify-between p-3 rounded-lg border ${item.bgColor} ${item.borderColor} opacity-50`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`p-2 rounded-lg ${item.bgColor} ${item.borderColor} border`}
								>
									<Icon className={`w-4 h-4 ${item.color} opacity-50`} />
								</div>
								<div>
									<div className="text-sm font-medium text-text-muted">
										{item.label}
									</div>
									<div className="text-xs text-text-muted">—% of total</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-lg font-heading font-semibold text-text-muted">
									—
								</div>
								<div className="text-xs text-text-muted">orders</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Summary */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-sm">
					<span className="text-text-muted">Total Orders</span>
					<span className="font-medium text-text-muted">—</span>
				</div>
				<div className="flex items-center justify-between text-sm mt-1">
					<span className="text-text-muted">Completion Rate</span>
					<span className="font-medium text-text-muted">—%</span>
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
