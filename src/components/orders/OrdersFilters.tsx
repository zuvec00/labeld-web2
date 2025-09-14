// components/orders/OrdersFilters.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
	OrderFilters,
	OrderStatus,
	FulfillmentAggregateStatus,
} from "@/types/orders";
import { Search, Filter, X } from "lucide-react";

interface OrdersFiltersProps {
	onFiltersChange: (filters: OrderFilters) => void;
	loading?: boolean;
}

export default function OrdersFilters({
	onFiltersChange,
	loading,
}: OrdersFiltersProps) {
	const [filters, setFilters] = useState<OrderFilters>({
		dateRange: "7days",
		statuses: [],
		types: [],
		sources: [],
		fulfillmentStatuses: [],
		search: "",
	});
	const [showAdvanced, setShowAdvanced] = useState(false);

	// Debounced search
	const [searchValue, setSearchValue] = useState("");
	const filtersRef = useRef(filters);

	// Keep ref in sync
	useEffect(() => {
		filtersRef.current = filters;
	}, [filters]);

	useEffect(() => {
		const timer = setTimeout(() => {
			const newFilters = { ...filtersRef.current, search: searchValue };
			setFilters(newFilters);
			onFiltersChange(newFilters);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchValue, onFiltersChange]);

	const handleDateRangeChange = (dateRange: OrderFilters["dateRange"]) => {
		const newFilters = { ...filters, dateRange };
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const handleStatusToggle = (status: OrderStatus) => {
		const newFilters = {
			...filters,
			statuses: filters.statuses.includes(status)
				? filters.statuses.filter((s) => s !== status)
				: [...filters.statuses, status],
		};
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const handleTypeToggle = (type: "ticket" | "merch") => {
		const newFilters = {
			...filters,
			types: filters.types.includes(type)
				? filters.types.filter((t) => t !== type)
				: [...filters.types, type],
		};
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const handleFulfillmentStatusToggle = (
		status: FulfillmentAggregateStatus
	) => {
		const newFilters = {
			...filters,
			fulfillmentStatuses: filters.fulfillmentStatuses.includes(status)
				? filters.fulfillmentStatuses.filter((s) => s !== status)
				: [...filters.fulfillmentStatuses, status],
		};
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const clearFilters = () => {
		const defaultFilters = {
			dateRange: "7days" as const,
			statuses: [],
			types: [],
			sources: [],
			fulfillmentStatuses: [],
			search: "",
		};
		setFilters(defaultFilters);
		setSearchValue("");
		onFiltersChange(defaultFilters);
	};

	const hasActiveFilters =
		filters.statuses.length > 0 ||
		filters.types.length > 0 ||
		filters.fulfillmentStatuses.length > 0 ||
		filters.search.trim() !== "";

	return (
		<div className="bg-surface border border-stroke rounded-lg p-4 space-y-4">
			{/* Main Filter Row */}
			<div className="flex items-center gap-3">
				{/* Search */}
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
					<input
						type="text"
						placeholder="Search orders or email..."
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						className="w-full pl-10 pr-4 py-2 bg-background border border-stroke rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta/20 focus:border-cta"
						disabled={loading}
					/>
				</div>

				{/* Date Range */}
				<select
					value={filters.dateRange}
					onChange={(e) =>
						handleDateRangeChange(e.target.value as OrderFilters["dateRange"])
					}
					className="px-3 py-2 bg-background border border-stroke rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cta/20 focus:border-cta"
					disabled={loading}
				>
					<option value="today">Today</option>
					<option value="7days">7 days</option>
					<option value="30days">30 days</option>
					<option value="custom">Custom</option>
				</select>

				{/* Advanced Filters Toggle */}
				<button
					onClick={() => setShowAdvanced(!showAdvanced)}
					className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
						showAdvanced || hasActiveFilters
							? "bg-cta text-text"
							: "bg-background border border-stroke text-text-muted hover:text-text"
					}`}
					disabled={loading}
				>
					<Filter className="w-4 h-4" />
					Filters
					{hasActiveFilters && (
						<span className="bg-text text-surface text-xs px-1.5 py-0.5 rounded-full">
							{filters.statuses.length +
								filters.types.length +
								filters.fulfillmentStatuses.length +
								(filters.search.trim() ? 1 : 0)}
						</span>
					)}
				</button>

				{/* Clear Filters */}
				{hasActiveFilters && (
					<button
						onClick={clearFilters}
						className="flex items-center gap-1 px-3 py-2 text-sm text-text-muted hover:text-text transition-colors"
						disabled={loading}
					>
						<X className="w-4 h-4" />
						Clear
					</button>
				)}
			</div>

			{/* Advanced Filters */}
			{showAdvanced && (
				<div className="border-t border-stroke pt-4 space-y-3">
					{/* Status Filters */}
					<div>
						<label className="text-xs font-medium text-text-muted mb-2 block">
							Status
						</label>
						<div className="flex flex-wrap gap-2">
							{(
								[
									"paid",
									"pending",
									"refunded",
									"cancelled",
									"failed",
								] as OrderStatus[]
							).map((status) => (
								<button
									key={status}
									onClick={() => handleStatusToggle(status)}
									className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
										filters.statuses.includes(status)
											? "bg-cta text-text"
											: "bg-background border border-stroke text-text-muted hover:text-text"
									}`}
									disabled={loading}
								>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</button>
							))}
						</div>
					</div>

					{/* Type Filters */}
					<div>
						<label className="text-xs font-medium text-text-muted mb-2 block">
							Type
						</label>
						<div className="flex gap-2">
							{(["ticket", "merch"] as const).map((type) => (
								<button
									key={type}
									onClick={() => handleTypeToggle(type)}
									className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
										filters.types.includes(type)
											? "bg-cta text-text"
											: "bg-background border border-stroke text-text-muted hover:text-text"
									}`}
									disabled={loading}
								>
									{type === "ticket" ? "Tickets" : "Merchandise"}
								</button>
							))}
						</div>
					</div>

					{/* Fulfillment Status Filters */}
					<div>
						<label className="text-xs font-medium text-text-muted mb-2 block">
							Fulfillment Status
						</label>
						<div className="flex gap-2">
							{(["fulfilled", "unfulfilled", "partial"] as const).map(
								(status) => (
									<button
										key={status}
										onClick={() => handleFulfillmentStatusToggle(status)}
										className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
											filters.fulfillmentStatuses.includes(status)
												? "bg-cta text-text"
												: "bg-background border border-stroke text-text-muted hover:text-text"
										}`}
										disabled={loading}
									>
										{status.charAt(0).toUpperCase() + status.slice(1)}
									</button>
								)
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
