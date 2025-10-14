// components/dashboard/TopPerformers.tsx
"use client";

import { TopSKU, TopTicketType } from "@/hooks/useDashboard";
import { formatNaira } from "@/lib/orders/helpers";
import { Package, Ticket, TrendingUp } from "lucide-react";

interface TopPerformersProps {
	topSKUs: TopSKU[];
	topTicketTypes: TopTicketType[];
	loading?: boolean;
	className?: string;
}

export default function TopPerformers({
	topSKUs,
	topTicketTypes,
	loading = false,
	className = "",
}: TopPerformersProps) {
	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Top Performers</h3>
				<div className="space-y-4">
					{/* SKUs */}
					<div>
						<div className="animate-pulse flex items-center gap-2 mb-3">
							<div className="w-4 h-4 bg-stroke rounded"></div>
							<div className="h-3 bg-stroke rounded w-20"></div>
						</div>
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="animate-pulse flex items-center justify-between p-2 border border-stroke rounded"
								>
									<div className="h-3 bg-stroke rounded w-24"></div>
									<div className="h-3 bg-stroke rounded w-16"></div>
								</div>
							))}
						</div>
					</div>
					{/* Tickets */}
					<div>
						<div className="animate-pulse flex items-center gap-2 mb-3">
							<div className="w-4 h-4 bg-stroke rounded"></div>
							<div className="h-3 bg-stroke rounded w-20"></div>
						</div>
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="animate-pulse flex items-center justify-between p-2 border border-stroke rounded"
								>
									<div className="h-3 bg-stroke rounded w-24"></div>
									<div className="h-3 bg-stroke rounded w-16"></div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	const hasData = topSKUs.length > 0 || topTicketTypes.length > 0;

	if (!hasData) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Top Performers</h3>
				<div className="text-center py-8">
					<TrendingUp className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted">No performance data yet</div>
					<div className="text-xs text-text-muted mt-1">
						Top sellers will appear here
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<h3 className="font-medium text-text mb-4">Top Performers</h3>

			<div className="space-y-4">
				{/* Top SKUs */}
				{topSKUs.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-3">
							<Package className="w-4 h-4 text-text-muted" />
							<h4 className="text-sm font-medium text-text">Top SKUs</h4>
						</div>
						<div className="space-y-2">
							{topSKUs.slice(0, 3).map((sku, index) => (
								<div
									key={sku.merchItemId}
									className="flex items-center justify-between p-2 border border-stroke rounded-lg"
								>
									<div className="flex items-center gap-2 min-w-0 flex-1">
										<div className="text-xs font-medium text-text-muted bg-bg px-1.5 py-0.5 rounded">
											#{index + 1}
										</div>
										<div className="text-sm text-text truncate">{sku.name}</div>
									</div>
									<div className="text-right">
										<div className="text-sm font-medium text-text">
											{formatNaira(sku.revenue)}
										</div>
										<div className="text-xs text-text-muted">
											{sku.qtySold} sold
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Top Ticket Types */}
				{topTicketTypes.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-3">
							<Ticket className="w-4 h-4 text-text-muted" />
							<h4 className="text-sm font-medium text-text">Top Tickets</h4>
						</div>
						<div className="space-y-2">
							{topTicketTypes.slice(0, 3).map((ticket, index) => (
								<div
									key={ticket.ticketTypeId}
									className="flex items-center justify-between p-2 border border-stroke rounded-lg"
								>
									<div className="flex items-center gap-2 min-w-0 flex-1">
										<div className="text-xs font-medium text-text-muted bg-bg px-1.5 py-0.5 rounded">
											#{index + 1}
										</div>
										<div className="text-sm text-text truncate">
											{ticket.name}
										</div>
									</div>
									<div className="text-right">
										<div className="text-sm font-medium text-text">
											{ticket.qtySold} sold
										</div>
										{ticket.capacity && (
											<div className="text-xs text-text-muted">
												{Math.round((ticket.qtySold / ticket.capacity) * 100)}%
												capacity
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Summary */}
			{hasData && (
				<div className="mt-4 pt-3 border-t border-stroke/50">
					<div className="flex items-center justify-between text-xs text-text-muted">
						<span>
							{topSKUs.length > 0 &&
								`${topSKUs.length} SKU${topSKUs.length !== 1 ? "s" : ""}`}
							{topSKUs.length > 0 && topTicketTypes.length > 0 && " • "}
							{topTicketTypes.length > 0 &&
								`${topTicketTypes.length} ticket type${
									topTicketTypes.length !== 1 ? "s" : ""
								}`}
						</span>
						<span>
							{topSKUs.length > 0 &&
								formatNaira(topSKUs.reduce((sum, sku) => sum + sku.revenue, 0))}
							{topSKUs.length > 0 &&
								topTicketTypes.length > 0 &&
								" total revenue"}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
