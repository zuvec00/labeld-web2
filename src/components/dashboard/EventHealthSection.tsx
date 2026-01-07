// components/dashboard/EventHealthSection.tsx
"use client";

import React from "react";
import {
	Ticket,
	TrendingUp,
	TrendingDown,
	Minus,
	Zap,
	CheckCircle,
	Info,
} from "lucide-react";
import { EventDashboardData } from "@/hooks/useEventDashboard";

interface EventHealthSectionProps {
	data: EventDashboardData | null;
	loading?: boolean;
}

// Tooltip component
function MetricTooltip({
	content,
	children,
}: {
	content: string;
	children: React.ReactNode;
}) {
	const [isVisible, setIsVisible] = React.useState(false);

	return (
		<div className="relative inline-block">
			<div
				onMouseEnter={() => setIsVisible(true)}
				onMouseLeave={() => setIsVisible(false)}
				className="cursor-help"
			>
				{children}
			</div>
			{isVisible && (
				<div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-text bg-surface border border-stroke rounded-lg shadow-lg whitespace-nowrap">
					{content}
					<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
						<div className="border-4 border-transparent border-t-stroke" />
					</div>
				</div>
			)}
		</div>
	);
}

function TicketsSoldCard({
	ticketsSold,
	trend,
}: {
	ticketsSold: number;
	trend: "up" | "down" | "flat";
}) {
	const TrendIcon =
		trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

	return (
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-purple-500/30 transition-all hover:shadow-lg">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-purple-500/10">
						<Ticket className="w-5 h-5 text-purple-500" />
					</div>
					<MetricTooltip content="Total tickets sold across all your events">
						<div className="flex items-center gap-1">
							<h3 className="text-sm font-medium text-text">Tickets Sold</h3>
							<Info className="w-3 h-3 text-text-muted" />
						</div>
					</MetricTooltip>
				</div>
				<div
					className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
						trend === "up"
							? "bg-green-500/10 text-green-500"
							: trend === "down"
							? "bg-red-500/10 text-red-500"
							: "bg-gray-500/10 text-gray-500"
					}`}
				>
					<TrendIcon className="w-3 h-3" />
					<span>
						{trend === "up"
							? "Rising"
							: trend === "down"
							? "Slowing"
							: "Stable"}
					</span>
				</div>
			</div>

			<div className="flex items-baseline gap-2 mb-2">
				<span className="text-4xl font-heading font-bold text-text">
					{ticketsSold.toLocaleString()}
				</span>
				<span className="text-sm text-text-muted">tickets</span>
			</div>

			<p className="text-sm text-text-muted">Total across all events</p>
		</div>
	);
}

function VelocityCard({ ordersPerDay }: { ordersPerDay: number }) {
	return (
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-purple-500/30 transition-all hover:shadow-lg">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-blue-500/10">
						<Zap className="w-5 h-5 text-blue-500" />
					</div>
					<MetricTooltip content="Average ticket orders per day in the selected period">
						<div className="flex items-center gap-1">
							<h3 className="text-sm font-medium text-text">
								Traffic Velocity
							</h3>
							<Info className="w-3 h-3 text-text-muted" />
						</div>
					</MetricTooltip>
				</div>
			</div>

			<div className="flex items-baseline gap-2 mb-2">
				<span className="text-4xl font-heading font-bold text-text">
					{ordersPerDay.toFixed(1)}
				</span>
				<span className="text-sm text-text-muted">orders/day</span>
			</div>

			<p className="text-sm text-text-muted">Average ticket velocity</p>
		</div>
	);
}

function CheckInRateCard({
	checkIns,
	ticketsSold,
	rate,
}: {
	checkIns: number;
	ticketsSold: number;
	rate: number;
}) {
	return (
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-purple-500/30 transition-all hover:shadow-lg">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-green-500/10">
						<CheckCircle className="w-5 h-5 text-green-500" />
					</div>
					<MetricTooltip content="Percentage of sold tickets that have been scanned at events">
						<div className="flex items-center gap-1">
							<h3 className="text-sm font-medium text-text">Check-in Rate</h3>
							<Info className="w-3 h-3 text-text-muted" />
						</div>
					</MetricTooltip>
				</div>
			</div>

			<div className="flex items-baseline gap-2 mb-2">
				<span className="text-4xl font-heading font-bold text-text">
					{rate.toFixed(0)}%
				</span>
			</div>

			<p className="text-sm text-text-muted">
				{checkIns.toLocaleString()} of {ticketsSold.toLocaleString()} scanned
			</p>
		</div>
	);
}

// Guidance micro-copy component
function EventGuidance({
	ticketsSold,
	upcomingEventsCount,
}: {
	ticketsSold: number;
	upcomingEventsCount: number;
}) {
	const messages: string[] = [];

	if (upcomingEventsCount === 0) {
		messages.push("📅 Create your next event to keep the momentum going");
	} else if (ticketsSold === 0) {
		messages.push("🎟️ Share your event on Radar to drive ticket sales");
	} else if (ticketsSold < 10) {
		messages.push("🚀 Early momentum! Consider adding early-bird pricing");
	} else {
		messages.push("🔥 Great ticket sales! Consider promoting on social media");
	}

	return (
		<div className="mt-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
			<p className="text-sm text-text">{messages[0]}</p>
		</div>
	);
}

export default function EventHealthSection({
	data,
	loading = false,
}: EventHealthSectionProps) {
	if (loading || !data) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="h-6 w-32 bg-stroke rounded animate-pulse mb-2" />
						<div className="h-4 w-48 bg-stroke rounded animate-pulse" />
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="rounded-xl bg-surface border border-stroke p-5"
						>
							<div className="animate-pulse space-y-3">
								<div className="h-4 w-24 bg-stroke rounded" />
								<div className="h-10 w-20 bg-stroke rounded" />
								<div className="h-3 w-32 bg-stroke rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	const { kpis, trend } = data;

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-heading font-semibold text-text">
					Event Health
				</h2>
				<p className="text-sm text-text-muted">
					Is your event alive? Here's your pulse check.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<TicketsSoldCard ticketsSold={kpis.totalTicketsSold} trend={trend} />
				<VelocityCard ordersPerDay={kpis.ordersPerDay} />
				<CheckInRateCard
					checkIns={kpis.totalCheckedIn}
					ticketsSold={kpis.totalTicketsSold}
					rate={kpis.checkInRate}
				/>
			</div>

			<EventGuidance
				ticketsSold={kpis.totalTicketsSold}
				upcomingEventsCount={kpis.upcomingEventsCount}
			/>
		</div>
	);
}
