// components/dashboard/KpiCard.tsx
"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatNaira } from "@/lib/orders/helpers";

interface KpiCardProps {
	label: string;
	value: string | number;
	sub?: string;
	delta?: {
		value: number;
		period: string;
	};
	icon?: ReactNode;
	loading?: boolean;
	className?: string;
}

export default function KpiCard({
	label,
	value,
	sub,
	delta,
	icon,
	loading = false,
	className = "",
}: KpiCardProps) {
	const formatValue = (val: string | number): string => {
		if (typeof val === "number") {
			// If it looks like a currency value (large numbers), format as currency
			if (val >= 100) {
				return formatNaira(val);
			}
			// Otherwise format as regular number
			return new Intl.NumberFormat("en-NG").format(val);
		}
		return val;
	};

	const getDeltaIcon = () => {
		if (!delta) return null;

		if (delta.value > 0) {
			return <TrendingUp className="w-3 h-3 text-green-600" />;
		} else if (delta.value < 0) {
			return <TrendingDown className="w-3 h-3 text-red-600" />;
		} else {
			return <Minus className="w-3 h-3 text-text-muted" />;
		}
	};

	const getDeltaColor = () => {
		if (!delta) return "text-text-muted";

		if (delta.value > 0) {
			return "text-green-600";
		} else if (delta.value < 0) {
			return "text-red-600";
		} else {
			return "text-text-muted";
		}
	};

	const formatDelta = (deltaValue: number): string => {
		const abs = Math.abs(deltaValue);
		if (abs >= 100) {
			return formatNaira(abs);
		}
		return `${abs}%`;
	};

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="flex items-center justify-between mb-2">
						<div className="h-3 bg-stroke rounded w-20"></div>
						{icon && <div className="w-5 h-5 bg-stroke rounded"></div>}
					</div>
					<div className="h-8 bg-stroke rounded w-24 mb-2"></div>
					<div className="h-3 bg-stroke rounded w-16"></div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 hover:border-cta/20 transition-colors ${className}`}
		>
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-medium text-text-muted">{label}</h3>
				{icon && <div className="text-text-muted">{icon}</div>}
			</div>

			<div className="text-2xl font-heading font-semibold text-text mb-1">
				{formatValue(value)}
			</div>

			<div className="flex items-center justify-between">
				{sub && <p className="text-xs text-text-muted">{sub}</p>}

				{delta && (
					<div className={`flex items-center gap-1 text-xs ${getDeltaColor()}`}>
						{getDeltaIcon()}
						<span>
							{delta.value > 0 ? "+" : delta.value < 0 ? "-" : ""}
							{formatDelta(delta.value)}
						</span>
						<span className="text-text-muted">{delta.period}</span>
					</div>
				)}
			</div>
		</div>
	);
}

// Specialized KPI cards for common metrics
export function GmvCard({
	value,
	delta,
	loading,
}: {
	value: number;
	delta?: KpiCardProps["delta"];
	loading?: boolean;
}) {
	return (
		<KpiCard
			label="GMV"
			value={value}
			sub="Gross merchandise value"
			delta={delta}
			loading={loading}
		/>
	);
}

export function OrdersCard({
	value,
	delta,
	loading,
}: {
	value: number;
	delta?: KpiCardProps["delta"];
	loading?: boolean;
}) {
	return (
		<KpiCard
			label="Orders"
			value={value}
			sub="Total orders"
			delta={delta}
			loading={loading}
		/>
	);
}

export function AovCard({
	value,
	delta,
	loading,
}: {
	value: number;
	delta?: KpiCardProps["delta"];
	loading?: boolean;
}) {
	return (
		<KpiCard
			label="AOV"
			value={value}
			sub="Average order value"
			delta={delta}
			loading={loading}
		/>
	);
}

export function PayoutCard({
	value,
	nextPayoutAt,
	loading,
}: {
	value: number;
	nextPayoutAt?: number;
	loading?: boolean;
}) {
	const formatNextPayout = (timestamp?: number): string => {
		if (!timestamp) return "No payout scheduled";

		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays <= 0) return "Available now";
		if (diffDays === 1) return "Tomorrow";
		if (diffDays <= 7) return `In ${diffDays} days`;

		return date.toLocaleDateString("en-NG", {
			month: "short",
			day: "numeric",
		});
	};

	return (
		<KpiCard
			label="Payout Eligible"
			value={value}
			sub={`Next payout: ${formatNextPayout(nextPayoutAt)}`}
			loading={loading}
		/>
	);
}

export function FulfillmentCard({
	value,
	loading,
}: {
	value: number;
	loading?: boolean;
}) {
	return (
		<KpiCard
			label="Pending Fulfillment"
			value={value}
			sub="Orders to fulfill"
			loading={loading}
		/>
	);
}

export function FollowersCard({
	value,
	delta,
	loading,
}: {
	value: number;
	delta?: KpiCardProps["delta"];
	loading?: boolean;
}) {
	const subtitle =
		value === 0
			? "Share your BrandSpace link to get followers"
			: "Brand followers";

	return (
		<KpiCard
			label="Followers"
			value={value}
			sub={subtitle}
			delta={delta}
			loading={loading}
		/>
	);
}
