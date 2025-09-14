// components/dashboard/EngagementOverview.tsx
"use client";

import React from "react";
import { TrendingUp, Users, MessageSquare, Eye } from "lucide-react";
import { EngagementData } from "@/hooks/useBrandSpace";

interface EngagementOverviewProps {
	data: EngagementData | null;
	loading?: boolean;
	className?: string;
}

export default function EngagementOverview({
	data,
	loading = false,
	className = "",
}: EngagementOverviewProps) {
	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
					<div className="grid grid-cols-3 gap-4 mb-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="text-center">
								<div className="h-6 bg-stroke rounded w-12 mx-auto mb-1"></div>
								<div className="h-3 bg-stroke rounded w-16 mx-auto"></div>
							</div>
						))}
					</div>
					<div className="h-32 bg-stroke rounded"></div>
				</div>
			</div>
		);
	}

	const hasData = data && data.totalInteractions > 0;

	if (!hasData) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Engagement Overview</h3>
				<div className="text-center py-8">
					<Eye className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted mb-2">No engagement data yet</div>
					<div className="text-xs text-text-muted">
						Post more to increase engagement
					</div>
				</div>
			</div>
		);
	}

	// Calculate totals for each category
	const discoveryTotal =
		data?.dailyBreakdown.reduce((sum, day) => sum + day.discovery, 0) || 0;
	const productTotal =
		data?.dailyBreakdown.reduce((sum, day) => sum + day.product, 0) || 0;
	const socialTotal =
		data?.dailyBreakdown.reduce((sum, day) => sum + day.social, 0) || 0;
	const linkoutsTotal =
		data?.dailyBreakdown.reduce((sum, day) => sum + day.linkouts, 0) || 0;

	const maxValue = Math.max(
		discoveryTotal,
		productTotal,
		socialTotal,
		linkoutsTotal
	);

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<h3 className="font-medium text-text mb-4">
				Engagement Overview (last 7 days)
			</h3>

			{/* KPIs */}
			<div className="grid grid-cols-3 gap-4 mb-6">
				<div className="text-center">
					<div className="text-lg font-heading font-semibold text-text">
						{data?.totalInteractions || 0}
					</div>
					<div className="text-xs text-text-muted">Total interactions</div>
				</div>
				<div className="text-center">
					<div className="text-lg font-heading font-semibold text-text">
						{data?.uniqueUsers || 0}
					</div>
					<div className="text-xs text-text-muted">Unique users</div>
				</div>
				<div className="text-center">
					<div className="text-lg font-heading font-semibold text-text">
						{data?.engagementPerPost?.toFixed(1) || "0.0"}
					</div>
					<div className="text-xs text-text-muted">Engagement/post</div>
				</div>
			</div>

			{/* Chart */}
			<div className="space-y-3">
				<div className="text-sm font-medium text-text mb-2">
					Actions by category
				</div>

				{/* Discovery */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
						<span className="text-sm text-text">Discovery</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-20 h-2 bg-background rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-500 transition-all"
								style={{
									width: `${
										maxValue > 0 ? (discoveryTotal / maxValue) * 100 : 0
									}%`,
								}}
							/>
						</div>
						<span className="text-sm font-medium text-text w-8 text-right">
							{discoveryTotal}
						</span>
					</div>
				</div>

				{/* Product */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<div className="w-3 h-3 bg-green-500 rounded-sm"></div>
						<span className="text-sm text-text">Product intent</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-20 h-2 bg-background rounded-full overflow-hidden">
							<div
								className="h-full bg-green-500 transition-all"
								style={{
									width: `${
										maxValue > 0 ? (productTotal / maxValue) * 100 : 0
									}%`,
								}}
							/>
						</div>
						<span className="text-sm font-medium text-text w-8 text-right">
							{productTotal}
						</span>
					</div>
				</div>

				{/* Social */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
						<span className="text-sm text-text">Social</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-20 h-2 bg-background rounded-full overflow-hidden">
							<div
								className="h-full bg-purple-500 transition-all"
								style={{
									width: `${
										maxValue > 0 ? (socialTotal / maxValue) * 100 : 0
									}%`,
								}}
							/>
						</div>
						<span className="text-sm font-medium text-text w-8 text-right">
							{socialTotal}
						</span>
					</div>
				</div>

				{/* Link-outs */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
						<span className="text-sm text-text">Link-outs</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-20 h-2 bg-background rounded-full overflow-hidden">
							<div
								className="h-full bg-orange-500 transition-all"
								style={{
									width: `${
										maxValue > 0 ? (linkoutsTotal / maxValue) * 100 : 0
									}%`,
								}}
							/>
						</div>
						<span className="text-sm font-medium text-text w-8 text-right">
							{linkoutsTotal}
						</span>
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex flex-wrap gap-2">
					<span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
						Discovery
					</span>
					<span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
						Product
					</span>
					<span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
						Social
					</span>
					<span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
						Link-outs
					</span>
				</div>
			</div>
		</div>
	);
}
