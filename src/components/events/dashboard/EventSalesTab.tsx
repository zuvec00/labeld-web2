"use client";

import { useEventOrders } from "@/hooks/useEventOrders";
import { OrderWithVendorStatus } from "@/types/orders";
import OrdersTable from "@/components/orders/OrdersTable";
import { Banknote, CreditCard, TrendingUp } from "lucide-react";

export default function EventSalesTab({ eventId }: { eventId: string }) {
	// Reuse useEventOrders for transaction history
	const { orders, loading, hasMore, loadMore } = useEventOrders(eventId);

	// Calculate total revenue from *visible* orders (Note: This is partial if paginated)
	// In a real app, this should come from a backend aggregation or 'events/{id}/stats' doc
	const visibleRevenue = orders.reduce((sum, order) => {
		if (order.status === "paid") {
			return sum + order.amount.totalMinor / 100;
		}
		return sum;
	}, 0);

	return (
		<div className="space-y-8">
			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-surface border border-stroke rounded-xl p-5">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 bg-green-500/10 rounded-lg">
							<Banknote className="w-5 h-5 text-green-500" />
						</div>
						<h3 className="text-text-muted text-sm font-medium">
							Total Revenue
						</h3>
					</div>
					<div className="text-2xl font-bold font-heading">
						{/* Placeholder or calculated from visible */}
						UserCurrency {visibleRevenue.toLocaleString()}{" "}
						<span className="text-xs text-text-muted font-normal">
							(visible)
						</span>
					</div>
				</div>

				<div className="bg-surface border border-stroke rounded-xl p-5">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 bg-blue-500/10 rounded-lg">
							<CreditCard className="w-5 h-5 text-blue-500" />
						</div>
						<h3 className="text-text-muted text-sm font-medium">Payouts</h3>
					</div>
					<div className="text-2xl font-bold font-heading">
						UserCurrency 0.00
					</div>
					<div className="mt-1 text-xs text-text-muted">Next payout: --</div>
				</div>

				<div className="bg-surface border border-stroke rounded-xl p-5">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 bg-purple-500/10 rounded-lg">
							<TrendingUp className="w-5 h-5 text-purple-500" />
						</div>
						<h3 className="text-text-muted text-sm font-medium">
							Tickets Sold
						</h3>
					</div>
					<div className="text-2xl font-bold font-heading">--</div>
				</div>
			</div>

			{/* Sales Chart Placeholder */}
			<div className="bg-surface border border-stroke rounded-xl p-6">
				<h3 className="font-heading font-semibold text-lg mb-4">
					Sales Over Time
				</h3>
				<div className="h-64 grid place-items-center text-text-muted text-sm border border-dashed border-stroke rounded-lg">
					Chart Area (Coming Soon)
				</div>
			</div>

			{/* Transaction History (Reuse Orders Table) */}
			<div>
				<h3 className="font-heading font-semibold text-lg mb-4">
					Transaction History
				</h3>
				<OrdersTable
					orders={orders}
					loading={loading}
					hasMore={hasMore}
					onLoadMore={loadMore}
					onOrderClick={() => {}} // No drawer for sales tab, or maybe show simple receipt
				/>
			</div>
		</div>
	);
}
