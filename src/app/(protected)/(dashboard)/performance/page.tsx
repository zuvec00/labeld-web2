// src/app/(dashboard)/performance/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
	Eye,
	Heart,
	ExternalLink,
	ShoppingBag,
	DollarSign,
	Percent,
	Ticket,
	Users,
	Zap,
	TrendingUp,
	TrendingDown,
	ArrowRight,
	Minus,
} from "lucide-react";
import { useBrandSpace } from "@/hooks/useBrandSpace";
import { useDashboard, DashboardRange } from "@/hooks/useDashboard";
import { useEventDashboard } from "@/hooks/useEventDashboard";
import { useAnalytics } from "@/hooks/useAnalytics";
import PerformanceTimelineControls, {
	PerformanceRange,
	getDateRangeFromPerformanceRange,
} from "@/components/dashboard/PerformanceTimelineControls";
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";

// --- Components ---

function TabButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
				active
					? "bg-text text-bg border-text"
					: "bg-surface text-text-muted border-stroke hover:text-text hover:bg-bg"
			}`}
		>
			{children}
		</button>
	);
}

function HeroMetric({
	label,
	value,
	trend,
	trendValue,
	trendLabel,
}: {
	label: string;
	value: string;
	trend?: "up" | "down" | "flat";
	trendValue?: string;
	trendLabel?: string;
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
				{trend && (
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
			{trendLabel && (
				<div className="text-xs text-text-muted">{trendLabel}</div>
			)}
		</div>
	);
}

function SupportingMetric({
	label,
	value,
	subtext,
}: {
	label: string;
	value: string;
	subtext?: string;
}) {
	return (
		<div className="p-4 rounded-xl bg-bg border border-stroke">
			<div className="text-2xl font-heading font-bold text-text mb-1">
				{value}
			</div>
			<div className="text-xs font-medium text-text mb-1">{label}</div>
			{subtext && <div className="text-[10px] text-text-muted">{subtext}</div>}
		</div>
	);
}

// Custom Tooltip for Recharts
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

// --- Tab Views ---

function StudioPerformance({
	data,
}: {
	data: ReturnType<typeof useBrandSpace>["data"];
}) {
	const engagement = data?.engagement;
	const reactions = data?.reactions;

	// Prepare chart data
	const chartData =
		engagement?.dailyBreakdown?.map((day) => ({
			date: new Date(day.date).toLocaleDateString(undefined, {
				weekday: "short",
			}),
			total: day.discovery + day.product + day.social + day.linkouts,
		})) || [];

	return (
		<div className="space-y-6">
			{/* Hero & Graph Section */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Hero Metric */}
				<div className="col-span-1 space-y-4">
					<HeroMetric
						label="Engagement Rate"
						value={`${
							engagement?.uniqueUsers && engagement.uniqueUsers > 0
								? (
										(engagement.totalInteractions / engagement.uniqueUsers) *
										100
								  ).toFixed(1)
								: "0.0"
						}%`}
						trend="up"
						trendValue="+1.2%"
						trendLabel="vs previous period"
					/>
					<div className="grid grid-cols-2 gap-4">
						<SupportingMetric
							label="Total Reach"
							value={engagement?.totalInteractions?.toLocaleString() || "0"}
							subtext="Interactions"
						/>
						<SupportingMetric
							label="Reactions"
							value={reactions?.totalReactions?.toLocaleString() || "0"}
							subtext="Likes & Saves"
						/>
					</div>
				</div>

				{/* Graph */}
				<div className="col-span-1 lg:col-span-2 p-6 rounded-xl bg-surface border border-stroke min-h-[300px] flex flex-col">
					<h3 className="text-sm font-medium text-text mb-6">
						Engagement Over Time
					</h3>
					<div className="flex-1 w-full h-[200px]">
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
										<stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#e5e5e5"
								/>
								<XAxis
									dataKey="date"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "#737373" }}
									dy={10}
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
					</div>
				</div>
			</div>

			{/* Breakdown Section */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="p-6 rounded-xl bg-surface border border-stroke">
					<h3 className="text-sm font-medium text-text mb-4">
						Engagement by Type
					</h3>
					<div className="space-y-4">
						{[
							{
								label: "Product Click",
								value:
									engagement?.dailyBreakdown?.reduce(
										(s, d) => s + d.product,
										0
									) || 0,
								color: "bg-green-500",
							},
							{
								label: "Linkout",
								value:
									engagement?.dailyBreakdown?.reduce(
										(s, d) => s + d.linkouts,
										0
									) || 0,
								color: "bg-blue-500",
							},
							{
								label: "Social",
								value:
									engagement?.dailyBreakdown?.reduce(
										(s, d) => s + d.social,
										0
									) || 0,
								color: "bg-pink-500",
							},
						].map((item) => (
							<div
								key={item.label}
								className="flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 rounded-full ${item.color}`} />
									<span className="text-sm text-text-muted">{item.label}</span>
								</div>
								<span className="text-sm font-medium text-text">
									{item.value.toLocaleString()}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="p-6 rounded-xl bg-surface border border-stroke flex items-center justify-center text-center">
					<div>
						<p className="text-sm text-text-muted mb-2">
							Top Performing Content
						</p>
						<div className="text-xs text-cta bg-cta/10 px-3 py-1.5 rounded-full inline-block">
							Coming in next update
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function ShopPerformance({
	data,
	analytics,
}: {
	data: ReturnType<typeof useDashboard>["data"];
	analytics: any;
}) {
	const kpis = data?.kpis;

	// Prepare chart data (Revenue)
	const chartData =
		data?.revenueData.map((d) => ({
			date: new Date(d.date).toLocaleDateString(undefined, {
				weekday: "short",
			}),
			revenue: d.merch / 100, // Convert minor units
		})) || [];

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="col-span-1 space-y-4">
					<HeroMetric
						label="Total Revenue"
						value={kpis?.gmv ? `₦${(kpis.gmv / 100).toLocaleString()}` : "₦0"}
						trend="up"
						trendValue="+5.4%" // Placeholder
						trendLabel="vs previous period"
					/>
					<div className="grid grid-cols-2 gap-4">
						<SupportingMetric
							label="Orders"
							value={kpis?.orders?.toLocaleString() || "0"}
							subtext="Completed"
						/>
						<SupportingMetric
							label="AOV"
							value={kpis?.aov ? `₦${(kpis.aov / 100).toLocaleString()}` : "₦0"}
							subtext="Avg Order Value"
						/>
					</div>
				</div>

				<div className="col-span-1 lg:col-span-2 p-6 rounded-xl bg-surface border border-stroke min-h-[300px] flex flex-col">
					<h3 className="text-sm font-medium text-text mb-6">
						Revenue Over Time
					</h3>
					<div className="flex-1 w-full h-[200px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#e5e5e5"
								/>
								<XAxis
									dataKey="date"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "#737373" }}
									dy={10}
								/>
								<Tooltip content={<CustomTooltip />} />
								<Bar
									dataKey="revenue"
									fill="#f97316"
									radius={[4, 4, 0, 0]}
									name="Revenue (₦)"
									maxBarSize={50}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			{/* Breakdown: Top SKUs */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="p-6 rounded-xl bg-surface border border-stroke">
					<h3 className="text-sm font-medium text-text mb-4">
						Top Performing Drops
					</h3>
					{data?.topSKUs && data.topSKUs.length > 0 ? (
						<div className="space-y-3">
							{data.topSKUs.slice(0, 5).map((sku, i) => (
								<div
									key={sku.merchItemId}
									className="flex items-center justify-between p-2 rounded hover:bg-bg transition-colors"
								>
									<div className="flex items-center gap-3">
										<span className="text-xs font-medium text-text-muted w-4">
											#{i + 1}
										</span>
										<span className="text-sm text-text truncate max-w-[150px]">
											{sku.name}
										</span>
									</div>
									<div className="text-right">
										<div className="text-sm font-medium text-text">
											₦{(sku.revenue / 100).toLocaleString()}
										</div>
										<div className="text-[10px] text-text-muted">
											{sku.qtySold} sold
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-text-muted text-sm">
							No sales data yet
						</div>
					)}
				</div>

				<div className="p-6 rounded-xl bg-surface border border-stroke">
					<h3 className="text-sm font-medium text-text mb-4">
						Traffic Sources
					</h3>
					<div className="space-y-4">
						{analytics ? (
							<>
								<div className="flex items-center justify-between">
									<span className="text-sm text-text">Radar (Content)</span>
									<span className="text-sm font-medium text-text">
										{analytics.radarToStoreClicks} clicks
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-text">Moments</span>
									<span className="text-sm font-medium text-text">
										{analytics.momentToProductClicks} clicks
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-text">Events</span>
									<span className="text-sm font-medium text-text">
										{analytics.eventToStoreSpillover} clicks
									</span>
								</div>
							</>
						) : (
							<div className="text-sm text-text-muted">
								Waiting for analytics data...
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function EventsPerformance({
	data,
	eventData,
}: {
	data: ReturnType<typeof useDashboard>["data"];
	eventData: ReturnType<typeof useEventDashboard>["data"];
}) {
	const kpis = eventData?.kpis;

	// Chart data: Ticket Sales (Count)
	const chartData =
		eventData?.salesOverTime?.map((d) => ({
			date: new Date(d.date).toLocaleDateString(undefined, {
				weekday: "short",
			}),
			count: d.count,
		})) || [];

	const totalSold = eventData?.kpis?.totalTicketsSold || 0;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="col-span-1 space-y-4">
					<HeroMetric
						label="Ticket Velocity"
						value={`${kpis?.ordersPerDay.toFixed(1) || "0.0"}`}
						trend="flat"
						trendValue="Stable"
						trendLabel="Tickets / Day"
					/>
					<div className="grid grid-cols-2 gap-4">
						<SupportingMetric
							label="Total Sold"
							value={totalSold.toLocaleString()}
							subtext="Tickets"
						/>
						<SupportingMetric
							label="Conversion"
							value="—"
							subtext="View to Sale"
						/>
					</div>
				</div>

				<div className="col-span-1 lg:col-span-2 p-6 rounded-xl bg-surface border border-stroke min-h-[300px] flex flex-col">
					<h3 className="text-sm font-medium text-text mb-6">
						Tickets Sold Over Time
					</h3>
					<div className="flex-1 w-full h-[200px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<defs>
									<linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#e5e5e5"
								/>
								<XAxis
									dataKey="date"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "#737373" }}
									dy={10}
								/>
								<Tooltip content={<CustomTooltip />} />
								<Area
									type="monotone"
									dataKey="count"
									stroke="#a855f7"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorTickets)"
									name="Tickets"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="p-6 rounded-xl bg-surface border border-stroke">
					<h3 className="text-sm font-medium text-text mb-4">
						Top Ticket Types
					</h3>
					{eventData?.topTicketTypes && eventData.topTicketTypes.length > 0 ? (
						<div className="space-y-3">
							{eventData.topTicketTypes.map((t, i) => (
								<div
									key={t.ticketTypeId}
									className="flex items-center justify-between p-2 rounded hover:bg-bg transition-colors"
								>
									<div className="flex items-center gap-3">
										<span className="text-xs font-medium text-text-muted w-4">
											#{i + 1}
										</span>
										<span className="text-sm text-text truncate max-w-[150px]">
											{t.name}
										</span>
									</div>
									<div className="text-sm font-medium text-text">
										{t.qtySold} sold
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-text-muted text-sm">
							No ticket data yet
						</div>
					)}
				</div>

				<div className="p-6 rounded-xl bg-surface border border-stroke flex items-center justify-center text-center">
					<div>
						<p className="text-sm text-text-muted mb-2">Drop-off Analysis</p>
						<div className="text-xs text-cta bg-cta/10 px-3 py-1.5 rounded-full inline-block">
							Requires page view data
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// --- Main Page ---

export default function PerformancePage() {
	const [activeTab, setActiveTab] = useState("studio");

	// Timeline State
	const [timelineRange, setTimelineRange] =
		useState<PerformanceRange>("30days");
	const [customDateRange, setCustomDateRange] = useState<
		{ start: Date; end: Date } | undefined
	>(undefined);

	// Derived range for hooks
	const dateRange = useMemo(
		() => getDateRangeFromPerformanceRange(timelineRange, customDateRange),
		[timelineRange, customDateRange]
	);

	// Check if we need custom mode
	const isCustom =
		timelineRange === "custom" ||
		timelineRange === "90days" ||
		timelineRange === "12months";

	const { data: brandData, loading: brandLoading } = useBrandSpace({
		range: isCustom ? "custom" : (timelineRange as "7days" | "30days"),
		customDateRange: isCustom ? dateRange : undefined,
	});

	const {
		data: dashboardData,
		loading: dashboardLoading,
		setFilters,
		filters,
	} = useDashboard();

	// Update dashboard filters when timeline changes
	useEffect(() => {
		const dashboardRange =
			timelineRange === "7days" || timelineRange === "30days"
				? (timelineRange as DashboardRange)
				: "custom";

		setFilters({
			...filters,
			range: dashboardRange,
			customDateRange: dashboardRange === "custom" ? dateRange : undefined,
		});
	}, [timelineRange, customDateRange, dateRange]);

	const {
		data: eventData,
		loading: eventLoading,
		setTimelineRange: setEventTimelineRange,
	} = useEventDashboard();

	// Update event dashboard timeline when timeline changes
	useEffect(() => {
		if (timelineRange === "7days") {
			setEventTimelineRange("custom", dateRange);
		} else if (timelineRange === "30days") {
			setEventTimelineRange("1month");
		} else if (timelineRange === "90days") {
			setEventTimelineRange("3months");
		} else if (timelineRange === "12months") {
			setEventTimelineRange("1year");
		} else {
			setEventTimelineRange("custom", dateRange);
		}
	}, [timelineRange, customDateRange, dateRange, setEventTimelineRange]);

	const { summary: analytics, loading: analyticsLoading } =
		useAnalytics(dateRange);

	const loading =
		brandLoading || dashboardLoading || eventLoading || analyticsLoading;

	return (
		<div className="space-y-8 pb-10">
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="font-heading text-2xl font-semibold">Performance</h1>
					<p className="text-text-muted mt-1">
						Understand your growth with deep metrics and trends.
					</p>
				</div>

				{/* Timeline Controls */}
				<PerformanceTimelineControls
					value={timelineRange}
					onChange={(range, custom) => {
						setTimelineRange(range);
						setCustomDateRange(custom);
					}}
					loading={loading}
				/>
			</div>

			<div className="flex gap-2 border-b border-stroke pb-1">
				<TabButton
					active={activeTab === "studio"}
					onClick={() => setActiveTab("studio")}
				>
					Studio
				</TabButton>
				<TabButton
					active={activeTab === "shop"}
					onClick={() => setActiveTab("shop")}
				>
					Shop
				</TabButton>
				<TabButton
					active={activeTab === "events"}
					onClick={() => setActiveTab("events")}
				>
					Events
				</TabButton>
			</div>

			{loading ? (
				<div className="space-y-6 animate-pulse">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="h-64 bg-stroke/10 rounded-xl" />
						<div className="lg:col-span-2 h-64 bg-stroke/10 rounded-xl" />
					</div>
					<div className="grid grid-cols-2 gap-6">
						<div className="h-40 bg-stroke/10 rounded-xl" />
						<div className="h-40 bg-stroke/10 rounded-xl" />
					</div>
				</div>
			) : (
				<>
					{activeTab === "studio" && <StudioPerformance data={brandData} />}
					{activeTab === "shop" && (
						<ShopPerformance data={dashboardData} analytics={analytics} />
					)}
					{activeTab === "events" && (
						<EventsPerformance data={dashboardData} eventData={eventData} />
					)}
				</>
			)}
		</div>
	);
}
