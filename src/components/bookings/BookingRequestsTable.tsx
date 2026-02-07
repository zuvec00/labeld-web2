// components/bookings/BookingRequestsTable.tsx
"use client";

import React from "react";
import { BookingRequest, getGuestFullName } from "@/lib/models/booking";
import BookingStatusPill from "./BookingStatusPill";
import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";

interface BookingRequestsTableProps {
	requests: BookingRequest[];
	onRequestClick: (request: BookingRequest) => void;
	loading?: boolean;
}

export default function BookingRequestsTable({
	requests,
	onRequestClick,
	loading = false,
}: BookingRequestsTableProps) {
	if (loading) {
		return (
			<div className="animate-pulse space-y-3">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="h-16 bg-stroke/50 rounded-lg" />
				))}
			</div>
		);
	}

	if (requests.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stroke/50 mb-4">
					<Users className="w-8 h-8 text-text-muted" />
				</div>
				<h3 className="text-lg font-semibold text-text mb-1">
					No booking requests yet
				</h3>
				<p className="text-sm text-text-muted">
					When customers make reservations, they'll appear here.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto -mx-4 sm:mx-0">
			<table className="w-full min-w-[600px] sm:min-w-0">
				<thead>
					<tr className="border-b border-stroke text-text-muted">
						<th className="text-left py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wider">
							Guest
						</th>
						<th className="text-left py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wider hidden sm:table-cell">
							Date
						</th>
						<th className="text-left py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wider">
							Time
						</th>
						<th className="text-left py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wider">
							Party
						</th>
						<th className="text-left py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wider">
							Status
						</th>
						<th className="text-left py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wider hidden md:table-cell">
							Created
						</th>
					</tr>
				</thead>
				<tbody>
					{requests.map((request) => (
						<tr
							key={request.id}
							onClick={() => onRequestClick(request)}
							className="border-b border-stroke hover:bg-stroke/30 cursor-pointer transition-colors group"
						>
							<td className="py-4 px-4">
								<div className="max-w-[120px] sm:max-w-none">
									<div className="text-sm font-medium text-text truncate group-hover:text-primary transition-colors">
										{getGuestFullName(request.guest)}
									</div>
									<div className="text-xs text-text-muted truncate hidden sm:block">
										{request.guest.email}
									</div>
								</div>
							</td>
							<td className="py-4 px-4 hidden sm:table-cell">
								<div className="text-sm text-text">
									{request.booking.dateISO}
								</div>
							</td>
							<td className="py-4 px-4 text-sm text-text tabular-nums">
								{request.booking.time}
							</td>
							<td className="py-4 px-4">
								<div className="text-sm text-text flex items-center gap-1.5">
									<Users className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
									<span className="tabular-nums">
										{request.booking.partySize}
									</span>
								</div>
							</td>
							<td className="py-4 px-4">
								<BookingStatusPill status={request.status} />
							</td>
							<td className="py-4 px-4 hidden md:table-cell">
								<div className="text-sm text-text-muted whitespace-nowrap">
									{formatDistanceToNow(request.createdAt.toDate(), {
										addSuffix: true,
									})}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
