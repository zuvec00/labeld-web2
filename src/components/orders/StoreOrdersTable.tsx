// components/orders/StoreOrdersTable.tsx
"use client";

import { useState } from "react";
import {
	StoreOrderWithVendorStatus,
	FulfillmentAggregateStatus,
} from "@/types/orders";
import { formatCurrency } from "@/lib/wallet/mock";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Card from "@/components/dashboard/Card";
import { toMillis } from "@/lib/firebase/utils";
import { cn } from "@/lib/utils";

interface StoreOrdersTableProps {
	orders: StoreOrderWithVendorStatus[];
	loading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	onOrderClick: (order: StoreOrderWithVendorStatus) => void;
}

export default function StoreOrdersTable({
	orders,
	loading,
	hasMore,
	onLoadMore,
	onOrderClick,
}: StoreOrdersTableProps) {
	const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-accent/10 text-accent border border-accent/20";
			case "pending":
				return "bg-edit/10 text-edit border border-edit/20"; // Changed text to Awaiting Payment in render
			case "failed":
				return "bg-alert/10 text-alert border border-alert/20";
			case "refunded":
				return "bg-surface text-text-muted border border-stroke";
			case "cancelled":
				return "bg-surface text-text-muted border border-stroke";
			default:
				return "bg-surface text-text-muted border border-stroke";
		}
	};

	const getFulfillmentColor = (status: FulfillmentAggregateStatus) => {
		switch (status) {
			case "delivered":
				return "text-accent";
			case "shipped":
				return "text-cta";
			case "fulfilled":
				return "text-accent";
			case "partial":
				return "text-edit";
			case "unfulfilled":
				return "text-alert";
			default:
				return "text-text-muted";
		}
	};

	const getFulfillmentLabel = (status: FulfillmentAggregateStatus) => {
		switch (status) {
			case "delivered":
				return "Delivered";
			case "shipped":
				return "Shipped";
			case "fulfilled":
				return "Ready";
			case "partial":
				return "Partial";
			case "unfulfilled":
				return "Pending";
			default:
				return "Unknown";
		}
	};

	const formatOrderId = (id: string) => {
		return `ST-${id.slice(-6)}`;
	};

	const sortedOrders = [...orders].sort((a, b) => {
		let aValue: any, bValue: any;

		switch (sortBy) {
			case "date":
				aValue = toMillis(a.createdAt);
				bValue = toMillis(b.createdAt);
				break;
			case "amount":
				aValue = a.amount.itemsSubtotalMinor;
				bValue = b.amount.itemsSubtotalMinor;
				break;
			case "status":
				aValue = a.status;
				bValue = b.status;
				break;
			default:
				return 0;
		}

		if (sortOrder === "asc") {
			return aValue > bValue ? 1 : -1;
		} else {
			return aValue < bValue ? 1 : -1;
		}
	});

	if (loading && orders.length === 0) {
		return (
			<Card>
				<div className="p-8 text-center">
					<div className="w-8 h-8 border-2 border-cta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-text-muted">Loading store orders...</p>
				</div>
			</Card>
		);
	}

	if (orders.length === 0) {
		return (
			<Card>
				<div className="p-8 text-center">
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
								d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium text-text mb-2">
						No Store Orders
					</h3>
					<p className="text-text-muted/70">
						You haven't received any store orders yet. Once customers start
						buying your products, they'll appear here.
					</p>
				</div>
			</Card>
		);
	}

	return (
		<div className="bg-surface border border-stroke rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b border-stroke">
							<th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide w-4">
								{/* Urgency column */}
							</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
								<button
									onClick={() => {
										if (sortBy === "date") {
											setSortOrder(sortOrder === "asc" ? "desc" : "asc");
										} else {
											setSortBy("date");
											setSortOrder("desc");
										}
									}}
									className="flex items-center gap-1 hover:text-text transition-colors"
								>
									Order ID
									{sortBy === "date" && (
										<span className="text-xs">
											{sortOrder === "asc" ? "↑" : "↓"}
										</span>
									)}
								</button>
							</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
								Customer
							</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
								<button
									onClick={() => {
										if (sortBy === "amount") {
											setSortOrder(sortOrder === "asc" ? "desc" : "asc");
										} else {
											setSortBy("amount");
											setSortOrder("desc");
										}
									}}
									className="flex items-center gap-1 hover:text-text transition-colors"
								>
									Amount
									{sortBy === "amount" && (
										<span className="text-xs">
											{sortOrder === "asc" ? "↑" : "↓"}
										</span>
									)}
								</button>
							</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
								<button
									onClick={() => {
										if (sortBy === "status") {
											setSortOrder(sortOrder === "asc" ? "desc" : "asc");
										} else {
											setSortBy("status");
											setSortOrder("desc");
										}
									}}
									className="flex items-center gap-1 hover:text-text transition-colors"
								>
									Status
									{sortBy === "status" && (
										<span className="text-xs">
											{sortOrder === "asc" ? "↑" : "↓"}
										</span>
									)}
								</button>
							</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
								Fulfillment
							</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
								Date
							</th>
							<th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedOrders.map((order) => {
							// Urgency Logic: Paid AND Unfulfilled
							const isUrgent =
								order.status === "paid" &&
								(order.fulfillmentAggregateStatus === "unfulfilled" ||
									order.fulfillmentAggregateStatus === "partial" ||
									!order.fulfillmentAggregateStatus);

							return (
								<tr
									key={order.id}
									className={cn(
										"border-b border-stroke/50 hover:bg-surface/50 transition-colors cursor-pointer group",
										isUrgent ? "bg-alert/5 hover:bg-alert/10" : ""
									)}
									onClick={() => onOrderClick(order)}
								>
									<td className="py-4 px-4 w-4 relative">
										{isUrgent && (
											<div
												className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-alert"
												title="Action Needed"
											/>
										)}
									</td>
									<td className="py-4 px-4">
										<div className="font-mono text-sm font-medium text-text group-hover:text-cta transition-colors">
											{formatOrderId(order.id)}
										</div>
									</td>
									<td className="py-4 px-4">
										<div className="text-sm text-text">
											{order.deliverTo?.fullName || "Unknown Customer"}
										</div>
										<div className="text-xs text-text-muted">
											{order.deliverTo?.email ||
												order.deliverTo?.phone ||
												"No contact info"}
										</div>
									</td>
									<td className="py-4 px-4">
										<div className="text-sm font-medium text-text">
											{formatCurrency(order.amount.itemsSubtotalMinor)}
										</div>
										<div className="text-xs text-text-muted">
											{order.lineItems.length} item
											{order.lineItems.length !== 1 ? "s" : ""}
										</div>
									</td>
									<td className="py-4 px-4">
										<span
											className={cn(
												"px-2 py-0.5 rounded-md text-xs font-medium inline-block",
												getStatusColor(order.status)
											)}
										>
											{order.status === "pending"
												? "Unpaid"
												: order.status === "paid" &&
												  (!order.fulfillmentAggregateStatus ||
														order.fulfillmentAggregateStatus === "unfulfilled")
												? "Awaiting Fulfillment"
												: order.status.charAt(0).toUpperCase() +
												  order.status.slice(1)}
										</span>
									</td>
									<td className="py-4 px-4">
										<span
											className={`text-sm font-medium ${getFulfillmentColor(
												order.fulfillmentAggregateStatus || "unfulfilled"
											)}`}
										>
											{getFulfillmentLabel(
												order.fulfillmentAggregateStatus || "unfulfilled"
											)}
										</span>
									</td>
									<td className="py-4 px-4">
										<div className="text-sm text-text">
											{formatDistanceToNow(toMillis(order.createdAt), {
												addSuffix: true,
											})}
										</div>
									</td>
									<td className="py-4 px-4 text-right">
										<Button
											text="View"
											variant="outline"
											className="px-3 py-1 text-sm h-8"
											onClick={(e) => {
												e.stopPropagation();
												onOrderClick(order);
											}}
										/>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{hasMore && (
				<div className="p-4 border-t border-stroke">
					<Button
						text={loading ? "Loading..." : "Load More"}
						variant="outline"
						onClick={onLoadMore}
						disabled={loading}
						className="w-full"
					/>
				</div>
			)}
		</div>
	);
}
