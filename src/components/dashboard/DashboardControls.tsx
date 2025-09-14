// components/dashboard/DashboardControls.tsx
"use client";

import { useState } from "react";
import { Calendar, Filter, ChevronDown } from "lucide-react";
import {
	DashboardFilters,
	DashboardRange,
	DashboardScope,
} from "@/hooks/useDashboard";

interface DashboardControlsProps {
	filters: DashboardFilters;
	onFiltersChange: (filters: DashboardFilters) => void;
	events?: Array<{ id: string; title: string }>;
	loading?: boolean;
}

export default function DashboardControls({
	filters,
	onFiltersChange,
	events = [],
	loading = false,
}: DashboardControlsProps) {
	const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

	const handleRangeChange = (range: DashboardRange) => {
		onFiltersChange({
			...filters,
			range,
			customDateRange: range === "custom" ? filters.customDateRange : undefined,
		});

		if (range === "custom") {
			setShowCustomDatePicker(true);
		} else {
			setShowCustomDatePicker(false);
		}
	};

	const handleScopeChange = (scope: DashboardScope) => {
		onFiltersChange({
			...filters,
			scope,
			eventId: scope === "all" ? undefined : filters.eventId,
		});
	};

	const handleEventChange = (eventId: string) => {
		onFiltersChange({
			...filters,
			eventId: eventId === "all" ? undefined : eventId,
		});
	};

	const handleCustomDateChange = (start: Date, end: Date) => {
		onFiltersChange({
			...filters,
			customDateRange: { start, end },
		});
	};

	const getRangeLabel = () => {
		switch (filters.range) {
			case "today":
				return "Today";
			case "7days":
				return "7 days";
			case "30days":
				return "30 days";
			case "custom":
				return filters.customDateRange
					? `${filters.customDateRange.start.toLocaleDateString()} - ${filters.customDateRange.end.toLocaleDateString()}`
					: "Custom";
			default:
				return "7 days";
		}
	};

	const getScopeLabel = () => {
		switch (filters.scope) {
			case "all":
				return "All";
			case "events":
				return "Events";
			case "merch":
				return "Merch";
			default:
				return "All";
		}
	};

	return (
		<div className="bg-surface border border-stroke rounded-lg p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Calendar className="w-4 h-4 text-text-muted" />
					<span className="text-sm font-medium text-text">
						Dashboard Controls
					</span>
				</div>
				<div className="text-xs text-text-muted">
					{getRangeLabel()} • {getScopeLabel()}
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				{/* Date Range Selector */}
				<div className="flex items-center gap-2">
					<label className="text-xs font-medium text-text-muted">Range:</label>
					<div className="flex items-center gap-1">
						{(["today", "7days", "30days", "custom"] as const).map((range) => (
							<button
								key={range}
								onClick={() => handleRangeChange(range)}
								disabled={loading}
								className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
									filters.range === range
										? "bg-cta text-text"
										: "bg-background border border-stroke text-text-muted hover:text-text hover:border-stroke/70"
								}`}
							>
								{range === "custom"
									? "Custom"
									: range === "7days"
									? "7d"
									: range === "30days"
									? "30d"
									: "Today"}
							</button>
						))}
					</div>
				</div>

				{/* Scope Selector */}
				<div className="flex items-center gap-2">
					<label className="text-xs font-medium text-text-muted">Scope:</label>
					<div className="flex items-center gap-1">
						{(["all", "events", "merch"] as const).map((scope) => (
							<button
								key={scope}
								onClick={() => handleScopeChange(scope)}
								disabled={loading}
								className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
									filters.scope === scope
										? "bg-cta text-text"
										: "bg-background border border-stroke text-text-muted hover:text-text hover:border-stroke/70"
								}`}
							>
								{scope === "all"
									? "All"
									: scope === "events"
									? "Events"
									: "Merch"}
							</button>
						))}
					</div>
				</div>

				{/* Event Filter (when scope is events or all) */}
				{(filters.scope === "events" || filters.scope === "all") &&
					events.length > 0 && (
						<div className="flex items-center gap-2">
							<label className="text-xs font-medium text-text-muted">
								Event:
							</label>
							<div className="relative">
								<select
									value={filters.eventId || "all"}
									onChange={(e) => handleEventChange(e.target.value)}
									disabled={loading}
									className="px-3 py-1.5 text-xs bg-background border border-stroke rounded-full text-text focus:outline-none focus:ring-2 focus:ring-cta/20 focus:border-cta appearance-none pr-8"
								>
									<option value="all">All Events</option>
									{events.map((event) => (
										<option key={event.id} value={event.id}>
											{event.title}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
							</div>
						</div>
					)}
			</div>

			{/* Custom Date Picker */}
			{showCustomDatePicker && (
				<div className="pt-3 border-t border-stroke/50">
					<div className="flex items-center gap-3">
						<label className="text-xs font-medium text-text-muted">
							Custom Range:
						</label>
						<div className="flex items-center gap-2">
							<input
								type="date"
								value={
									filters.customDateRange?.start.toISOString().split("T")[0] ||
									""
								}
								onChange={(e) => {
									const start = new Date(e.target.value);
									const end = filters.customDateRange?.end || new Date();
									if (start <= end) {
										handleCustomDateChange(start, end);
									}
								}}
								className="px-2 py-1 text-xs bg-background border border-stroke rounded text-text focus:outline-none focus:ring-1 focus:ring-cta/20"
							/>
							<span className="text-xs text-text-muted">to</span>
							<input
								type="date"
								value={
									filters.customDateRange?.end.toISOString().split("T")[0] || ""
								}
								onChange={(e) => {
									const end = new Date(e.target.value);
									const start = filters.customDateRange?.start || new Date();
									if (start <= end) {
										handleCustomDateChange(start, end);
									}
								}}
								className="px-2 py-1 text-xs bg-background border border-stroke rounded text-text focus:outline-none focus:ring-1 focus:ring-cta/20"
							/>
						</div>
						<button
							onClick={() => setShowCustomDatePicker(false)}
							className="text-xs text-text-muted hover:text-text transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
