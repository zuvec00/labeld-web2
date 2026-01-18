"use client";

import React, { useState } from "react";
import {
	LayoutDashboard,
	Globe,
	Radar,
	Eye,
	Heart,
	TrendingUp,
	TrendingDown,
	Minus,
} from "lucide-react";
import { useBrandSpace } from "@/hooks/useBrandSpace";
import { useDashboard } from "@/hooks/useDashboard";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import UpgradeBanner from "@/components/pro/UpgradeBanner";
import LockedCard from "@/components/pro/LockedCard";
import ProBadge from "@/components/pro/ProBadge";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";

// --- Components (Migrated from Performance) ---

function HeroMetric({
	label,
	value,
	trend,
	trendValue,
	trendLabel,
	isPro = true,
}: {
	label: string;
	value: string;
	trend?: "up" | "down" | "flat";
	trendValue?: string;
	trendLabel?: string;
	isPro?: boolean;
}) {
	const TrendIcon =
		trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
	const trendColor =
		trend === "up"
			? "text-green-500"
			: trend === "down"
			? "text-red-500"
			: "text-text-muted";
	const trendBg =
		trend === "up"
			? "bg-green-500/10"
			: trend === "down"
			? "bg-red-500/10"
			: "bg-stroke/50";

	return (
		<div className="p-6 rounded-xl bg-surface border border-stroke">
			<div className="flex items-start justify-between mb-4">
				<h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">
					{label}
				</h3>
				{isPro && trend && (
					<div
						className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${trendBg} ${trendColor}`}
					>
						<TrendIcon className="w-3 h-3" />
						{trendValue && (
							<span className="text-xs font-medium">{trendValue}</span>
						)}
					</div>
				)}
			</div>
			<div className="text-4xl font-heading font-bold text-text mb-2">
				{value}
			</div>
			{isPro && trendLabel && (
				<div className="text-xs text-text-muted">{trendLabel}</div>
			)}
			{!isPro && (
				<div className="mt-2 pt-2 border-t border-stroke flex items-center gap-2">
					<ProBadge size="sm" />
					<span className="text-[10px] text-text-muted">
						Trends available on Pro
					</span>
				</div>
			)}
		</div>
	);
}

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-surface border border-stroke p-2 rounded-lg shadow-lg text-xs">
				<p className="font-medium text-text mb-1">{label}</p>
				{payload.map((entry: any, index: number) => (
					<p key={index} style={{ color: entry.color }}>
						{entry.name}: {entry.value}
					</p>
				))}
			</div>
		);
	}
	return null;
};

export default function MarketplaceAnalyticsPage() {
	// 30 day range default for now
	const { data: brandData } = useBrandSpace({ range: "30days" });
	const { summary: analytics } = useAnalytics(30);

	const { roleDetection } = useDashboardContext();
	const isPro = roleDetection?.brandSubscriptionTier === "pro";

	const engagement = brandData?.engagement;
	const reactions = brandData?.reactions;

	// Prepare chart data for Engagement
	const chartData =
		engagement?.dailyBreakdown?.map((day) => ({
			date: new Date(day.date).toLocaleDateString(undefined, {
				weekday: "short",
			}),
			total: day.discovery + day.product + day.social + day.linkouts,
		})) || [];

	return (
		<div className="space-y-8 pb-10">
			<div>
				<h1 className="font-heading text-2xl font-semibold">
					Marketplace Analytics
				</h1>
				<p className="text-text-muted mt-1">
					How Labeld is helping people discover your brand.
				</p>
			</div>

			{/* Hero Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<HeroMetric
					label="Discovery Reach"
					value={engagement?.totalInteractions?.toLocaleString() || "0"}
					trend={isPro ? "up" : undefined}
					trendValue="+12%" // Placeholder
					trendLabel="vs last month"
					isPro={isPro}
				/>
				<HeroMetric
					label="Reactions"
					value={reactions?.totalReactions?.toLocaleString() || "0"}
					trend={isPro ? "up" : undefined}
					trendValue="+5%"
					trendLabel="vs last month"
					isPro={isPro}
				/>
				<HeroMetric
					label="Clicks to Store"
					value={(
						(analytics?.radarToStoreClicks || 0) +
						(analytics?.momentToProductClicks || 0)
					).toLocaleString()}
					trend="flat"
					trendValue="Stable"
					isPro={isPro}
				/>
			</div>

			{/* Engagement Chart */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="col-span-1 lg:col-span-2">
					{isPro ? (
						<div className="p-6 rounded-xl bg-surface border border-stroke min-h-[300px] flex flex-col">
							<h3 className="text-sm font-medium text-text mb-6">
								Discovery & Engagement Over Time
							</h3>
							<div className="w-full h-[250px]">
								{chartData.length > 0 ? (
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={chartData}>
											<defs>
												<linearGradient
													id="colorEngagement"
													x1="0"
													y1="0"
													x2="0"
													y2="1"
												>
													<stop
														offset="5%"
														stopColor="#8b5cf6"
														stopOpacity={0.2}
													/>
													<stop
														offset="95%"
														stopColor="#8b5cf6"
														stopOpacity={0}
													/>
												</linearGradient>
											</defs>
											<CartesianGrid
												strokeDasharray="3 3"
												vertical={false}
												stroke="#f1f5f9"
											/>
											<XAxis
												dataKey="date"
												axisLine={false}
												tickLine={false}
												tick={{ fontSize: 10, fill: "#94a3b8" }}
												dy={10}
											/>
											<YAxis
												axisLine={false}
												tickLine={false}
												tick={{ fontSize: 10, fill: "#94a3b8" }}
												tickFormatter={(value) =>
													value >= 1000
														? `${(value / 1000).toFixed(1)}k`
														: value
												}
											/>
											<Tooltip content={<CustomTooltip />} />
											<Area
												type="monotone"
												dataKey="total"
												stroke="#8b5cf6"
												strokeWidth={2}
												fillOpacity={1}
												fill="url(#colorEngagement)"
												name="Interactions"
											/>
										</AreaChart>
									</ResponsiveContainer>
								) : (
									<div className="w-full h-full grid place-items-center text-text-muted text-sm">
										No engagement data available yet.
									</div>
								)}
							</div>
						</div>
					) : (
						<LockedCard
							title="Track discovery trends"
							description="See how your brand visibility grows over time on the marketplace"
							height="h-full"
							showUpgrade={true}
						/>
					)}
				</div>

				{/* Traffic Sources Breakdown */}
				<div className="p-6 rounded-xl bg-surface border border-stroke h-full">
					<h3 className="text-sm font-medium text-text mb-4">
						Traffic Sources
					</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Radar className="w-4 h-4 text-accent" />
								<span className="text-sm text-text">Radar (Content)</span>
							</div>
							<span className="text-sm font-medium text-text">
								{analytics?.radarToStoreClicks || 0} clicks
							</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Globe className="w-4 h-4 text-blue-500" />
								<span className="text-sm text-text">Moments (Discovery)</span>
							</div>
							<span className="text-sm font-medium text-text">
								{analytics?.momentToProductClicks || 0} clicks
							</span>
						</div>

						<div className="mt-4 pt-4 border-t border-stroke">
							<p className="text-xs text-text-muted">
								High clicks from Radar indicate strong content performance.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Top Content */}
			<div className="p-6 rounded-xl bg-surface border border-stroke">
				<h3 className="text-sm font-medium text-text mb-4">
					Top Performing Content
				</h3>
				{brandData?.recentContent && brandData.recentContent.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[...brandData.recentContent]
							.sort((a, b) => b.reactionsCount - a.reactionsCount)
							.slice(0, 3)
							.map((item, i) => (
								<div
									key={item.id}
									className="flex items-center gap-3 p-3 rounded-lg bg-bg border border-stroke hover:border-accent/30 transition-all"
								>
									<div className="w-12 h-12 rounded bg-stroke/30 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
										{item.teaserImageUrl ? (
											<img
												src={item.teaserImageUrl}
												alt="Content"
												className="w-full h-full object-cover"
											/>
										) : (
											<Eye className="w-4 h-4 text-text-muted" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm text-text font-medium truncate">
											{item.caption || "Untitled Post"}
										</p>
										<div className="flex items-center gap-3 mt-1">
											<div className="flex items-center gap-1 text-text-muted">
												<Heart className="w-3 h-3" />
												<span className="text-xs">{item.reactionsCount}</span>
											</div>
											<div className="text-[10px] text-text-muted">
												{new Date(item.createdAt).toLocaleDateString()}
											</div>
										</div>
									</div>
								</div>
							))}
					</div>
				) : (
					<div className="text-center py-8 text-text-muted text-sm">
						No content posted yet. Start posting on Radar to appear here.
					</div>
				)}
			</div>
		</div>
	);
}
