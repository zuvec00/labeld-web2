// components/dashboard/BrandSpaceControls.tsx
"use client";

import React from "react";
import { Calendar, Filter } from "lucide-react";
import { BrandSpaceFilters, BrandSpaceRange } from "@/hooks/useBrandSpace";

interface BrandSpaceControlsProps {
	filters: BrandSpaceFilters;
	onFiltersChange: (filters: BrandSpaceFilters) => void;
	loading?: boolean;
}

export default function BrandSpaceControls({
	filters,
	onFiltersChange,
	loading = false,
}: BrandSpaceControlsProps) {
	const ranges: { key: BrandSpaceRange; label: string }[] = [
		{ key: "today", label: "Today" },
		{ key: "7days", label: "7 days" },
		{ key: "30days", label: "30 days" },
		{ key: "custom", label: "Custom" },
	];

	const handleRangeChange = (range: BrandSpaceRange) => {
		onFiltersChange({
			...filters,
			range,
			// Clear custom date range when switching to non-custom range
			customDateRange: range === "custom" ? filters.customDateRange : undefined,
		});
	};

	const handleCustomDateChange = (start: Date, end: Date) => {
		onFiltersChange({
			...filters,
			range: "custom",
			customDateRange: { start, end },
		});
	};

	const formatDateRange = () => {
		if (filters.range === "custom" && filters.customDateRange) {
			const { start, end } = filters.customDateRange;
			return `${start.toLocaleDateString("en-NG", {
				month: "short",
				day: "numeric",
			})} - ${end.toLocaleDateString("en-NG", {
				month: "short",
				day: "numeric",
			})}`;
		}
		return null;
	};

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-4">
				{/* Range Selector */}
				<div className="flex items-center gap-2">
					<Calendar className="w-4 h-4 text-text-muted" />
					<div className="flex items-center gap-1">
						{ranges.map((range) => (
							<button
								key={range.key}
								onClick={() => handleRangeChange(range.key)}
								disabled={loading}
								className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
									filters.range === range.key
										? "bg-cta text-text font-medium"
										: "text-text-muted hover:text-text hover:bg-surface/50"
								} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								{range.label}
							</button>
						))}
					</div>
				</div>

				{/* Custom Date Range Display */}
				{filters.range === "custom" && filters.customDateRange && (
					<div className="text-sm text-text-muted">{formatDateRange()}</div>
				)}
			</div>

			{/* BrandSpace Focus Indicator */}
			<div className="flex items-center gap-2">
				<Filter className="w-4 h-4 text-text-muted" />
				<span className="text-sm text-text-muted">BrandSpace analytics</span>
				<span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
					Live
				</span>
			</div>
		</div>
	);
}
