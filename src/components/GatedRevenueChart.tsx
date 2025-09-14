// components/GatedRevenueChart.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import RevenueChart from "./dashboard/RevenueChart";
import { RevenueDataPoint } from "@/hooks/useDashboard";
import { Lock, BarChart3 } from "lucide-react";

interface GatedRevenueChartProps {
	data: RevenueDataPoint[];
	loading?: boolean;
	className?: string;
}

export default function GatedRevenueChart({
	data,
	loading = false,
	className = "",
}: GatedRevenueChartProps) {
	const ordersEnabled = isFeatureEnabled("orders");

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Revenue Analytics</h3>
				<div className="h-64 flex items-center justify-center">
					<div className="animate-pulse text-text-muted">Loading chart...</div>
				</div>
			</div>
		);
	}

	if (ordersEnabled) {
		// Show real chart when orders are enabled
		return <RevenueChart data={data} loading={loading} className={className} />;
	}

	// Show locked state when orders are disabled
	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 opacity-70 cursor-not-allowed relative ${className}`}
			title="Unlocking later this season"
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text-muted">Revenue Analytics</h3>
				<div className="flex items-center gap-2">
					<BarChart3 className="w-4 h-4 text-text-muted opacity-50" />
					<Lock className="w-4 h-4 text-text-muted opacity-70" />
				</div>
			</div>

			<div className="h-64 flex flex-col items-center justify-center text-center">
				<div className="text-4xl mb-4 opacity-50">📊</div>
				<div className="text-text-muted mb-2">
					BrandSpace analytics only for now
				</div>
				<div className="text-sm text-text-muted">
					Commerce metrics drop later this season
				</div>
			</div>

			{/* Legend showing locked series */}
			<div className="mt-4 pt-4 border-t border-stroke/50">
				<div className="flex items-center justify-center gap-6">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-blue-500/30 rounded-sm"></div>
						<span className="text-xs text-text-muted">Tickets</span>
						<span className="text-xs px-2 py-0.5 rounded-full bg-edit/10 text-edit border border-edit/20">
							Dropping soon
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-green-500/30 rounded-sm"></div>
						<span className="text-xs text-text-muted">Merch</span>
						<span className="text-xs px-2 py-0.5 rounded-full bg-edit/10 text-edit border border-edit/20">
							Dropping soon
						</span>
					</div>
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
