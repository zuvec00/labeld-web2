"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMerchForEvent } from "@/hooks/useMerchForEvent";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import MerchList from "@/components/checkout/MerchList";
import EmptyState from "@/components/checkout/EmptyState";
import { Spinner } from "@/components/ui/spinner";

export default function MerchPage() {
	const params = useParams();
	const eventId = params.eventId as string;
	const { merchItems, loading, error } = useMerchForEvent(eventId);
	const { items } = useCheckoutCart();
	const router = useRouter();
	// Check if user has tickets
	const hasTickets = useMemo(() => {
		return items.some((item) => item._type === "ticket" && item.qty > 0);
	}, [items]);

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-text-muted">
					Failed to load merch items. Please try again.
				</p>
			</div>
		);
	}

	// Show guard if no tickets selected
	if (!hasTickets) {
		return (
			<div>
				<div className="flex items-center gap-3 mb-6">
					<button
						type="button"
						className="text-text-muted hover:text-text transition-colors"
						onClick={() => router.back()}
						aria-label="Go back"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<h1 className="text-2xl font-heading font-bold">Event Merch</h1>
				</div>

				<EmptyState
					title="Add a ticket to access merch"
					description="You need to select at least one ticket before you can browse event merchandise."
					actionLabel="Choose Tickets"
					actionHref={`/buy/${eventId}/tickets`}
					showBackButton={true}
				/>
			</div>
		);
	}

	return (
		<div>
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<button
					type="button"
					className="text-text-muted hover:text-text transition-colors active:scale-90 focus:scale-95 focus:outline-none"
					onClick={() => router.back()}
					aria-label="Go back"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="text-2xl font-heading font-bold">Event Merch</h1>
			</div>

			{/* Content */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<Spinner size="lg" />
				</div>
			) : (
				<MerchList merchItems={merchItems} />
			)}
		</div>
	);
}
