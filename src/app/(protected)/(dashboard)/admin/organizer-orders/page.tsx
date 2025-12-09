"use client";

import { useState } from "react";
import {
	getVendorScope,
	getOrdersInDateRange,
	filterOrdersByVendorScope,
	getVendorLineStatuses,
	getFulfillmentLines,
	getEventDetailsBatch,
} from "@/lib/firebase/queries/orders";
import { OrderWithVendorStatus, VendorScope } from "@/types/orders";
import {
	getDateRange,
	getLineFulfillmentStatus,
	calculateFulfillmentAggregateStatus,
} from "@/lib/orders/helpers";
import OrdersTable from "@/components/orders/OrdersTable";
import Card from "@/components/dashboard/Card";
import { Timestamp } from "firebase/firestore";

export default function AdminOrganizerOrdersPage() {
	const [organizerId, setOrganizerId] = useState("");
	const [loading, setLoading] = useState(false);
	const [orders, setOrders] = useState<OrderWithVendorStatus[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [revenue, setRevenue] = useState(0);
	const [stats, setStats] = useState({ gross: 0, fees: 0, net: 0 });
	const [searchedVendorScope, setSearchedVendorScope] =
		useState<VendorScope | null>(null);

	const handleFetchOrders = async () => {
		if (!organizerId.trim()) {
			setError("Please enter an Organizer ID");
			return;
		}

		setLoading(true);
		setError(null);
		setOrders([]);
		setRevenue(0);
		setStats({ gross: 0, fees: 0, net: 0 });
		setSearchedVendorScope(null);

		try {
			// 1. Get Vendor Scope
			const scope = await getVendorScope(organizerId);
			if (!scope.isOrganizer) {
				setError("User is not an organizer or has no events.");
				setLoading(false);
				return;
			}
			setSearchedVendorScope(scope);

			// 2. Fetch Orders (Last 30 days by default for now, or maybe all time?)
			// The prompt said "see existing orders table", which uses date range.
			// Let's fetch a reasonable large range or reuse the logic.
			// For this specific admin tool, maybe we want ALL orders?
			// The `getOrdersInDateRange` requires dates. Let's use a wide range for now or "30days".
			// Let's default to "30days" like the main page often does, but maybe allow custom?
			// For simplicity v1: Last 30 days.

			const dateRange = getDateRange("30days");
			// Note: getOrdersInDateRange handles pagination.
			// To get ALL orders for revenue calc, we might need to loop.
			// BUT, existing `useOrders` fetches page by page.
			// If we want "Calculated Revenue", we probably want it based on the FETCHED orders or ALL orders?
			// User said "see all the orders... and see the calculated revenue based on the orders".
			// "Based on the orders" implies the ones we see.

			// Let's fetch the first batch (25) and maybe add a "Load More" or just fetch a larger batch.
			// Implementation plan said: "Fetch orders using getOrdersInDateRange".

			const { orders: rawOrders } = await getOrdersInDateRange(
				dateRange.start,
				dateRange.end,
				100 // Fetch up to 100 for this view to be useful
			);

			// 3. Filter by Vendor Scope
			let filteredOrders = filterOrdersByVendorScope(rawOrders, scope);

			// 4. Hydrate with details (reusing logic from useOrders roughly)
			if (filteredOrders.length > 0) {
				const orderIds = filteredOrders.map((order) => order.id);

				const [vendorLineStatuses, fulfillmentLines, eventDetails] =
					await Promise.all([
						getVendorLineStatuses(orderIds),
						getFulfillmentLines(orderIds),
						getEventDetailsBatch([
							...new Set(filteredOrders.map((order) => order.eventId)),
						]),
					]);

				filteredOrders = filteredOrders.map((order) => {
					const orderFulfillmentLines = fulfillmentLines[order.id] || {};
					const lines = Object.values(orderFulfillmentLines);

					const fulfillmentStatuses: Record<string, any> = {};
					lines.forEach((line) => {
						fulfillmentStatuses[line.lineKey] = getLineFulfillmentStatus(line);
					});

					const vendorOwnedLineKeys = order.lineItems
						.filter((item) => item._type === "merch")
						.map((item) => `merch:${item.merchItemId}`);

					const fulfillmentAggregateStatus =
						calculateFulfillmentAggregateStatus(
							fulfillmentStatuses,
							vendorOwnedLineKeys
						);

					return {
						...order,
						vendorLineStatuses: vendorLineStatuses[order.id] || {},
						fulfillmentLines: orderFulfillmentLines,
						fulfillmentStatuses,
						fulfillmentAggregateStatus,
						eventTitle: eventDetails[order.eventId]?.title,
					};
				}) as OrderWithVendorStatus[];
			}

			setOrders(filteredOrders);

			// 5. Calculate Revenue
			const revenueStats = filteredOrders.reduce(
				(acc, order) => {
					const total = order.amount.totalMinor / 100;
					const fees = order.amount.feesMinor / 100;
					return {
						gross: acc.gross + total,
						fees: acc.fees + fees,
						net: acc.net + (total - fees),
					};
				},
				{ gross: 0, fees: 0, net: 0 }
			);

			setRevenue(revenueStats.gross);
			setStats(revenueStats);
		} catch (err) {
			console.error(err);
			setError("Failed to fetch orders");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-heading font-semibold text-text mb-2">
					Admin: Organizer Orders
				</h1>
				<p className="text-text-muted">
					View orders and revenue for a specific event organizer (Last 30 Days)
				</p>
			</div>

			<Card>
				<div className="flex items-end gap-4">
					<div className="flex-1">
						<label className="block text-sm font-medium text-text-muted mb-1">
							Organizer User ID
						</label>
						<input
							type="text"
							value={organizerId}
							onChange={(e) => setOrganizerId(e.target.value)}
							className="w-full px-4 py-2 bg-surface border border-stroke rounded-lg text-text focus:outline-none focus:border-primary"
							placeholder="e.g. user_123..."
						/>
					</div>
					<button
						onClick={handleFetchOrders}
						disabled={loading}
						className="px-6 py-2 bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors disabled:opacity-50"
					>
						{loading ? "Loading..." : "Fetch Orders"}
					</button>
				</div>
				{error && <p className="mt-2 text-alert text-sm">{error}</p>}
			</Card>

			{searchedVendorScope && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<Card>
						<div className="text-text-muted text-sm mb-1">Total Orders</div>
						<div className="text-2xl font-semibold text-text">
							{orders.length}
						</div>
					</Card>
					<Card>
						<div className="text-text-muted text-sm mb-1">Gross Revenue</div>
						<div className="text-2xl font-semibold text-text">
							₦
							{stats.gross.toLocaleString("en-NG", {
								minimumFractionDigits: 2,
							})}
						</div>
					</Card>
					<Card>
						<div className="text-text-muted text-sm mb-1">Platform Fees</div>
						<div className="text-2xl font-semibold text-alert">
							-₦
							{stats.fees.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
						</div>
					</Card>
					<Card>
						<div className="text-text-muted text-sm mb-1">Net Revenue</div>
						<div className="text-2xl font-semibold text-cta">
							₦{stats.net.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
						</div>
					</Card>
				</div>
			)}

			{orders.length > 0 && (
				<OrdersTable
					orders={orders}
					loading={loading}
					hasMore={false} // pagination not implemented for this view yet
					onLoadMore={() => {}}
					onOrderClick={() => {}} // No detail view wired up yet
				/>
			)}

			{searchedVendorScope && orders.length === 0 && !loading && !error && (
				<div className="text-center text-text-muted py-8">
					No orders found for this organizer in the last 30 days.
				</div>
			)}
		</div>
	);
}
