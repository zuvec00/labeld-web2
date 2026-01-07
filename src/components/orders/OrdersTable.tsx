// components/orders/OrdersTable.tsx
"use client";

import { useState, useMemo } from "react";
import {
	OrderWithVendorStatus,
	FulfillmentAggregateStatus,
} from "@/types/orders";
import {
	getOrderItemsSummary,
	getLineFulfillmentStatus,
} from "@/lib/orders/helpers";
import StatusBadge from "./StatusBadge";
import FulfillmentStatusBadge from "./FulfillmentStatusBadge";
import Money from "./Money";
import DateDisplay from "./Date";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthContext";
import {
	formatDistance,
	format,
	differenceInDays,
	differenceInHours,
} from "date-fns";
import { toMillis } from "@/lib/firebase/utils";
import { cn } from "@/lib/utils";

interface OrdersTableProps {
	orders: OrderWithVendorStatus[];
	loading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	onOrderClick: (order: OrderWithVendorStatus) => void;
	showFees?: boolean;
}

export default function OrdersTable({
	orders,
	loading,
	hasMore,
	onLoadMore,
	onOrderClick,
	showFees = false,
}: OrdersTableProps) {
	const { user } = useAuth();
	const [sortField, setSortField] = useState<
		"createdAt" | "amount" | "eventDate"
	>("createdAt");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	// Check if current user is organizer (has event access)
	const isOrganizer = orders.some(
		(order) =>
			order.visibilityReason === "organizer" ||
			order.visibilityReason === "both"
	);

	// Sort orders
	const sortedOrders = useMemo(() => {
		return [...orders].sort((a, b) => {
			let aValue: number, bValue: number;

			if (sortField === "createdAt") {
				aValue = toMillis(a.createdAt) || 0;
				bValue = toMillis(b.createdAt) || 0;
			} else if (sortField === "eventDate") {
				aValue = toMillis(a.eventDate) || 0;
				bValue = toMillis(b.eventDate) || 0;
			} else {
				aValue = a.amount.totalMinor;
				bValue = b.amount.totalMinor;
			}

			if (sortDirection === "asc") {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
	}, [orders, sortField, sortDirection]);

	const handleSort = (field: "createdAt" | "amount" | "eventDate") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("desc"); // Default to desc (newest/highest first)
		}
	};

	const SortButton = ({
		field,
		children,
	}: {
		field: "createdAt" | "amount" | "eventDate";
		children: React.ReactNode;
	}) => (
		<button
			onClick={() => handleSort(field)}
			className="flex items-center gap-1 text-left hover:text-cta transition-colors"
		>
			{children}
			{sortField === field &&
				(sortDirection === "asc" ? (
					<ChevronUp className="w-4 h-4" />
				) : (
					<ChevronDown className="w-4 h-4" />
				))}
		</button>
	);

	const getTimelineIndicator = (eventDate: Date | null) => {
		if (!eventDate) return null;
		const now = new Date();
		const diffHours = differenceInHours(eventDate, now);
		const diffDays = differenceInDays(eventDate, now);

		// Alert: < 48 hours
		if (diffHours >= 0 && diffHours < 48) {
			return {
				label: diffHours < 24 ? "Today" : "Tomorrow",
				color: "text-alert",
				dotColor: "bg-alert",
				borderClass: "border-l-4 border-l-alert",
			};
		}
		// Warm: < 7 days
		if (diffDays >= 2 && diffDays < 7) {
			return {
				label: `In ${diffDays} days`,
				color: "text-cta", // or a warm orange if defined, reusing cta/blue for now or hardcode orange
				dotColor: "bg-cta",
				borderClass: "border-l-4 border-l-cta",
			};
		}

		return null;
	};

	// Loading skeleton
	if (loading && orders.length === 0) {
		return (
			<div className="bg-surface border border-stroke rounded-lg overflow-hidden">
				<div className="p-6">
					<div className="animate-pulse space-y-4">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="flex items-center space-x-4">
								<div className="h-4 bg-stroke rounded w-24"></div>
								<div className="h-4 bg-stroke rounded w-32"></div>
								<div className="h-4 bg-stroke rounded w-40"></div>
								<div className="h-4 bg-stroke rounded w-20"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Empty state
	if (!loading && orders.length === 0) {
		return (
			<div className="bg-surface border border-stroke rounded-lg">
				<div className="text-center py-12">
					<div className="w-16 h-16 bg-stroke rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-text-muted"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium text-text mb-2">
						No Updates Found
					</h3>
					<p className="text-text-muted/70">No orders match your criteria.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-surface border border-stroke rounded-lg overflow-hidden">
			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-bg border-b border-stroke">
						<tr>
							<th className="px-4 py-3 text-left w-4"></th>{" "}
							{/* Indicator Column */}
							<th className="px-4 py-3 text-left">
								<SortButton field="createdAt">Placed</SortButton>
							</th>
							<th className="px-4 py-3 text-left">
								<SortButton field="eventDate">Event Date</SortButton>
							</th>
							<th className="px-4 py-3 text-left">Order / Buyer</th>
							<th className="px-4 py-3 text-left">Details</th>
							<th className="px-4 py-3 text-left">Status</th>
							<th className="px-4 py-3 text-left">
								<SortButton field="amount">Total</SortButton>
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedOrders.map((order) => {
							const eventDate = order.eventDate
								? order.eventDate.toDate()
								: null;
							const indicator = getTimelineIndicator(eventDate);
							const ticketCount = order.lineItems.reduce(
								(acc, item) =>
									item._type === "ticket" ? acc + item.quantity : acc,
								0
							);

							return (
								<tr
									key={order.id}
									onClick={() => onOrderClick(order)}
									className={cn(
										"border-b border-stroke hover:bg-bg/50 cursor-pointer transition-colors group",
										indicator ? "bg-bg/10" : ""
									)}
								>
									<td className={cn("p-0 w-1", indicator?.borderClass)}></td>

									{/* Placed */}
									<td className="px-4 py-3">
										<div className="text-sm text-text">
											<DateDisplay timestamp={order.createdAt} />
										</div>
									</td>

									{/* Event Date */}
									<td className="px-4 py-3">
										{eventDate ? (
											<div className="flex flex-col">
												<span className="text-sm font-medium text-text">
													{format(eventDate, "MMM d, yyyy")}
												</span>
												{indicator && (
													<span
														className={cn(
															"text-xs font-semibold",
															indicator.color
														)}
													>
														{indicator.label}
													</span>
												)}
												{!indicator && (
													<span className="text-xs text-text-muted">
														{format(eventDate, "h:mm a")}
													</span>
												)}
											</div>
										) : (
											<span className="text-text-muted text-sm">—</span>
										)}
									</td>

									{/* Order / Buyer */}
									<td className="px-4 py-3">
										<div className="flex flex-col">
											<span className="font-mono text-xs text-cta hover:underline mb-0.5">
												{order.id.slice(0, 8)}...
											</span>
											<span className="text-sm text-text font-medium">
												{order.deliverTo?.fullName ||
													order.deliverTo?.email ||
													"Guest"}
											</span>
										</div>
									</td>

									{/* Details (Tickets / Items) */}
									<td className="px-4 py-3">
										{ticketCount > 0 && (
											<div className="inline-flex items-center gap-1.5 bg-surface-hover/50 px-2 py-1 rounded-md mb-1">
												<span className="text-xs">🎟️</span>
												<span className="text-sm font-medium">
													{ticketCount} Ticket{ticketCount !== 1 ? "s" : ""}
												</span>
											</div>
										)}
										<div className="text-xs text-text-muted truncate max-w-[200px]">
											{order.eventTitle}
										</div>
									</td>

									{/* Payment Status */}
									<td className="px-4 py-3">
										<StatusBadge status={order.status} />
									</td>

									{/* Total */}
									<td className="px-4 py-3">
										<Money amountMinor={order.amount.totalMinor} />
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Load More */}
			{hasMore && (
				<div className="border-t border-stroke p-4">
					<button
						onClick={onLoadMore}
						disabled={loading}
						className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-cta hover:bg-cta/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Loading...
							</>
						) : (
							"Load More Orders"
						)}
					</button>
				</div>
			)}
		</div>
	);
}
