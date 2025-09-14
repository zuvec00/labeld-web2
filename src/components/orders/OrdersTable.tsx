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
import Date from "./Date";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthContext";

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
	const { user } = useAuth();
	const [sortField, setSortField] = useState<"createdAt" | "amount">(
		"createdAt"
	);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	// Calculate fulfillment status and counts for current vendor
	const getVendorFulfillmentInfo = (order: OrderWithVendorStatus) => {
		if (!user || !order.fulfillmentLines) return null;

		const vendorLines = Object.values(order.fulfillmentLines).filter(
			(line) => line.vendorId === user.uid && line.lineKey.startsWith("merch:")
		);

		if (vendorLines.length === 0) return null;

		console.log("🔍 OrdersTable: getVendorFulfillmentInfo", {
			orderId: order.id,
			vendorLines: vendorLines.map((line) => ({
				lineKey: line.lineKey,
				status: line.shipping?.status,
				vendorId: line.vendorId,
				shipping: line.shipping,
			})),
		});

		const statuses = vendorLines.map(
			(line) => line.shipping?.status || "unfulfilled"
		);

		console.log("🔍 OrdersTable: Statuses extracted", {
			orderId: order.id,
			statuses,
			user: user.uid,
		});

		const counts = {
			unfulfilled: statuses.filter((s) => s === "unfulfilled").length,
			shipped: statuses.filter((s) => s === "shipped").length,
			delivered: statuses.filter((s) => s === "delivered").length,
			fulfilled: statuses.filter((s) => s === "fulfilled").length,
			total: vendorLines.length,
		};

		// Determine overall status
		let overallStatus: string;
		if (counts.unfulfilled === counts.total) overallStatus = "unfulfilled";
		else if (counts.fulfilled + counts.delivered === counts.total)
			overallStatus = "fulfilled";
		else if (counts.shipped > 0) overallStatus = "shipped";
		else overallStatus = "partial";

		return { status: overallStatus, counts };
	};

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
							<th className="px-4 py-3 text-left">Order</th>
							<th className="px-4 py-3 text-left">Buyer</th>
							<th className="px-4 py-3 text-left">Items</th>
							<th className="px-4 py-3 text-left">Payment</th>
							{/* Only show Fulfillment column if any order has merch */}
							{orders.some((order) =>
								order.lineItems.some((item) => item._type === "merch")
							) && <th className="px-4 py-3 text-left">Fulfillment</th>}
							{/* Only show My Fulfillment for vendors (not organizers) */}
							{!isOrganizer && (
								<th className="px-4 py-3 text-left">My Fulfillment</th>
							)}
							<th className="px-4 py-3 text-left">
								<SortButton field="amount">Total</SortButton>
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedOrders.map((order) => {
							const hasMerch = order.lineItems.some(
								(item) => item._type === "merch"
							);
							const isOrganizerView =
								order.visibilityReason === "organizer" ||
								order.visibilityReason === "both";

							// Calculate fulfillment status from actual fulfillment lines data
							let fulfillmentStatus: FulfillmentAggregateStatus = "fulfilled"; // default for orders without merch
							if (hasMerch && order.fulfillmentLines) {
								const fulfillmentLines = Object.values(order.fulfillmentLines);
								if (fulfillmentLines.length > 0) {
									console.log(
										"🔍 OrdersTable: Overall fulfillment calculation",
										{
											orderId: order.id,
											fulfillmentLines: fulfillmentLines.map((line) => ({
												lineKey: line.lineKey,
												status: line.shipping?.status,
												vendorId: line.vendorId,
												shipping: line.shipping,
											})),
										}
									);

									const statuses = fulfillmentLines.map(
										getLineFulfillmentStatus
									);

									console.log("🔍 OrdersTable: Overall statuses extracted", {
										orderId: order.id,
										statuses,
										fulfillmentLines: fulfillmentLines.map((line) => ({
											lineKey: line.lineKey,
											status: line.shipping?.status,
											hasShipping: !!line.shipping,
										})),
									});

									const unfulfilledCount = statuses.filter(
										(s) => s === "unfulfilled"
									).length;
									const fulfilledCount = statuses.filter((s) =>
										["fulfilled", "delivered"].includes(s)
									).length;
									const shippedCount = statuses.filter(
										(s) => s === "shipped"
									).length;

									if (unfulfilledCount === statuses.length) {
										fulfillmentStatus = "unfulfilled";
									} else if (fulfilledCount === statuses.length) {
										fulfillmentStatus = "fulfilled";
									} else if (shippedCount > 0) {
										fulfillmentStatus = "shipped";
									} else {
										fulfillmentStatus = "partial";
									}
								}
							}

							return (
								<tr
									key={order.id}
									onClick={() => onOrderClick(order)}
									className="border-b border-stroke hover:bg-background/50 cursor-pointer transition-colors"
								>
									{/* Placed */}
									<td className="px-4 py-3">
										<Date timestamp={order.createdAt} />
									</td>

									{/* Order ID (clickable) */}
									<td className="px-4 py-3">
										<span className="font-mono text-sm text-cta hover:underline">
											{order.id.slice(0, 8)}...
										</span>
									</td>

									{/* Buyer */}
									<td className="px-4 py-3">
										<span className="text-sm">
											{order.deliverTo?.email || "—"}
										</span>
									</td>

									{/* Items with type badges */}
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<span className="text-sm">
												{getOrderItemsSummary(order.lineItems)}
											</span>
											<div className="flex gap-1">
												{order.lineItems.some(
													(item) => item._type === "ticket"
												) && (
													<span className="text-xs" title="Tickets">
														🎟️
													</span>
												)}
												{order.lineItems.some(
													(item) => item._type === "merch"
												) && (
													<span className="text-xs" title="Merchandise">
														📦
													</span>
												)}
											</div>
										</div>
									</td>

									{/* Payment Status */}
									<td className="px-4 py-3">
										<StatusBadge status={order.status} />
									</td>

									{/* Fulfillment (only if order has merch) */}
									{hasMerch && (
										<td className="px-4 py-3">
											{(() => {
												if (!order.fulfillmentLines) {
													return (
														<FulfillmentStatusBadge
															status={fulfillmentStatus}
															type="aggregate"
														/>
													);
												}

												const fulfillmentLines = Object.values(
													order.fulfillmentLines
												);
												const statuses = fulfillmentLines.map(
													getLineFulfillmentStatus
												);

												// const counts = {
												// 	unfulfilled: statuses.filter(
												// 		(s) => s === "unfulfilled"
												// 	).length,
												// 	shipped: statuses.filter((s) => s === "shipped")
												// 		.length,
												// 	delivered: statuses.filter((s) => s === "delivered")
												// 		.length,
												// 	fulfilled: statuses.filter((s) => s === "fulfilled")
												// 		.length,
												// 	total: statuses.length,
												// };

												// Create count summary for overall fulfillment
												// const countParts = [];
												// if (counts.unfulfilled > 0)
												// 	countParts.push(`${counts.unfulfilled} pending`);
												// if (counts.shipped > 0)
												// 	countParts.push(`${counts.shipped} shipped`);
												// if (counts.delivered > 0)
												// 	countParts.push(`${counts.delivered} delivered`);
												// if (counts.fulfilled > 0)
												// 	countParts.push(`${counts.fulfilled} fulfilled`);

												// const countSummary =
												// 	countParts.length > 0
												// 		? ` (${countParts.join(", ")})`
												// 		: "";

												return (
													<div className="flex flex-col gap-1">
														<FulfillmentStatusBadge
															status={fulfillmentStatus}
															type="aggregate"
														/>
														{/* {countSummary && (
															<span className="text-xs text-text-muted">
																{countSummary}
															</span>
														)} */}
													</div>
												);
											})()}
										</td>
									)}

									{/* My Fulfillment (only for vendors, not organizers) */}
									{!isOrganizerView && (
										<td className="px-4 py-3">
											{(() => {
												const fulfillmentInfo = getVendorFulfillmentInfo(order);
												if (!fulfillmentInfo) return null;

												const { status, counts } = fulfillmentInfo;

												const getBadgeColor = (status: string) => {
													switch (status) {
														case "unfulfilled":
															return "bg-yellow-100 text-yellow-800";
														case "partial":
															return "bg-orange-100 text-orange-800";
														case "shipped":
															return "bg-blue-100 text-blue-800";
														case "delivered":
															return "bg-green-100 text-green-800";
														case "fulfilled":
															return "bg-green-100 text-green-800";
														default:
															return "bg-gray-100 text-gray-800";
													}
												};

												const getBadgeLabel = (status: string) => {
													switch (status) {
														case "unfulfilled":
															return "Unfulfilled";
														case "partial":
															return "Partial";
														case "shipped":
															return "Shipped";
														case "delivered":
															return "Delivered";
														case "fulfilled":
															return "Fulfilled";
														default:
															return status;
													}
												};

												// Create count summary
												const countParts = [];
												if (counts.unfulfilled > 0)
													countParts.push(`${counts.unfulfilled} pending`);
												if (counts.shipped > 0)
													countParts.push(`${counts.shipped} shipped`);
												if (counts.delivered > 0)
													countParts.push(`${counts.delivered} delivered`);
												if (counts.fulfilled > 0)
													countParts.push(`${counts.fulfilled} fulfilled`);

												const countSummary =
													countParts.length > 0
														? ` (${countParts.join(", ")})`
														: "";

												return (
													<div className="flex flex-col gap-1">
														<span
															className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(
																status
															)}`}
														>
															{getBadgeLabel(status)}
														</span>
														{/* {countSummary && (
															<span className="text-xs text-text-muted">
																{countSummary}
															</span>
														)} */}
													</div>
												);
											})()}
										</td>
									)}

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
