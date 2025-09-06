"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTicketTypes } from "@/hooks/useTicketTypes";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import { useExitConfirmation } from "@/hooks/useExitConfirmation";
import TicketList from "@/components/checkout/TicketList";
import { Spinner } from "@/components/ui/spinner";

export default function TicketsPage() {
	const params = useParams();
	const eventId = params.eventId as string;
	const { ticketTypes, loading, error } = useTicketTypes(eventId);
	const { setEventId } = useCheckoutCart();
	const { handleBackButton } = useExitConfirmation(eventId);

	// Set event ID in cart when component mounts
	useEffect(() => {
		setEventId(eventId);
	}, [eventId, setEventId]);

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-text-muted">
					Failed to load ticket types. Please try again.
				</p>
			</div>
		);
	}

	return (
		<div>
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<button
					onClick={handleBackButton}
					className="text-text-muted hover:text-text transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="text-2xl font-heading font-bold">Choose Tickets</h1>
			</div>

			{/* Content */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<Spinner size="lg" />
				</div>
			) : (
				<TicketList ticketTypes={ticketTypes} />
			)}
		</div>
	);
}
