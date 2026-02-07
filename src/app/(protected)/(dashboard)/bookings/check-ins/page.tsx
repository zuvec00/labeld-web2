// app/(protected)/(dashboard)/bookings/check-ins/page.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { BookingRequest } from "@/lib/models/booking";
import {
	searchBookingRequests,
	checkInBooking,
} from "@/lib/firebase/queries/bookings";
import QRScannerPlaceholder from "@/components/bookings/QRScannerPlaceholder";
import BookingStatusPill from "@/components/bookings/BookingStatusPill";
import Card from "@/components/dashboard/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Search, User, Calendar, Clock, Users } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

export default function CheckInsPage() {
	const { user } = useAuth();
	const { toast } = useToast();
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState<BookingRequest[]>([]);
	const [searching, setSearching] = useState(false);
	const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
		null,
	);
	const [checkingIn, setCheckingIn] = useState(false);

	const handleSearch = async () => {
		if (!user?.uid || !searchTerm.trim()) return;

		setSearching(true);
		try {
			const results = await searchBookingRequests(user.uid, searchTerm);
			setSearchResults(results);
			if (results.length === 0) {
				toast({
					title: "No reservations found",
					duration: 3000,
				});
			}
		} catch (error) {
			console.error("Error searching bookings:", error);
			toast({
				title: "Failed to search reservations",
				variant: "destructive",
			});
		} finally {
			setSearching(false);
		}
	};

	const handleCheckIn = async (requestId: string) => {
		setCheckingIn(true);
		try {
			await checkInBooking(requestId, user?.uid);
			toast({
				title: "Guest checked in successfully!",
				duration: 3000,
			});

			// Update local state
			setSearchResults((prev) =>
				prev.map((r) =>
					r.id === requestId ? { ...r, status: "checked_in" as const } : r,
				),
			);
			setSelectedBooking(null);
		} catch (error) {
			console.error("Error checking in guest:", error);
			toast({
				title: "Failed to check in guest",
				variant: "destructive",
			});
		} finally {
			setCheckingIn(false);
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* Page Header */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<ScanLine className="w-6 h-6 text-primary" />
					<h1 className="text-2xl font-heading font-semibold text-text">
						Check-ins
					</h1>
				</div>
				<p className="text-sm text-text-muted">
					Scan QR codes or manually check in guests
				</p>
			</div>

			{/* Two-column layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* QR Scanner */}
				<Card>
					<div>
						<h2 className="text-lg font-semibold text-text mb-4">QR Scanner</h2>
						<QRScannerPlaceholder />
					</div>
				</Card>

				{/* Manual Lookup */}
				<Card>
					<div className="space-y-4">
						<div>
							<h2 className="text-lg font-semibold text-text">Manual Lookup</h2>
							<p className="text-sm text-text-muted">
								Search by guest name, phone, or check-in code
							</p>
						</div>

						{/* Search Input */}
						<div className="flex gap-2">
							<Input
								placeholder="Enter name, phone, or code..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							/>
							<Button
								onClick={handleSearch}
								disabled={searching || !searchTerm.trim()}
								text={searching ? "Searching..." : "Search"}
								leftIcon={<Search className="w-4 h-4" />}
							/>
						</div>

						{/* Search Results */}
						<div className="space-y-3 max-h-[500px] overflow-y-auto">
							{searchResults.length > 0 ? (
								searchResults.map((booking) => (
									<div
										key={booking.id}
										className="p-4 rounded-lg bg-surface-secondary border border-stroke hover:border-primary/50 transition-colors cursor-pointer"
										onClick={() => setSelectedBooking(booking)}
									>
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-center gap-2">
												<div className="p-2 rounded-full bg-primary/10 text-primary">
													<User className="w-4 h-4" />
												</div>
												<span className="font-semibold text-text">
													{booking.guest.firstName} {booking.guest.lastName}
												</span>
											</div>
											<BookingStatusPill status={booking.status} />
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
											<div className="flex items-center gap-2 text-text-muted">
												<Calendar className="w-4 h-4 opacity-70" />
												<span>{booking.booking.dateISO}</span>
											</div>
											<div className="flex items-center gap-2 text-text-muted">
												<Clock className="w-4 h-4 opacity-70" />
												<span>{booking.booking.time}</span>
											</div>
											<div className="flex items-center gap-2 text-text-muted">
												<Users className="w-4 h-4 opacity-70" />
												<span>Party of {booking.booking.partySize}</span>
											</div>
											{booking.checkIn?.code && (
												<div className="flex items-center gap-2 text-primary font-mono text-xs">
													<ScanLine className="w-4 h-4" />
													Code: {booking.checkIn.code}
												</div>
											)}
										</div>

										{booking.status === "approved" && (
											<Button
												onClick={(e) => {
													e.stopPropagation();
													handleCheckIn(booking.id);
												}}
												disabled={checkingIn}
												className="w-full mt-3"
												size="sm"
												text={
													checkingIn ? "Checking in..." : "Confirm Check-in"
												}
											/>
										)}

										{booking.status === "checked_in" && (
											<div className="text-xs text-text-muted mt-3 text-center">
												Already checked in
											</div>
										)}
									</div>
								))
							) : searchTerm && !searching ? (
								<div className="text-center py-8 text-text-muted">
									<Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p className="text-sm">No reservations found</p>
								</div>
							) : !searchTerm ? (
								<div className="text-center py-8 text-text-muted">
									<p className="text-sm">
										Enter a search term to find reservations
									</p>
								</div>
							) : null}
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
