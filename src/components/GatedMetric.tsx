// components/GatedMetric.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { Lock } from "lucide-react";

interface GatedMetricProps {
	feature: "events" | "orders" | "wallet" | "sales";
	title: string;
	value?: string | number;
	subtitle?: string;
	lockedNote?: string;
	className?: string;
	icon?: React.ReactNode;
	delta?: {
		value: number;
		period: string;
	};
}

export default function GatedMetric({
	feature,
	title,
	value,
	subtitle,
	lockedNote = "Dropping soon",
	className = "",
	icon,
	delta,
}: GatedMetricProps) {
	const enabled = isFeatureEnabled(feature);

	if (enabled) {
		// Show real metric when feature is enabled
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 hover:border-cta/20 transition-colors ${className}`}
			>
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-medium text-text-muted">{title}</h3>
					{icon && <div className="text-text-muted">{icon}</div>}
				</div>

				<div className="text-2xl font-heading font-semibold text-text mb-1">
					{typeof value === "number"
						? value >= 100
							? `₦${(value / 100).toLocaleString("en-NG")}`
							: value.toLocaleString("en-NG")
						: value ?? 0}
				</div>

				<div className="flex items-center justify-between">
					{subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
					{delta && (
						<div className="flex items-center gap-1 text-xs">
							<span
								className={
									delta.value > 0
										? "text-green-600"
										: delta.value < 0
										? "text-red-600"
										: "text-text-muted"
								}
							>
								{delta.value > 0 ? "+" : ""}
								{delta.value}%
							</span>
							<span className="text-text-muted">{delta.period}</span>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Show locked state when feature is disabled
	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 opacity-70 cursor-not-allowed relative ${className}`}
			title="Unlocking later this season"
		>
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-medium text-text-muted">{title}</h3>
				<div className="flex items-center gap-2">
					{icon && <div className="text-text-muted opacity-50">{icon}</div>}
					<Lock className="w-4 h-4 text-text-muted opacity-70" />
				</div>
			</div>

			<div className="text-2xl font-heading font-semibold text-text-muted mb-1">
				—
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs text-text-muted">{lockedNote}</p>
				<div className="flex items-center gap-1">
					<div className="w-2 h-2 bg-edit rounded-full animate-pulse"></div>
					<span className="text-xs text-edit">Dropping soon</span>
				</div>
			</div>
		</div>
	);
}
