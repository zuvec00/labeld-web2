"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";

export type PerformanceRange =
	| "7days"
	| "30days"
	| "90days"
	| "12months"
	| "custom";

interface PerformanceTimelineControlsProps {
	value: PerformanceRange;
	onChange: (
		range: PerformanceRange,
		customRange?: { start: Date; end: Date }
	) => void;
	loading?: boolean;
}

const TIMELINE_OPTIONS: { value: PerformanceRange; label: string }[] = [
	{ value: "7days", label: "7 Days" },
	{ value: "30days", label: "30 Days" },
	{ value: "90days", label: "3 Months" },
	{ value: "12months", label: "1 Year" },
	{ value: "custom", label: "Custom" },
];

export function getDateRangeFromPerformanceRange(
	range: PerformanceRange,
	customRange?: { start: Date; end: Date }
): { start: Date; end: Date } {
	if (range === "custom" && customRange) {
		return customRange;
	}

	const end = new Date();
	const start = new Date();

	switch (range) {
		case "7days":
			start.setDate(start.getDate() - 7);
			break;
		case "30days":
			start.setDate(start.getDate() - 30);
			break;
		case "90days":
			start.setDate(start.getDate() - 90);
			break;
		case "12months":
			start.setFullYear(start.getFullYear() - 1);
			break;
	}

	return { start, end };
}

export default function PerformanceTimelineControls({
	value,
	onChange,
	loading = false,
}: PerformanceTimelineControlsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [showCustomPicker, setShowCustomPicker] = useState(false);
	const [customStart, setCustomStart] = useState<string>("");
	const [customEnd, setCustomEnd] = useState<string>("");
	const [appliedCustomRange, setAppliedCustomRange] = useState<{
		start: Date;
		end: Date;
	} | null>(null);

	const activeLabel =
		TIMELINE_OPTIONS.find((o) => o.value === value)?.label || "30 Days";

	const handleRangeChange = (range: PerformanceRange) => {
		if (range === "custom") {
			setShowCustomPicker(true);
			if (!customStart) {
				const defaultStart = new Date();
				defaultStart.setDate(defaultStart.getDate() - 30);
				setCustomStart(defaultStart.toISOString().split("T")[0]);
			}
			if (!customEnd) {
				setCustomEnd(new Date().toISOString().split("T")[0]);
			}
		} else {
			setShowCustomPicker(false);
			setAppliedCustomRange(null);
			onChange(range);
		}
		setIsOpen(false);
	};

	const handleApplyCustomRange = () => {
		if (customStart && customEnd) {
			const range = {
				start: new Date(customStart),
				end: new Date(customEnd),
			};
			setAppliedCustomRange(range);
			onChange("custom", range);
			setShowCustomPicker(false);
		}
	};

	const formatDateRange = () => {
		if (value === "custom" && appliedCustomRange) {
			const { start, end } = appliedCustomRange;
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
			<div className="flex items-center gap-3">
				{/* Desktop: Button group */}
				<div className="hidden sm:flex gap-1 p-1 bg-surface border border-stroke rounded-lg">
					{TIMELINE_OPTIONS.map((option) => (
						<button
							key={option.value}
							onClick={() => handleRangeChange(option.value)}
							disabled={loading}
							className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
								value === option.value
									? "bg-text text-bg shadow-sm"
									: "text-text-muted hover:text-text hover:bg-bg"
							} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							{option.label}
						</button>
					))}
				</div>

				{/* Mobile: Dropdown */}
				<div className="relative sm:hidden">
					<button
						onClick={() => setIsOpen(!isOpen)}
						disabled={loading}
						className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-stroke rounded-lg text-sm"
					>
						<span className="font-medium text-text">
							{value === "custom" ? formatDateRange() || "Custom" : activeLabel}
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
							<div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] py-1 bg-surface border border-stroke rounded-lg shadow-lg">
								{TIMELINE_OPTIONS.map((option) => (
									<button
										key={option.value}
										onClick={() => handleRangeChange(option.value)}
										className={`w-full text-left px-3 py-2 text-sm transition-colors ${
											value === option.value
												? "text-purple-500 font-medium bg-purple-500/5"
												: "text-text-muted hover:text-text hover:bg-bg"
										}`}
									>
										{option.label}
									</button>
								))}
							</div>
						</>
					)}
				</div>

				{/* Custom Date Range Display */}
				{value === "custom" && appliedCustomRange && (
					<span className="hidden sm:inline text-sm text-text-muted border border-stroke px-3 py-1.5 rounded-lg bg-surface">
						{formatDateRange()}
					</span>
				)}
			</div>

			{/* Custom Date Picker */}
			{showCustomPicker && (
				<div className="flex flex-wrap items-center gap-3 p-3 bg-surface border border-stroke rounded-lg w-fit">
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
							className="px-3 py-1 text-sm bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
						>
							Apply
						</button>
						<button
							onClick={() => {
								setShowCustomPicker(false);
								if (!appliedCustomRange) {
									onChange("30days");
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
