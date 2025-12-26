"use client";

import { useState } from "react";
import { useEventOrders } from "@/hooks/useEventOrders";
import { OrderWithVendorStatus } from "@/types/orders";
import OrdersFilters from "@/components/orders/OrdersFilters";
import OrdersTable from "@/components/orders/OrdersTable";
import OrderDetailDrawer from "@/components/orders/OrderDetailDrawer";

export default function EventOrdersTab({ eventId }: { eventId: string }) {
	const [selectedOrder, setSelectedOrder] =
		useState<OrderWithVendorStatus | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const { orders, loading, error, hasMore, loadMore, refresh, applyFilters } =
		useEventOrders(eventId);

	const handleOrderClick = (order: OrderWithVendorStatus) => {
		setSelectedOrder(order);
		setIsDrawerOpen(true);
	};

	const handleCloseDrawer = () => {
		setIsDrawerOpen(false);
		setSelectedOrder(null);
	};

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
		<div className="space-y-6">
			{/* Filters */}
			<OrdersFilters onFiltersChange={applyFilters} loading={loading} />

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
		</div>
	);
}
