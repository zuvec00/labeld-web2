// components/dashboard/BrandSpaceControls.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, Filter, ChevronDown, X } from "lucide-react";
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
	const [isOpen, setIsOpen] = useState(false);
	const [showCustomPicker, setShowCustomPicker] = useState(false);
	const [customStart, setCustomStart] = useState<string>("");
	const [customEnd, setCustomEnd] = useState<string>("");

	const ranges: { key: BrandSpaceRange; label: string }[] = [
		{ key: "today", label: "Today" },
		{ key: "7days", label: "7 Days" },
		{ key: "30days", label: "30 Days" },
		{ key: "custom", label: "Custom" },
	];

	const activeLabel =
		ranges.find((r) => r.key === filters.range)?.label || "7 Days";

	const handleRangeChange = (range: BrandSpaceRange) => {
		if (range === "custom") {
			setShowCustomPicker(true);
			// Set default custom dates if not already set
			if (!customStart) {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				setCustomStart(thirtyDaysAgo.toISOString().split("T")[0]);
			}
			if (!customEnd) {
				setCustomEnd(new Date().toISOString().split("T")[0]);
			}
		} else {
			setShowCustomPicker(false);
			onFiltersChange({
				...filters,
				range,
				customDateRange: undefined,
			});
		}
		setIsOpen(false);
	};

	const handleApplyCustomRange = () => {
		if (customStart && customEnd) {
			onFiltersChange({
				...filters,
				range: "custom",
				customDateRange: {
					start: new Date(customStart),
					end: new Date(customEnd),
				},
			});
			setShowCustomPicker(false);
		}
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
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					{/* Range Selector */}
					<div className="flex items-center gap-2">
						<Calendar className="w-4 h-4 text-text-muted" />

						{/* Desktop: Button group */}
						<div className="hidden sm:flex items-center gap-1">
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

						{/* Mobile: Dropdown */}
						<div className="relative sm:hidden">
							<button
								onClick={() => setIsOpen(!isOpen)}
								disabled={loading}
								className="flex items-center gap-2 px-3 py-1.5 bg-bg border border-stroke rounded-lg text-sm"
							>
								<span className="font-medium text-text">
									{filters.range === "custom"
										? formatDateRange() || "Custom"
										: activeLabel}
								</span>
								<ChevronDown
									className={`w-4 h-4 text-text-muted transition-transform ${
										isOpen ? "rotate-180" : ""
									}`}
								/>
							</button>

							{isOpen && (
								<>
									<div
										className="fixed inset-0 z-40"
										onClick={() => setIsOpen(false)}
									/>
									<div className="absolute top-full left-0 mt-1 z-50 min-w-[120px] py-1 bg-surface border border-stroke rounded-lg shadow-lg">
										{ranges.map((range) => (
											<button
												key={range.key}
												onClick={() => handleRangeChange(range.key)}
												className={`w-full text-left px-3 py-2 text-sm transition-colors ${
													filters.range === range.key
														? "text-cta font-medium bg-cta/5"
														: "text-text-muted hover:text-text hover:bg-bg"
												}`}
											>
												{range.label}
											</button>
										))}
									</div>
								</>
							)}
						</div>

						{/* Custom Date Range Display */}
						{filters.range === "custom" && filters.customDateRange && (
							<span className="hidden sm:inline text-sm text-text-muted">
								{formatDateRange()}
							</span>
						)}
					</div>
				</div>

				{/* BrandSpace Focus Indicator - hide on mobile */}
				<div className="hidden sm:flex items-center gap-2">
					<Filter className="w-4 h-4 text-text-muted" />
					<span className="text-sm text-text-muted">BrandSpace</span>
					<span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
						Live
					</span>
				</div>
			</div>

			{/* Custom Date Picker */}
			{showCustomPicker && (
				<div className="flex flex-wrap items-center gap-3 p-3 bg-surface border border-stroke rounded-lg">
					<div className="flex items-center gap-2">
						<label className="text-xs text-text-muted">From:</label>
						<input
							type="date"
							value={customStart}
							onChange={(e) => setCustomStart(e.target.value)}
							className="px-2 py-1 text-sm bg-bg border border-stroke rounded-lg text-text"
						/>
					</div>
					<div className="flex items-center gap-2">
						<label className="text-xs text-text-muted">To:</label>
						<input
							type="date"
							value={customEnd}
							onChange={(e) => setCustomEnd(e.target.value)}
							className="px-2 py-1 text-sm bg-bg border border-stroke rounded-lg text-text"
						/>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleApplyCustomRange}
							className="px-3 py-1 text-sm bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors"
						>
							Apply
						</button>
						<button
							onClick={() => {
								setShowCustomPicker(false);
								if (!filters.customDateRange) {
									onFiltersChange({ ...filters, range: "7days" });
								}
							}}
							className="p-1 text-text-muted hover:text-text transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
