// components/dashboard/MoneySnapshot.tsx
"use client";

import React from "react";
import {
	DollarSign,
	ShoppingBag,
	Wallet,
	Package,
	ChevronDown,
	ChevronUp,
	ExternalLink,
	AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface MoneySnapshotProps {
	gmv: number;
	ordersCount: number;
	payoutEligible: number;
	fulfillmentCounts: {
		unfulfilled: number;
		shipped: number;
		delivered: number;
		cancelled: number;
	};
	loading?: boolean;
	hasCommerceData?: boolean;
	hasAnyOrders?: boolean;
}

function formatCurrency(amountMinor: number): string {
	// Convert from minor units (kobo/cents) to major units
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
	iconColor = "text-cta",
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
		<div className="rounded-xl bg-surface border border-stroke p-4 hover:border-cta/30 transition-all hover:shadow-lg group">
			<div className="flex items-start justify-between mb-2">
				<div
					className={`p-2 rounded-lg bg-opacity-10 ${iconColor.replace(
						"text-",
						"bg-",
					)}/10`}
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

function FulfillmentSummary({
	counts,
}: {
	counts: MoneySnapshotProps["fulfillmentCounts"];
}) {
	const total = counts.unfulfilled + counts.shipped + counts.delivered;

	if (total === 0) return null;

	const unfulfilledPercent = (counts.unfulfilled / total) * 100;
	const shippedPercent = (counts.shipped / total) * 100;
	const deliveredPercent = (counts.delivered / total) * 100;

	return (
		<div className="rounded-xl bg-surface border border-stroke p-4">
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-sm font-medium text-text">Fulfillment Status</h4>
				<Link
					href="/orders"
					className="text-xs text-cta hover:text-cta/80 flex items-center gap-1"
				>
					View orders
					<ExternalLink className="w-3 h-3" />
				</Link>
			</div>

			{/* Progress bar */}
			<div className="h-2 rounded-full bg-bg overflow-hidden flex mb-3">
				{deliveredPercent > 0 && (
					<div
						className="bg-green-500 h-full"
						style={{ width: `${deliveredPercent}%` }}
					/>
				)}
				{shippedPercent > 0 && (
					<div
						className="bg-blue-500 h-full"
						style={{ width: `${shippedPercent}%` }}
					/>
				)}
				{unfulfilledPercent > 0 && (
					<div
						className="bg-orange-500 h-full"
						style={{ width: `${unfulfilledPercent}%` }}
					/>
				)}
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-4 text-xs">
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-full bg-green-500" />
					<span className="text-text-muted">
						Delivered ({counts.delivered})
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-full bg-blue-500" />
					<span className="text-text-muted">Shipped ({counts.shipped})</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-full bg-orange-500" />
					<span className="text-text-muted">
						Unfulfilled ({counts.unfulfilled})
					</span>
				</div>
			</div>
		</div>
	);
}

export default function MoneySnapshot({
	gmv,
	ordersCount,
	payoutEligible,
	fulfillmentCounts,
	loading = false,
	hasCommerceData = true,
	hasAnyOrders = true,
}: MoneySnapshotProps) {
	if (loading) {
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

	// Show empty state if no commerce data
	if (!hasAnyOrders) {
		return (
			<div className="space-y-4">
				<div>
					<h2 className="text-lg font-heading font-semibold text-text">
						Sales Snapshot
					</h2>
					<p className="text-sm text-text-muted">
						Is attention turning into sales?
					</p>
				</div>

				<div className="p-8 rounded-xl border border-dashed border-stroke text-center bg-surface">
					<DollarSign className="w-10 h-10 text-text-muted mx-auto mb-3" />
					<h3 className="text-sm font-medium text-text mb-1">No sales yet</h3>
					<p className="text-xs text-text-muted mb-4">
						Revenue will appear here once you make your first sale.
					</p>
					<div className="flex items-center justify-center gap-3">
						<Link
							href="/pieces"
							className="px-4 py-2 text-xs bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors"
						>
							Add Products
						</Link>
						<Link
							href="/events"
							className="px-4 py-2 text-xs bg-bg border border-stroke text-text rounded-lg hover:bg-surface transition-colors"
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
					Sales Snapshot
				</h2>
				<p className="text-sm text-text-muted">
					Is attention turning into sales?
				</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<MetricCard
					icon={DollarSign}
					label="Total Revenue"
					value={formatCurrency(gmv)}
					subtitle="Gross merchandise value"
					iconColor="text-green-500"
				/>
				<MetricCard
					icon={ShoppingBag}
					label="Orders"
					value={ordersCount}
					subtitle="Total orders"
					iconColor="text-blue-500"
					href="/orders"
				/>
				<MetricCard
					icon={Wallet}
					label="Payout Eligible"
					value={formatCurrency(payoutEligible)}
					subtitle="Ready to withdraw"
					iconColor="text-purple-500"
					href="/wallet"
				/>
				<MetricCard
					icon={Package}
					label="Pending Fulfillment"
					value={fulfillmentCounts.unfulfilled}
					subtitle="Orders to fulfill"
					iconColor="text-orange-500"
					href="/orders"
				/>
			</div>

			<FulfillmentSummary counts={fulfillmentCounts} />
		</div>
	);
}
