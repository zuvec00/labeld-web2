// app/(protected)/(dashboard)/orders/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useStoreOrders } from "@/hooks/useStoreOrders";
import {
	OrderTab,
	OrderFilters,
	OrderWithVendorStatus,
	StoreOrderWithVendorStatus,
} from "@/types/orders";
import OrdersFilters from "@/components/orders/OrdersFilters";
import OrdersTable from "@/components/orders/OrdersTable";
import StoreOrdersTable from "@/components/orders/StoreOrdersTable";
import OrderDetailDrawer from "@/components/orders/OrderDetailDrawer";
import StoreOrderDetailDrawer from "@/components/orders/StoreOrderDetailDrawer";
import Card from "@/components/dashboard/Card";

export default function OrdersPage() {
	const [activeTab, setActiveTab] = useState<OrderTab>("store"); // Default to "store"
	const [selectedOrder, setSelectedOrder] =
		useState<OrderWithVendorStatus | null>(null);
	const [selectedStoreOrder, setSelectedStoreOrder] =
		useState<StoreOrderWithVendorStatus | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);

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

	const {
		orders: storeOrders,
		loading: storeLoading,
		error: storeError,
		hasMore: storeHasMore,
		vendorScope: storeVendorScope,
		loadMore: storeLoadMore,
		refresh: storeRefresh,
		applyFilters: storeApplyFilters,
	} = useStoreOrders();

	const handleOrderClick = (order: OrderWithVendorStatus) => {
		setSelectedOrder(order);
		setIsDrawerOpen(true);
	};

	const handleStoreOrderClick = (order: StoreOrderWithVendorStatus) => {
		setSelectedStoreOrder(order);
		setIsStoreDrawerOpen(true);
	};

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
		setSelectedOrder(null);
	};

	const handleCloseStoreDrawer = () => {
		setIsStoreDrawerOpen(false);
		setSelectedStoreOrder(null);
	};

	const handleFiltersChange = useCallback(
		async (filters: OrderFilters) => {
			if (activeTab === "event") {
				await applyFilters(filters);
			} else {
				await storeApplyFilters(filters);
			}
		},
		[applyFilters, storeApplyFilters, activeTab]
	);

	if (error || storeError) {
		return (
			<div className="text-center py-12">
				<div className="text-alert text-lg mb-2">Error Loading Orders</div>
				<p className="text-text-muted/70">{error || storeError}</p>
				<button
					onClick={() => {
						if (activeTab === "event") {
							refresh();
						} else {
							storeRefresh();
						}
					}}
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
			{(vendorScope || storeVendorScope) && (
				<div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
					<div className="flex items-center gap-3">
						<div className="w-2 h-2 bg-accent rounded-full"></div>
						<div>
							<h3 className="text-sm font-medium text-accent mb-1">
								Your Access Level
							</h3>
							<div className="text-xs text-text-muted space-y-1">
								{vendorScope?.isOrganizer && (
									<p>• Event Organizer: {vendorScope.eventIds.size} events</p>
								)}
								{vendorScope?.isBrand && (
									<p>
										• Brand Owner: {vendorScope.merchItemIds.size} merchandise
										items
									</p>
								)}
								{storeVendorScope?.isBrand && (
									<p>• Store Owner: Can manage store orders</p>
								)}
								{!vendorScope?.isOrganizer &&
									!vendorScope?.isBrand &&
									!storeVendorScope?.isBrand && (
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
						onClick={() => setActiveTab("store")}
						className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
							activeTab === "store"
								? "bg-cta text-text"
								: "text-text-muted hover:text-text hover:bg-surface"
						}`}
					>
						Store Orders
					</button>
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
				</div>
			</Card>

			{/* Filters */}
			<OrdersFilters
				onFiltersChange={handleFiltersChange}
				loading={activeTab === "event" ? loading : storeLoading}
			/>

			{/* Orders Table */}
			{activeTab === "event" ? (
				<OrdersTable
					orders={orders}
					loading={loading}
					hasMore={hasMore}
					onLoadMore={loadMore}
					onOrderClick={handleOrderClick}
				/>
			) : (
				<StoreOrdersTable
					orders={storeOrders}
					loading={storeLoading}
					hasMore={storeHasMore}
					onLoadMore={storeLoadMore}
					onOrderClick={handleStoreOrderClick}
				/>
			)}

			{/* Order Detail Drawers */}
			<OrderDetailDrawer
				order={selectedOrder}
				isOpen={isDrawerOpen}
				onClose={handleCloseDrawer}
				onUpdate={refresh}
			/>

			<StoreOrderDetailDrawer
				order={selectedStoreOrder}
				isOpen={isStoreDrawerOpen}
				onClose={handleCloseStoreDrawer}
				onUpdate={storeRefresh}
			/>
		</div>
	);
}
