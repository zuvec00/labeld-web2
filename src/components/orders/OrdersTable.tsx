// components/orders/OrdersTable.tsx
"use client";

import { useState, useMemo } from "react";
import { OrderWithVendorStatus } from "@/types/orders";
import {
	getOrderTypeSummary,
	getOrderItemsSummary,
} from "@/lib/orders/helpers";
import StatusBadge from "./StatusBadge";
import Money from "./Money";
import Date from "./Date";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface OrdersTableProps {
	orders: OrderWithVendorStatus[];
	loading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	onOrderClick: (order: OrderWithVendorStatus) => void;
}

export default function OrdersTable({
	orders,
	loading,
	hasMore,
	onLoadMore,
	onOrderClick,
}: OrdersTableProps) {
	const [sortField, setSortField] = useState<"createdAt" | "amount">(
		"createdAt"
	);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	// Sort orders
	const sortedOrders = useMemo(() => {
		return [...orders].sort((a, b) => {
			let aValue: number, bValue: number;

			if (sortField === "createdAt") {
				// Convert to timestamp for comparison
				aValue =
					a.createdAt?.toDate?.()?.getTime() || (a.createdAt as number) || 0;
				bValue =
					b.createdAt?.toDate?.()?.getTime() || (b.createdAt as number) || 0;
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

	const handleSort = (field: "createdAt" | "amount") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("desc");
		}
	};

	const SortButton = ({
		field,
		children,
	}: {
		field: "createdAt" | "amount";
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
								<div className="h-4 bg-stroke rounded w-16"></div>
								<div className="h-4 bg-stroke rounded w-24"></div>
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
						No Orders Found
					</h3>
					<p className="text-text-muted/70">
						No orders match your current filters. Try adjusting your search
						criteria.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-surface border border-stroke rounded-lg overflow-hidden">
			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-background border-b border-stroke">
						<tr>
							<th className="px-4 py-3 text-left">
								<SortButton field="createdAt">Placed</SortButton>
							</th>
							<th className="px-4 py-3 text-left">Order ID</th>
							<th className="px-4 py-3 text-left">Buyer</th>
							<th className="px-4 py-3 text-left">Items</th>
							<th className="px-4 py-3 text-left">Type</th>
							<th className="px-4 py-3 text-left">Status</th>
							<th className="px-4 py-3 text-left">
								<SortButton field="amount">Total</SortButton>
							</th>
							<th className="px-4 py-3 text-left">Provider</th>
						</tr>
					</thead>
					<tbody>
						{sortedOrders.map((order) => (
							<tr
								key={order.id}
								onClick={() => onOrderClick(order)}
								className="border-b border-stroke hover:bg-background/50 cursor-pointer transition-colors"
							>
								<td className="px-4 py-3">
									<Date timestamp={order.createdAt} />
								</td>
								<td className="px-4 py-3">
									<span className="font-mono text-sm text-text-muted">
										{order.id.slice(0, 8)}...
									</span>
								</td>
								<td className="px-4 py-3">
									<span className="text-sm">
										{order.deliverTo?.email || "—"}
									</span>
								</td>
								<td className="px-4 py-3">
									<span className="text-sm">
										{getOrderItemsSummary(order.lineItems)}
									</span>
								</td>
								<td className="px-4 py-3">
									<span className="text-sm text-text-muted">
										{getOrderTypeSummary(order.lineItems)}
									</span>
								</td>
								<td className="px-4 py-3">
									<StatusBadge status={order.status} />
								</td>
								<td className="px-4 py-3">
									<Money amountMinor={order.amount.totalMinor} />
								</td>
								<td className="px-4 py-3">
									<span className="text-sm text-text-muted capitalize">
										{order.provider || "—"}
									</span>
								</td>
							</tr>
						))}
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
