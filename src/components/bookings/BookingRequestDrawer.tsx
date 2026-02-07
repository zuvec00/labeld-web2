// components/bookings/BookingRequestDrawer.tsx
"use client";

import React, { useState } from "react";
import { BookingRequest, getGuestFullName } from "@/lib/models/booking";
import BookingStatusPill from "./BookingStatusPill";
import { Button } from "@/components/ui/button";
import Textarea from "../ui/textarea";
import {
	Users,
	Calendar,
	Clock,
	Mail,
	Phone,
	StickyNote,
	X,
} from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { updateBookingStatusCF } from "@/lib/firebase/callables/bookings";

interface BookingRequestDrawerProps {
	request: BookingRequest | null;
	isOpen: boolean;
	onClose: () => void;
	onStatusUpdate: (
		requestId: string,
		status: "approved" | "declined" | "checked_in",
		patch?: Partial<BookingRequest>,
	) => Promise<void>;
}

export default function BookingRequestDrawer({
	request,
	isOpen,
	onClose,
	onStatusUpdate,
}: BookingRequestDrawerProps) {
	const [internalNote, setInternalNote] = useState("");
	const [updating, setUpdating] = useState(false);
	const { toast } = useToast();

	React.useEffect(() => {
		if (request?.internal?.note) {
			setInternalNote(request.internal.note);
		} else {
			setInternalNote("");
		}
	}, [request]);

	if (!isOpen || !request) return null;

	const handleApprove = async () => {
		setUpdating(true);
		try {
			// Call backend function to approve booking and send email
			await updateBookingStatusCF({
				requestId: request.id,
				status: "approved",
				note: internalNote,
			});
			toast({
				title: "Booking approved successfully",
				description: "Guest will receive a confirmation email with QR code.",
				duration: 3000,
			});
			onClose();
		} catch (error) {
			console.error("Error approving booking:", error);
			toast({
				title: "Failed to approve booking",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const handleDecline = async () => {
		setUpdating(true);
		try {
			// Call backend function to decline booking and send email
			await updateBookingStatusCF({
				requestId: request.id,
				status: "rejected",
				note: internalNote,
			});
			toast({
				title: "Booking declined",
				description: "Guest will be notified via email.",
				duration: 3000,
			});
			onClose();
		} catch (error) {
			console.error("Error declining booking:", error);
			toast({
				title: "Failed to decline booking",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const handleCheckIn = async () => {
		setUpdating(true);
		try {
			await onStatusUpdate(request.id, "checked_in");
			toast({
				title: "Guest checked in successfully",
				duration: 3000,
			});
			onClose();
		} catch (error) {
			console.error("Error checking in guest:", error);
			toast({
				title: "Failed to check in guest",
				variant: "destructive",
			});
		} finally {
			setUpdating(false);
		}
	};

	const isApproved = request.status === "approved";
	const isCheckedIn = request.status === "checked_in";
	const isPending = request.status === "pending";

	return (
		<div className="fixed inset-0 z-50 overflow-hidden">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Drawer */}
			<div className="absolute right-0 top-0 h-full w-full sm:max-w-lg bg-bg border-l border-stroke shadow-2xl flex flex-col">
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-stroke">
						<div className="flex-1">
							<h2 className="text-xl font-semibold text-text">
								Booking Request
							</h2>
							<p className="text-sm text-text-muted mt-1">
								Manage reservation details and guest information
							</p>
						</div>
						<div className="flex items-center gap-3">
							<BookingStatusPill status={request.status} />
							<button
								onClick={onClose}
								className="text-text-muted hover:text-text transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6 space-y-6">
						{/* Guest Information */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold text-text">
								Guest Information
							</h3>
							<div className="bg-surface-secondary rounded-lg p-4 space-y-3">
								<div className="flex items-start gap-3">
									<Users className="w-4 h-4 text-text-muted mt-0.5" />
									<div>
										<div className="text-sm font-medium text-text">
											{getGuestFullName(request.guest)}
										</div>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Mail className="w-4 h-4 text-text-muted mt-0.5" />
									<div>
										<div className="text-sm text-text">
											{request.guest.email}
										</div>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Phone className="w-4 h-4 text-text-muted mt-0.5" />
									<div>
										<div className="text-sm text-text">
											{request.guest.phone}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Booking Details */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold text-text">
								Reservation Details
							</h3>
							<div className="bg-surface-secondary rounded-lg p-4 space-y-3">
								<div className="flex items-start gap-3">
									<Calendar className="w-4 h-4 text-text-muted mt-0.5" />
									<div>
										<div className="text-xs text-text-muted">Date</div>
										<div className="text-sm font-medium text-text">
											{request.booking.dateISO}
										</div>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Clock className="w-4 h-4 text-text-muted mt-0.5" />
									<div>
										<div className="text-xs text-text-muted">Time</div>
										<div className="text-sm font-medium text-text">
											{request.booking.time}
										</div>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<Users className="w-4 h-4 text-text-muted mt-0.5" />
									<div>
										<div className="text-xs text-text-muted">Party Size</div>
										<div className="text-sm font-medium text-text">
											{request.booking.partySize}{" "}
											{request.booking.partySize === 1 ? "guest" : "guests"}
										</div>
									</div>
								</div>
								{request.booking.notes && (
									<div className="flex items-start gap-3">
										<StickyNote className="w-4 h-4 text-text-muted mt-0.5" />
										<div>
											<div className="text-xs text-text-muted">Guest Notes</div>
											<div className="text-sm text-text">
												{request.booking.notes}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Check-in Code (if approved) */}
						{(isApproved || isCheckedIn) && request.checkIn?.code && (
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-text">
									Check-in Code
								</h3>
								<div className="bg-surface-secondary rounded-lg p-4 text-center">
									<div className="text-xs text-text-muted mb-1">Code</div>
									<div className="text-2xl font-mono font-semibold text-text tracking-widest">
										{request.checkIn.code}
									</div>
								</div>
							</div>
						)}

						{/* Internal Notes */}
						{!isCheckedIn && (
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-text">
									Internal Notes
								</h3>
								<Textarea
									placeholder="Add notes for your team (not visible to guest)..."
									value={internalNote}
									onChange={(e) => setInternalNote(e.target.value)}
									rows={3}
									className="resize-none"
								/>
							</div>
						)}

						{/* Action Buttons */}
						{isPending && (
							<div className="flex gap-3 pt-4 border-t border-stroke">
								<Button
									onClick={handleApprove}
									disabled={updating}
									text={updating ? "Processing..." : "Approve"}
									className="flex-1"
								/>
								<Button
									onClick={handleDecline}
									disabled={updating}
									text={updating ? "Processing..." : "Decline"}
									variant="danger"
									className="flex-1"
								/>
							</div>
						)}

						{isApproved && !isCheckedIn && (
							<div className="pt-4 border-t border-stroke">
								<Button
									onClick={handleCheckIn}
									disabled={updating}
									text={updating ? "Processing..." : "Mark as Checked In"}
									className="w-full"
									variant="secondary"
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
