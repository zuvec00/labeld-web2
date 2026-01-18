"use client";

import {
	Sparkles,
	TrendingUp,
	TrendingDown,
	Eye,
	AlertCircle,
} from "lucide-react";
import ProBadge from "./ProBadge";

interface DropPerformance {
	current: { name: string; revenue: number; orders: number } | null;
	previous: { name: string; revenue: number; orders: number } | null;
}

interface ProductIntelligenceProps {
	topSKU?: { name: string; revenue: number; qtySold: number };
	dropPerformance?: DropPerformance;
	opportunityProduct?: { name: string; views: number; conversionRate: number };
}

export default function ProductIntelligence({
	topSKU,
	dropPerformance,
	opportunityProduct,
}: ProductIntelligenceProps) {
	// Drop Logic
	const currentRevenue = dropPerformance?.current?.revenue || 0;
	const prevRevenue = dropPerformance?.previous?.revenue || 0;
	const growth =
		prevRevenue > 0
			? ((currentRevenue - prevRevenue) / prevRevenue) * 100
			: currentRevenue > 0
			? 100
			: 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Sparkles className="w-5 h-5 text-accent" />
				<h3 className="font-heading font-semibold text-lg">
					Product Intelligence
				</h3>
				<ProBadge />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Best Performer (Top Revenue) */}
				<div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
					<div className="flex items-start justify-between mb-2">
						<div className="flex items-center gap-2">
							<TrendingUp className="w-4 h-4 text-green-600" />
							<span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
								Top Performer
							</span>
						</div>
					</div>
					{topSKU ? (
						<>
							<h4 className="font-medium text-text mb-1 truncate">
								{topSKU.name}
							</h4>
							<p className="text-sm text-text-muted mb-3">
								Generated ₦{(topSKU.revenue / 100).toLocaleString()} in revenue
								from {topSKU.qtySold} orders.
							</p>
						</>
					) : (
						<p className="text-sm text-text-muted mt-2">
							No sales data available yet.
						</p>
					)}
				</div>

				{/* High Interest, Low Sales (Opportunity) */}
				<div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
					<div className="flex items-start justify-between mb-2">
						<div className="flex items-center gap-2">
							<Eye className="w-4 h-4 text-orange-600" />
							<span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
								High Interest, Low Sales
							</span>
						</div>
					</div>
					{opportunityProduct ? (
						<>
							<h4 className="font-medium text-text mb-1 truncate">
								{opportunityProduct.name}
							</h4>
							<p className="text-sm text-text-muted mb-3">
								High views ({opportunityProduct.views}) but low conversion (
								{opportunityProduct.conversionRate.toFixed(1)}%). Consider
								improving product visuals.
							</p>
						</>
					) : (
						<p className="text-sm text-text-muted mt-2">
							No significant opportunities detected yet.
						</p>
					)}
				</div>
			</div>

			{/* Drop Comparison */}
			<div className="p-5 rounded-xl bg-surface border border-stroke">
				<h4 className="text-sm font-medium text-text mb-4">
					Drop vs Drop Performance
				</h4>
				{dropPerformance?.current ? (
					<div className="space-y-4">
						<div className="relative pt-6">
							<div className="flex items-end justify-between text-xs text-text-muted mb-2">
								<span>{dropPerformance.previous?.name || "Previous Drop"}</span>
								<span>{dropPerformance.current.name} (Current)</span>
							</div>
							<div className="h-2 bg-stroke/30 rounded-full overflow-hidden flex relative">
								{/* Visual bar logic: normalize to max value */}
								{(() => {
									const max = Math.max(currentRevenue, prevRevenue, 1);
									const currentPct = (currentRevenue / max) * 100;
									const prevPct = (prevRevenue / max) * 100;
									return (
										<>
											{prevRevenue > 0 && (
												<div
													className="absolute top-0 bottom-0 left-0 bg-text/20 z-10"
													style={{ width: `${prevPct}%` }}
												/>
											)}
											<div
												className="absolute top-0 bottom-0 left-0 bg-accent/80 z-20 mix-blend-multiply"
												style={{ width: `${currentPct}%` }}
											/>
										</>
									);
								})()}
							</div>
							<div className="mt-2 flex justify-between text-sm font-medium">
								<span className="text-text-muted">
									₦{(prevRevenue / 100).toLocaleString()}
								</span>
								<span className="text-accent">
									₦{(currentRevenue / 100).toLocaleString()} (
									{growth > 0 ? "+" : ""}
									{growth.toFixed(0)}%)
								</span>
							</div>
						</div>
						<p className="text-xs text-text-muted">
							{growth > 0
								? `Your current drop is outpacing the previous one by ${growth.toFixed(
										0
								  )}%.`
								: "Current drop revenue is tracking behind the previous launch."}
						</p>
					</div>
				) : (
					<div className="text-center py-6 text-sm text-text-muted">
						Not enough drop history to compare.
					</div>
				)}
			</div>
		</div>
	);
}
