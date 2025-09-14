// app/(protected)/(dashboard)/orders/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useOrders } from "@/hooks/useOrders";
import { OrderTab, OrderFilters, OrderWithVendorStatus } from "@/types/orders";
import OrdersFilters from "@/components/orders/OrdersFilters";
import OrdersTable from "@/components/orders/OrdersTable";
import OrderDetailDrawer from "@/components/orders/OrderDetailDrawer";
import Card from "@/components/dashboard/Card";

export default function OrdersPage() {
	const [activeTab, setActiveTab] = useState<OrderTab>("event");
	const [selectedOrder, setSelectedOrder] =
		useState<OrderWithVendorStatus | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const {
		orders,
		loading,
		error,
		hasMore,
		vendorScope,
		loadMore,
		refresh,
		applyFilters,
	} = useOrders(activeTab);

	const handleOrderClick = (order: OrderWithVendorStatus) => {
		setSelectedOrder(order);
		setIsDrawerOpen(true);
	};

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
		setSelectedOrder(null);
	};

	const handleFiltersChange = useCallback(
		async (filters: OrderFilters) => {
			await applyFilters(filters);
		},
		[applyFilters]
	);

	if (error) {
		return (
			<div className="text-center py-12">
				<div className="text-alert text-lg mb-2">Error Loading Orders</div>
				<p className="text-text-muted/70">{error}</p>
				<button
					onClick={refresh}
					className="mt-4 px-4 py-2 bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-heading font-semibold text-text mb-2">
					Orders
				</h1>
				<p className="text-text-muted">
					Manage and track your event orders and merchandise sales
				</p>
			</div>

			{/* Vendor Scope Info */}
			{vendorScope && (
				<div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
					<div className="flex items-center gap-3">
						<div className="w-2 h-2 bg-accent rounded-full"></div>
						<div>
							<h3 className="text-sm font-medium text-accent mb-1">
								Your Access Level
							</h3>
							<div className="text-xs text-text-muted space-y-1">
								{vendorScope.isOrganizer && (
									<p>• Event Organizer: {vendorScope.eventIds.size} events</p>
								)}
								{vendorScope.isBrand && (
									<p>
										• Brand Owner: {vendorScope.merchItemIds.size} merchandise
										items
									</p>
								)}
								{!vendorScope.isOrganizer && !vendorScope.isBrand && (
									<p>• No orders found for your account</p>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Tabs */}
			<Card>
				<div className="flex items-center gap-1">
					<button
						onClick={() => setActiveTab("event")}
						className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
							activeTab === "event"
								? "bg-cta text-text"
								: "text-text-muted hover:text-text hover:bg-surface"
						}`}
					>
						Event Orders
					</button>
					<button
						onClick={() => setActiveTab("store")}
						disabled
						className="px-4 py-2 text-sm font-medium rounded-lg text-text-muted/50 cursor-not-allowed opacity-50"
						title="Coming soon"
					>
						Store Orders
					</button>
				</div>
			</Card>

			{/* Filters */}
			<OrdersFilters onFiltersChange={handleFiltersChange} loading={loading} />

			{/* Orders Table */}
			<OrdersTable
				orders={orders}
				loading={loading}
				hasMore={hasMore}
				onLoadMore={loadMore}
				onOrderClick={handleOrderClick}
			/>

			{/* Order Detail Drawer */}
			<OrderDetailDrawer
				order={selectedOrder}
				isOpen={isDrawerOpen}
				onClose={handleCloseDrawer}
				onUpdate={refresh}
			/>

			{/* Store Orders Coming Soon */}
			{activeTab === "store" && (
				<Card>
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
									d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-text mb-2">
							Store Orders Coming Soon
						</h3>
						<p className="text-text-muted/70 mb-4">
							Store orders functionality is currently under development.
							You&apos;ll be able to manage your merchandise orders here soon.
						</p>
						<div className="text-xs text-text-muted">
							For now, you can view event-related orders in the Event Orders tab
							above.
						</div>
					</div>
				</Card>
			)}
		</div>
	);
}
