// components/GatedTopPerformers.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import TopPerformers from "./dashboard/TopPerformers";
import { Lock, TrendingUp, Package, Ticket } from "lucide-react";

interface GatedTopPerformersProps {
	topSKUs: Array<{
		merchItemId: string;
		name: string;
		qtySold: number;
		revenue: number;
	}>;
	topTicketTypes: Array<{
		ticketTypeId: string;
		name: string;
		qtySold: number;
		capacity?: number;
	}>;
	loading?: boolean;
	className?: string;
}

export default function GatedTopPerformers({
	topSKUs,
	topTicketTypes,
	loading = false,
	className = "",
}: GatedTopPerformersProps) {
	const ordersEnabled = isFeatureEnabled("orders");

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
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
			</div>
		);
	}

	if (ordersEnabled) {
		// Show real data when orders are enabled
		return (
			<TopPerformers
				topSKUs={topSKUs}
				topTicketTypes={topTicketTypes}
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
				<h3 className="font-medium text-text-muted">Top Performers</h3>
				<div className="flex items-center gap-2">
					<TrendingUp className="w-4 h-4 text-text-muted opacity-50" />
					<Lock className="w-4 h-4 text-text-muted opacity-70" />
				</div>
			</div>

			<div className="space-y-4">
				{/* Top SKUs Section */}
				<div>
					<div className="flex items-center gap-2 mb-3">
						<Package className="w-4 h-4 text-text-muted opacity-50" />
						<span className="text-sm font-medium text-text-muted">
							Top SKUs
						</span>
						<span className="text-xs px-2 py-0.5 rounded-full bg-edit/10 text-edit border border-edit/20">
							Dropping soon
						</span>
					</div>
					<div className="space-y-2">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex items-center justify-between p-2 bg-bg/50 border border-stroke/50 rounded-lg"
							>
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<div className="text-xs font-medium text-text-muted bg-bg px-1.5 py-0.5 rounded">
										#{i}
									</div>
									<div className="text-sm text-text-muted truncate">—</div>
								</div>
								<div className="text-right">
									<div className="text-sm font-medium text-text-muted">—</div>
									<div className="text-xs text-text-muted">— sold</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Top Ticket Types Section */}
				<div>
					<div className="flex items-center gap-2 mb-3">
						<Ticket className="w-4 h-4 text-text-muted opacity-50" />
						<span className="text-sm font-medium text-text-muted">
							Top Tickets
						</span>
						<span className="text-xs px-2 py-0.5 rounded-full bg-edit/10 text-edit border border-edit/20">
							Dropping soon
						</span>
					</div>
					<div className="space-y-2">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="flex items-center justify-between p-2 bg-bg/50 border border-stroke/50 rounded-lg"
							>
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<div className="text-xs font-medium text-text-muted bg-bg px-1.5 py-0.5 rounded">
										#{i}
									</div>
									<div className="text-sm text-text-muted truncate">—</div>
								</div>
								<div className="text-right">
									<div className="text-sm font-medium text-text-muted">
										— sold
									</div>
									<div className="text-xs text-text-muted">—% capacity</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Summary */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span>— SKUs • — ticket types</span>
					<span>— total revenue</span>
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
