"use client";

import { ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import Stepper from "@/components/checkout/Stepper";
import RightSummary from "@/components/checkout/RightSummary";
import { useExitConfirmation } from "@/hooks/useExitConfirmation";

interface CheckoutLayoutProps {
	children: ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
	const params = useParams();
	const pathname = usePathname();
	const eventId = params.eventId as string;
	const { handleExit } = useExitConfirmation(eventId);

	// Check if we're on the success page
	const isSuccessPage = pathname.endsWith("/success");

	// If success page, just render children without checkout layout
	if (isSuccessPage) {
		return <>{children}</>;
	}

	return (
		<div className="min-h-screen bg-bg text-text">
			{/* Header */}
			<div className="border-b border-stroke">
				<div className="container mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-heading font-bold">Checkout</h1>
						<button
							onClick={handleExit}
							className="text-text-muted hover:text-text transition-colors"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Stepper */}
			<div className="border-b border-stroke">
				<div className="container mx-auto px-6 py-6">
					<Stepper />
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-6 py-8">
				<div className="flex justify-between gap-8">
					{/* Left Column - Step Content */}
					<div className="flex-1 max-w-[65%]">{children}</div>

					{/* Right Column - Sticky Summary */}
					<div className="w-96 flex-shrink-0">
						<div className="sticky top-6">
							<RightSummary eventId={eventId} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
