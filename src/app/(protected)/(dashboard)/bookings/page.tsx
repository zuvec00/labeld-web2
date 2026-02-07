// app/(protected)/(dashboard)/bookings/page.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBookingRequests } from "@/hooks/useBookingRequests";
import { BookingRequest, BookingStatus } from "@/lib/models/booking";
import BookingRequestsTable from "@/components/bookings/BookingRequestsTable";
import BookingRequestDrawer from "@/components/bookings/BookingRequestDrawer";
import Card from "@/components/dashboard/Card";
import { Calendar } from "lucide-react";

export default function BookingsPage() {
	const { user } = useAuth();
	const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
		"all",
	);
	const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(
		null,
	);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const { requests, loading, updateStatus } = useBookingRequests(
		user?.uid || null,
		statusFilter,
	);

	// Stats for KPI cards
	const stats = React.useMemo(() => {
		return {
			total: requests.length,
			pending: requests.filter((r) => r.status === "pending").length,
			checkedIn: requests.filter((r) => r.status === "checked_in").length,
			approved: requests.filter((r) => r.status === "approved").length,
		};
	}, [requests]);

	const handleRequestClick = (request: BookingRequest) => {
		setSelectedRequest(request);
		setDrawerOpen(true);
	};

	const handleCloseDrawer = () => {
		setDrawerOpen(false);
		setTimeout(() => setSelectedRequest(null), 300);
	};

	return (
		<div className="p-6 space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 mb-1 sm:mb-2">
						<Calendar className="w-6 h-6 text-primary" />
						<h1 className="text-xl sm:text-2xl font-heading font-semibold text-text">
							Booking Requests
						</h1>
					</div>
					<p className="text-xs sm:text-sm text-text-muted">
						Manage reservation requests and guest approvals
					</p>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
				<Card className="p-3 sm:p-4 bg-surface-secondary border-none">
					<div className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">
						Total Requests
					</div>
					<div className="text-xl sm:text-2xl font-bold text-text tabular-nums">
						{stats.total}
					</div>
				</Card>
				<Card className="p-3 sm:p-4 bg-accent/5 border border-accent/10">
					<div className="text-[10px] sm:text-xs text-accent uppercase tracking-wider font-semibold mb-1">
						Pending
					</div>
					<div className="text-xl sm:text-2xl font-bold text-accent tabular-nums">
						{stats.pending}
					</div>
				</Card>
				<Card className="p-3 sm:p-4 bg-edit/5 border border-edit/10">
					<div className="text-[10px] sm:text-xs text-edit uppercase tracking-wider font-semibold mb-1">
						Approved
					</div>
					<div className="text-xl sm:text-2xl font-bold text-edit tabular-nums">
						{stats.approved}
					</div>
				</Card>
				<Card className="p-3 sm:p-4 bg-primary/5 border border-primary/10">
					<div className="text-[10px] sm:text-xs text-primary uppercase tracking-wider font-semibold mb-1">
						Checked In
					</div>
					<div className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
						{stats.checkedIn}
					</div>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row sm:items-center gap-4">
				<div className="flex-1" />
				<select
					value={statusFilter}
					onChange={(e) =>
						setStatusFilter(e.target.value as BookingStatus | "all")
					}
					className="w-full sm:w-[200px] h-11 bg-surface border border-stroke rounded-[12px] px-4 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer"
				>
					<option value="all">All Requests</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="declined">Declined</option>
					<option value="checked_in">Checked In</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>

			{/* Requests Table */}
			<Card>
				<BookingRequestsTable
					requests={requests}
					onRequestClick={handleRequestClick}
					loading={loading}
				/>
			</Card>

			{/* Request Details Drawer */}
			<BookingRequestDrawer
				request={selectedRequest}
				isOpen={drawerOpen}
				onClose={handleCloseDrawer}
				onStatusUpdate={updateStatus}
			/>
		</div>
	);
}
