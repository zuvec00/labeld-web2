"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useEventOrders } from "@/hooks/useEventOrders";
import { OrderWithVendorStatus } from "@/types/orders";
import OrdersFilters from "@/components/orders/OrdersFilters";
import OrdersTable from "@/components/orders/OrdersTable";
import OrderDetailDrawer from "@/components/orders/OrderDetailDrawer";
import OrderExportModal from "@/components/orders/OrderExportModal";

export default function EventOrdersTab({ eventId }: { eventId: string }) {
	const [selectedOrder, setSelectedOrder] =
		useState<OrderWithVendorStatus | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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
			{/* Header with Export Button */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-heading font-semibold text-lg">Event Orders</h2>
					<p className="text-sm text-text-muted">
						{orders.length} orders loaded
					</p>
				</div>
				<button
					onClick={() => setIsExportModalOpen(true)}
					className="flex items-center gap-2 px-4 py-2 bg-surface border border-stroke rounded-lg text-sm font-medium hover:border-cta hover:text-cta transition-all"
				>
					<Download className="w-4 h-4" />
					Export
				</button>
			</div>

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

			{/* Export Modal */}
			<OrderExportModal
				isOpen={isExportModalOpen}
				onClose={() => setIsExportModalOpen(false)}
				eventId={eventId}
				filenamePrefix={`event_${eventId}_orders`}
			/>
		</div>
	);
}
