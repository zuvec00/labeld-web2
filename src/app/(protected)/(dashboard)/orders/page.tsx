// app/(protected)/(dashboard)/orders/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useOrdersStats } from "@/hooks/useOrdersStats";
import { useStoreOrders } from "@/hooks/useStoreOrders";
import SnapshotStrip, { SnapshotItem } from "@/components/orders/SnapshotStrip";
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
import QuickFilterPills from "@/components/orders/QuickFilterPills";

export default function OrdersPage() {
	const [activeTab, setActiveTab] = useState<OrderTab>("store"); // Default to "store"
	const [selectedOrder, setSelectedOrder] =
		useState<OrderWithVendorStatus | null>(null);
	const [selectedStoreOrder, setSelectedStoreOrder] =
		useState<StoreOrderWithVendorStatus | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
	const [quickFilter, setQuickFilter] = useState<string>("");

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

	const { storeStats, eventStats, loading: statsLoading } = useOrdersStats();

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
			// Integrate quick filter modifications if needed,
			// but usually `OrdersFilters` handles the heavy lifting.
			// Here we just pass it through.
			if (activeTab === "event") {
				await applyFilters(filters);
			} else {
				await storeApplyFilters(filters);
			}
		},
		[activeTab, applyFilters, storeApplyFilters]
	);

	const handleQuickFilter = useCallback(
		(filterType: string) => {
			setQuickFilter(filterType === quickFilter ? "" : filterType);
			// Map quick filters to actual filter changes
			// This is a simplified example; robust implementation might merge with existing filters
			const baseFilters: OrderFilters = {
				dateRange: "30days",
				statuses: [],
				types: [],
				sources: [],
				fulfillmentStatuses: [],
				search: "",
			};

			if (filterType === quickFilter) {
				// Clearing logic - reset to default or keep current user applied filters?
				// For simplicity, let's just re-trigger default fetch logic or minimal reset
				if (activeTab === "event")
					applyFilters({ ...baseFilters, dateRange: "7days" });
				else storeApplyFilters({ ...baseFilters, dateRange: "7days" });
				return;
			}

			if (filterType === "action_needed") {
				if (activeTab === "store") {
					// Awaiting Fulfillment (Paid + Unfulfilled)
					storeApplyFilters({
						...baseFilters,
						statuses: ["paid"],
						fulfillmentStatuses: ["unfulfilled", "partial"],
					});
				} else {
					// For events, maybe upcoming? Or specific status? Keeping simple for now.
					applyFilters({ ...baseFilters, dateRange: "7days" });
				}
			} else if (filterType === "recent") {
				if (activeTab === "store")
					storeApplyFilters({ ...baseFilters, dateRange: "7days" });
				else applyFilters({ ...baseFilters, dateRange: "7days" });
			} else if (filterType === "completed") {
				const completedFilters = {
					...baseFilters,
					statuses: ["completed"] as any[],
					dateRange: "30days" as const,
				};
				if (activeTab === "store") storeApplyFilters(completedFilters);
				else applyFilters(completedFilters);
			}
		},
		[activeTab, quickFilter, applyFilters, storeApplyFilters]
	);

	const snapshotItems: SnapshotItem[] = useMemo(() => {
		if (activeTab === "store" && storeStats) {
			return [
				{
					label: "Awaiting Fulfillment",
					value: storeStats.awaiting_fulfillment,
					onClick: () => handleQuickFilter("action_needed"),
					active: quickFilter === "action_needed",
				},
				{
					label: "Unpaid Orders",
					value: storeStats.unpaid,
					// onClick: () => handleQuickFilter("unpaid") // Optional
				},
				{
					label: "Completed",
					value: storeStats.completed,
					onClick: () => handleQuickFilter("completed"),
					active: quickFilter === "completed",
				},
				{ label: "Total Orders", value: storeStats.total },
			];
		} else if (activeTab === "event" && eventStats) {
			return [
				{ label: "Upcoming Events", value: eventStats.upcomingEventsCount },
				{
					label: "Next Event In",
					value:
						eventStats.daysToNextEvent !== null
							? eventStats.daysToNextEvent === 0
								? "Today"
								: `${eventStats.daysToNextEvent} Days`
							: "-",
				},
				{ label: "Tickets Sold", value: eventStats.totalTicketsSold },
				{ label: "Capacity Used", value: `${eventStats.capacityUsedPercent}%` },
			];
		}
		return [];
	}, [activeTab, storeStats, eventStats, quickFilter, handleQuickFilter]);

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
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-heading font-semibold text-text mb-1">
						Orders
					</h1>
					<p className="text-text-muted text-sm">
						Manage and track your event orders and merchandise sales
					</p>
				</div>
				<div className="flex bg-surface p-1 rounded-lg border border-stroke">
					<button
						onClick={() => setActiveTab("store")}
						className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
							activeTab === "store"
								? "bg-text text-bg shadow-sm"
								: "text-text-muted hover:text-text"
						}`}
					>
						Store Orders
					</button>
					<button
						onClick={() => setActiveTab("event")}
						className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
							activeTab === "event"
								? "bg-text text-bg shadow-sm"
								: "text-text-muted hover:text-text"
						}`}
					>
						Event Orders
					</button>
				</div>
			</div>

			{/* Snapshot Strip */}
			<SnapshotStrip items={snapshotItems} />

			{/* Filters & Pills */}
			<div className="space-y-4">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<OrdersFilters
						onFiltersChange={handleFiltersChange}
						loading={activeTab === "event" ? loading : storeLoading}
						className="flex-1"
					/>
					<QuickFilterPills
						pills={[
							{ id: "action_needed", label: "Needs Action" },
							{ id: "recent", label: "Recent" },
							{ id: "completed", label: "Completed" },
						]}
						activePillId={quickFilter}
						onSelect={handleQuickFilter}
					/>
				</div>
			</div>

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
