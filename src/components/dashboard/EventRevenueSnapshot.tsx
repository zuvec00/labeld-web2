// components/dashboard/EventRevenueSnapshot.tsx
"use client";

import React from "react";
import {
	DollarSign,
	Ticket,
	Wallet,
	CheckCircle,
	ExternalLink,
} from "lucide-react";
import { EventDashboardData } from "@/hooks/useEventDashboard";
import Link from "next/link";

interface EventRevenueSnapshotProps {
	data: EventDashboardData | null;
	loading?: boolean;
}

function formatCurrency(amountMinor: number): string {
	const amount = amountMinor / 100;
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function MetricCard({
	icon: Icon,
	label,
	value,
	subtitle,
	iconColor = "text-purple-500",
	href,
}: {
	icon: React.ElementType;
	label: string;
	value: string | number;
	subtitle?: string;
	iconColor?: string;
	href?: string;
}) {
	const content = (
		<div className="rounded-xl bg-surface border border-stroke p-4 hover:border-purple-500/30 transition-all hover:shadow-lg group">
			<div className="flex items-start justify-between mb-2">
				<div
					className={`p-2 rounded-lg ${iconColor.replace("text-", "bg-")}/10`}
				>
					<Icon className={`w-4 h-4 ${iconColor}`} />
				</div>
				{href && (
					<ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
				)}
			</div>
			<div className="text-2xl font-heading font-bold text-text mb-1">
				{value}
			</div>
			<p className="text-xs text-text-muted">{label}</p>
			{subtitle && (
				<p className="text-[10px] text-text-muted mt-1">{subtitle}</p>
			)}
		</div>
	);

	if (href) {
		return <Link href={href}>{content}</Link>;
	}

	return content;
}

function CheckInSummary({
	checkIns,
	ticketsSold,
	rate,
}: {
	checkIns: number;
	ticketsSold: number;
	rate: number;
}) {
	return (
		<div className="rounded-xl bg-surface border border-stroke p-4">
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-sm font-medium text-text">Check-in Summary</h4>
				<span className="text-sm text-text-muted">
					{rate.toFixed(0)}% checked in
				</span>
			</div>

			{/* Progress bar */}
			<div className="h-2 rounded-full bg-bg overflow-hidden mb-3">
				<div
					className="bg-gradient-to-r from-purple-500 to-purple-400 h-full rounded-full transition-all"
					style={{ width: `${Math.min(rate, 100)}%` }}
				/>
			</div>

			{/* Stats */}
			<div className="flex items-center justify-between text-xs">
				<div className="flex items-center gap-1.5">
					<CheckCircle className="w-3 h-3 text-green-500" />
					<span className="text-text-muted">
						{checkIns.toLocaleString()} scanned
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<Ticket className="w-3 h-3 text-purple-500" />
					<span className="text-text-muted">
						{ticketsSold.toLocaleString()} sold
					</span>
				</div>
			</div>
		</div>
	);
}

export default function EventRevenueSnapshot({
	data,
	loading = false,
}: EventRevenueSnapshotProps) {
	if (loading || !data) {
		return (
			<div className="space-y-4">
				<div>
					<div className="h-6 w-40 bg-stroke rounded animate-pulse mb-2" />
					<div className="h-4 w-64 bg-stroke rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="rounded-xl bg-surface border border-stroke p-4"
						>
							<div className="animate-pulse space-y-3">
								<div className="h-8 w-8 bg-stroke rounded-lg" />
								<div className="h-6 w-20 bg-stroke rounded" />
								<div className="h-3 w-16 bg-stroke rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	const { kpis } = data;

	// Show empty state if no revenue
	if (kpis.totalRevenue === 0 && kpis.totalOrders === 0) {
		return (
			<div className="space-y-4">
				<div>
					<h2 className="text-lg font-heading font-semibold text-text">
						Revenue Snapshot
					</h2>
					<p className="text-sm text-text-muted">
						Is attention turning into money?
					</p>
				</div>

				<div className="p-8 rounded-xl border border-dashed border-stroke text-center bg-surface">
					<DollarSign className="w-10 h-10 text-text-muted mx-auto mb-3" />
					<h3 className="text-sm font-medium text-text mb-1">
						No ticket sales yet
					</h3>
					<p className="text-xs text-text-muted mb-4">
						Revenue will appear here once you sell your first ticket.
					</p>
					<div className="flex items-center justify-center gap-3">
						<Link
							href="/events"
							className="px-4 py-2 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
						>
							Create Event
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-heading font-semibold text-text">
					Revenue Snapshot
				</h2>
				<p className="text-sm text-text-muted">
					Is attention turning into money?
				</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<MetricCard
					icon={DollarSign}
					label="Ticket Revenue"
					value={formatCurrency(kpis.totalRevenue)}
					subtitle="Excludes platform fees"
					iconColor="text-green-500"
				/>
				<MetricCard
					icon={Ticket}
					label="Tickets Sold"
					value={kpis.totalTicketsSold.toLocaleString()}
					subtitle="Total tickets"
					iconColor="text-purple-500"
					href="/orders"
				/>
				<MetricCard
					icon={Wallet}
					label="Orders"
					value={kpis.totalOrders}
					subtitle="Total orders"
					iconColor="text-blue-500"
					href="/orders"
				/>
				<MetricCard
					icon={CheckCircle}
					label="Check-in Rate"
					value={`${kpis.checkInRate.toFixed(0)}%`}
					subtitle={`${kpis.totalCheckedIn} checked in`}
					iconColor="text-orange-500"
				/>
			</div>

			<CheckInSummary
				checkIns={kpis.totalCheckedIn}
				ticketsSold={kpis.totalTicketsSold}
				rate={kpis.checkInRate}
			/>
		</div>
	);
}
