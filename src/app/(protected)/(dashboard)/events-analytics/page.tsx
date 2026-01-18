"use client";

import React, { useState } from "react";
import { Ticket, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEventDashboard } from "@/hooks/useEventDashboard";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import LockedCard from "@/components/pro/LockedCard";
import ProBadge from "@/components/pro/ProBadge";
import {
	AreaChart,
	Area,
	XAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";

// --- Components (Migrated) ---

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

export default function EventsAnalyticsPage() {
	// 30 day range default
	const { data: eventData } = useEventDashboard();

	const { roleDetection } = useDashboardContext();
	const isPro = roleDetection?.brandSubscriptionTier === "pro";

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

	return (
		<div className="space-y-8 pb-10">
			<div>
				<h1 className="font-heading text-2xl font-semibold">
					Events Analytics
				</h1>
				<p className="text-text-muted mt-1">
					Track ticket sales, attendance, and campaign performance.
				</p>
			</div>

			{/* Hero Section */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="col-span-1 space-y-4">
					<HeroMetric
						label="Ticket Velocity"
						value={`${kpis?.ordersPerDay.toFixed(1) || "0.0"}`}
						trend="flat"
						trendValue="Stable"
						trendLabel="Tickets / Day"
						isPro={isPro}
					/>
					<div className="grid grid-cols-2 gap-4">
						<SupportingMetric
							label="Total Sold"
							value={totalSold.toLocaleString()}
							subtext="Tickets"
						/>
						<SupportingMetric
							label="Check-ins"
							value={`${kpis?.totalCheckedIn || 0}`}
							subtext={`${kpis?.checkInRate || 0}% Rate`}
						/>
					</div>
				</div>

				{isPro ? (
					<div className="col-span-1 lg:col-span-2 p-6 rounded-xl bg-surface border border-stroke min-h-[300px] flex flex-col">
						<h3 className="text-sm font-medium text-text mb-6">
							Tickets Sold Over Time
						</h3>
						<div className="flex-1 w-full h-[200px]">
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
				) : (
					<LockedCard
						title="Track ticket sales"
						description="See ticket sales velocity over time"
						height="h-auto"
						showUpgrade={false}
					/>
				)}
			</div>

			{/* Ticket Types */}
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
						<Ticket className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
						<p className="text-sm text-text-muted mb-2">Events Campaign ROI</p>
						<div className="text-xs text-cta bg-cta/10 px-3 py-1.5 rounded-full inline-block">
							Coming Soon
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
