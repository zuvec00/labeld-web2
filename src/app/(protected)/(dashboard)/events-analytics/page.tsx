"use client";

import React from "react";
import {
	Ticket,
	TrendingUp,
	TrendingDown,
	Minus,
	ArrowRight,
	BarChart3,
	Users,
	CreditCard,
	RefreshCcw,
} from "lucide-react";
import { useEventDashboard } from "@/hooks/useEventDashboard";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import LockedCard from "@/components/pro/LockedCard";
import ProBadge from "@/components/pro/ProBadge";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	BarChart,
	Bar,
} from "recharts";

// --- Components ---

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

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-surface border border-stroke p-2 rounded-lg shadow-lg text-xs z-50">
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

// --- Page ---

export default function EventsAnalyticsPage() {
	// 30 day range default
	const { data: eventData, refresh } = useEventDashboard();
	const [isMigrating, setIsMigrating] = React.useState(false);

	// const { roleDetection } = useDashboardContext();
	// const isPro = roleDetection?.brandSubscriptionTier === "pro";
	const isPro = true; // Temporary: Event Analytics are currently open to all organizers

	const kpis = eventData?.kpis;
	const totalSold = kpis?.totalTicketsSold || 0;

	// Chart data: Ticket Sales (Count)
	const chartData =
		eventData?.salesOverTime?.map((d) => ({
			date: new Date(d.date).toLocaleDateString(undefined, {
				weekday: "short",
			}),
			count: d.count,
		})) || [];

	const handleMigrate = async () => {
		try {
			setIsMigrating(true);
			const migrateFn = httpsCallable(functions, "migrateEventPerformance");
			await migrateFn();
			// alert("Migration triggered. Tables should update in a few moments.");
			setTimeout(() => {
				refresh();
			}, 2000);
		} catch (error) {
			console.error("Migration failed:", error);
			alert("Migration failed. Check console.");
		} finally {
			setIsMigrating(false);
		}
	};

	// --- Hydrate Funnel Data ---
	const summary = eventData?.analyticsSummary;

	const funnelStats = {
		views: 0,
		intent: 0,
		checkout: 0,
		orders: 0,
	};

	console.log("summary", summary);

	summary?.dailyTrend.forEach((day: any) => {
		funnelStats.views += Number(
			day.funnel?.eventDetailViews || day["funnel.eventDetailViews"] || 0,
		);
		funnelStats.intent += Number(
			day.funnel?.ticketIntent || day["funnel.ticketIntent"] || 0,
		);
		funnelStats.checkout += Number(
			day.funnel?.checkoutStarted || day["funnel.checkoutStarted"] || 0,
		);
		funnelStats.orders += Number(
			day.funnel?.ordersPlaced || day["funnel.ordersPlaced"] || 0,
		);
	});

	console.log("funnelStats", funnelStats);
	const funnelData = [
		{ stage: "Event Views", value: funnelStats.views },
		{ stage: "Select Tickets", value: funnelStats.intent },
		{ stage: "Checkout", value: funnelStats.checkout },
		{ stage: "Purchased", value: funnelStats.orders },
	];

	return (
		<div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="font-heading text-2xl font-semibold flex items-center gap-3">
						Events Analytics
						<span className="text-[10px] uppercase font-bold text-text-muted border border-stroke px-2 py-0.5 rounded-full bg-surface-2 self-center">
							Platform + Site
						</span>
					</h1>
					<p className="text-text-muted mt-1">
						Track ticket sales, attendance, and conversion performance.
					</p>
				</div>
				<div className="flex items-center gap-3">
					{/* <button
						onClick={handleMigrate}
						disabled={isMigrating}
						className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text bg-surface border border-stroke rounded-md hover:bg-bg-subtle transition-colors disabled:opacity-50"
					>
						<RefreshCcw
							className={`w-3 h-3 ${isMigrating ? "animate-spin" : ""}`}
						/>
						{isMigrating ? "Fixing..." : "Fix Data"}
					</button> */}

					{/* Placeholder Date Picker */}
					<div className="text-sm font-medium text-text-muted bg-surface text-text border border-stroke px-3 py-1.5 rounded-md w-full md:w-auto text-center md:text-left">
						Last 30 Days
					</div>
				</div>
			</div>

			{/* SECTION 1: High-Level KPIs */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
				<HeroMetric
					label="Gross Revenue"
					value={`₦${(eventData?.kpis.totalRevenue ? eventData.kpis.totalRevenue / 100 : 0).toLocaleString()}`}
					trend="flat"
					trendValue="0%"
					trendLabel="vs last period"
					isPro={isPro}
				/>
				<HeroMetric
					label="Tickets Sold"
					value={`${totalSold.toLocaleString()}`}
					trend={eventData?.trend}
					trendValue={eventData?.trend === "up" ? "Growing" : "Stable"}
					trendLabel="Daily Sales Trend"
					isPro={isPro}
				/>
				<SupportingMetric
					label="Avg. Order Value"
					value={`₦${eventData?.kpis.totalOrders ? Math.round(eventData.kpis.totalRevenue / 100 / eventData.kpis.totalOrders).toLocaleString() : 0}`}
					subtext="Per checkout"
				/>
				<SupportingMetric
					label="Check-ins"
					value={`${kpis?.totalCheckedIn || 0}`}
					subtext={`${kpis?.checkInRate?.toFixed(1) || 0}% Rate`}
				/>
			</div>

			{/* SECTION 2: Performance Graph & Funnel */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Chart */}
				<div className="col-span-1 lg:col-span-2 p-6 rounded-xl bg-surface border border-stroke min-h-[300px] md:min-h-[400px] flex flex-col">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h3 className="text-sm font-medium text-text">
								Performance Over Time
							</h3>
							<p className="text-xs text-text-muted">
								Tickets sold across all channels
							</p>
						</div>
					</div>

					{isPro ? (
						<div className="flex-1 w-full relative">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={chartData}>
									<defs>
										<linearGradient
											id="colorTickets"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop offset="5%" stopColor="#9B5CFF" stopOpacity={0.2} />
											<stop offset="95%" stopColor="#9B5CFF" stopOpacity={0} />
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
										stroke="#9B5CFF"
										strokeWidth={2}
										fillOpacity={1}
										fill="url(#colorTickets)"
										name="Tickets"
									/>
								</AreaChart>
							</ResponsiveContainer>
							{chartData.length === 0 && (
								<div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
									No sales data for this period
								</div>
							)}
						</div>
					) : (
						<div className="h-full flex items-center justify-center">
							<LockedCard
								title="Analytics Graph"
								description="Upgrade to view sales trends"
								height="h-full"
								showUpgrade={true}
							/>
						</div>
					)}
				</div>

				{/* Funnel */}
				<div className="col-span-1 p-6 rounded-xl bg-surface border border-stroke flex flex-col min-h-[300px]">
					<h3 className="text-sm font-medium text-text mb-1">
						Purchase Funnel
					</h3>
					<p className="text-xs text-text-muted mb-6">
						Conversion from View to Purchase
					</p>

					{funnelStats.views > 0 ? (
						<div className="flex-1 w-full relative">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={funnelData}
									layout="vertical"
									margin={{ left: 0, right: 20 }}
								>
									<XAxis type="number" hide />
									<YAxis
										dataKey="stage"
										type="category"
										width={90}
										tick={{ fontSize: 10 }}
									/>
									<Tooltip cursor={{ fill: "transparent" }} />
									<Bar
										dataKey="value"
										fill="#9B5CFF"
										radius={[0, 4, 4, 0]}
										barSize={24}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8 border-2 border-dashed border-stroke/50 rounded-lg bg-bg-subtle/30">
							<div className="p-3 bg-surface rounded-full shadow-sm">
								<BarChart3 className="w-5 h-5 text-events" />
							</div>
							<div className="max-w-[180px]">
								<h4 className="font-medium text-sm text-text">
									Data Collecting...
								</h4>
								<p className="text-xs text-text-muted mt-1">
									Waiting for event traffic data.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* SECTION 4: Events Performance Table */}
			<div className="space-y-4">
				<h3 className="font-medium text-lg font-heading">Events Performance</h3>

				<div className="rounded-xl border border-stroke bg-surface overflow-hidden">
					<div className="overflow-x-auto">
						<div className="min-w-[800px]">
							<div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-stroke bg-bg/50 text-xs font-medium text-text-muted uppercase tracking-wider">
								<div className="col-span-4 md:col-span-4">Event</div>
								<div className="col-span-2 text-right">Status</div>
								<div className="col-span-2 text-right">Views</div>
								<div className="col-span-2 text-right">Tickets</div>
								<div className="col-span-2 text-right">Revenue</div>
							</div>

							{eventData?.eventsPerformance &&
							eventData.eventsPerformance.length > 0 ? (
								<div className="divide-y divide-stroke">
									{eventData.eventsPerformance.map((eventPerf) => (
										<div
											key={eventPerf.eventId}
											className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-bg-subtle/50 transition-colors"
										>
											<div className="col-span-4 font-medium text-sm text-text truncate">
												{eventPerf.title || "Untitled Event"}
											</div>
											<div className="col-span-2 text-right">
												<span
													className={`text-[10px] px-2 py-0.5 rounded-full border ${
														eventPerf.status === "live"
															? "bg-green-500/10 text-green-500 border-green-500/20"
															: eventPerf.status === "past"
																? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
																: "bg-blue-500/10 text-blue-500 border-blue-500/20"
													}`}
												>
													{eventPerf.status || "Unknown"}
												</span>
											</div>
											<div className="col-span-2 text-right text-sm text-text-muted">
												{eventPerf.views?.toLocaleString() || 0}
											</div>
											<div className="col-span-2 text-right text-sm text-text-muted">
												{eventPerf.ticketsSold?.toLocaleString() || 0}
											</div>
											<div className="col-span-2 text-right text-sm font-medium text-text">
												₦
												{(
													(eventPerf.revenue?.gross || 0) / 100
												).toLocaleString()}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="p-8 text-center text-text-muted text-sm">
									No event performance data available yet.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* SECTION 6: Campaign ROI (Placeholder) */}
			<div className="flex items-center justify-center p-8 rounded-xl border border-stroke border-dashed bg-bg-subtle/20">
				<div className="text-center">
					<Ticket className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-50" />
					<h4 className="text-sm font-medium text-text">Events Campaign ROI</h4>
					<div className="mt-2 text-xs text-cta bg-cta/10 px-3 py-1 rounded-full inline-block font-medium">
						Coming Soon
					</div>
				</div>
			</div>
		</div>
	);
}
