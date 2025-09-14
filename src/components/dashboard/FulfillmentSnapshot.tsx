// components/dashboard/FulfillmentSnapshot.tsx
"use client";

import { FulfillmentCounts } from "@/hooks/useDashboard";
import { Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FulfillmentSnapshotProps {
	counts: FulfillmentCounts;
	onReviewOrders?: () => void;
	loading?: boolean;
	className?: string;
}

export default function FulfillmentSnapshot({
	counts,
	onReviewOrders,
	loading = false,
	className = "",
}: FulfillmentSnapshotProps) {
	const total =
		counts.unfulfilled + counts.shipped + counts.delivered + counts.cancelled;

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Fulfillment Snapshot</h3>
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
		);
	}

	if (total === 0) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Fulfillment Snapshot</h3>
				<div className="text-center py-8">
					<Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted">No fulfillment data</div>
					<div className="text-xs text-text-muted mt-1">All caught up!</div>
				</div>
			</div>
		);
	}

	const fulfillmentItems = [
		{
			status: "unfulfilled" as const,
			label: "Unfulfilled",
			count: counts.unfulfilled,
			icon: Package,
			color: "text-edit",
			bgColor: "bg-edit/10",
			borderColor: "border-edit/20",
		},
		{
			status: "shipped" as const,
			label: "Shipped",
			count: counts.shipped,
			icon: Truck,
			color: "text-calm-1",
			bgColor: "bg-calm-1/10",
			borderColor: "border-calm-1/20",
		},
		{
			status: "delivered" as const,
			label: "Delivered",
			count: counts.delivered,
			icon: CheckCircle,
			color: "text-accent",
			bgColor: "bg-accent/10",
			borderColor: "border-accent/20",
		},
		{
			status: "cancelled" as const,
			label: "Cancelled",
			count: counts.cancelled,
			icon: XCircle,
			color: "text-alert",
			bgColor: "bg-alert/10",
			borderColor: "border-alert/20",
		},
	];

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text">Fulfillment Snapshot</h3>
				{counts.unfulfilled > 0 && onReviewOrders && (
					<Button
						text={`Review ${counts.unfulfilled} orders`}
						onClick={onReviewOrders}
						variant="primary"
						className="text-xs px-3 py-1"
					/>
				)}
			</div>

			<div className="space-y-3">
				{fulfillmentItems.map((item) => {
					const Icon = item.icon;
					const percentage =
						total > 0 ? Math.round((item.count / total) * 100) : 0;

					return (
						<div
							key={item.status}
							className={`flex items-center justify-between p-3 rounded-lg border ${item.bgColor} ${item.borderColor}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`p-2 rounded-lg ${item.bgColor} ${item.borderColor} border`}
								>
									<Icon className={`w-4 h-4 ${item.color}`} />
								</div>
								<div>
									<div className="text-sm font-medium text-text">
										{item.label}
									</div>
									<div className="text-xs text-text-muted">
										{percentage}% of total
									</div>
								</div>
							</div>
							<div className="text-right">
								<div
									className={`text-lg font-heading font-semibold ${item.color}`}
								>
									{item.count}
								</div>
								<div className="text-xs text-text-muted">
									{item.count === 1 ? "order" : "orders"}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Summary */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-sm">
					<span className="text-text-muted">Total Orders</span>
					<span className="font-medium text-text">{total}</span>
				</div>
				<div className="flex items-center justify-between text-sm mt-1">
					<span className="text-text-muted">Completion Rate</span>
					<span className="font-medium text-text">
						{total > 0
							? Math.round(((counts.shipped + counts.delivered) / total) * 100)
							: 0}
						%
					</span>
				</div>
			</div>
		</div>
	);
}
