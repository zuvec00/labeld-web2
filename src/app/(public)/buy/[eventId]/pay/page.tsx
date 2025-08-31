"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function PayPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const initializePayment = async () => {
			try {
				setLoading(true);

				// TODO: Replace with actual payment provider initialization
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Mock successful payment redirect
				// In real implementation, this would redirect to Paystack/Flutterwave
				router.push(`/buy/${eventId}/success?orderId=ord_demo_123`);
			} catch (err) {
				console.error("Payment initialization failed:", err);
				setError("Failed to initialize payment. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		initializePayment();
	}, [eventId, router]);

	const handleRetry = () => {
		setError(null);
		setLoading(true);
		// Retry payment initialization
		setTimeout(() => {
			router.push(`/buy/${eventId}/success?orderId=ord_demo_123`);
		}, 1000);
	};

	const handleBackToContact = () => {
		router.push(`/buy/${eventId}/contact`);
	};

	if (error) {
		return (
			<div>
				<div className="flex items-center gap-3 mb-6">
					<button
						onClick={handleBackToContact}
						className="text-text-muted hover:text-text transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<h1 className="text-2xl font-heading font-bold">Payment</h1>
				</div>

				<div className="bg-surface rounded-2xl border border-stroke p-8 text-center">
					<div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-red-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>

					<h3 className="text-lg font-heading font-semibold text-text mb-2">
						Payment Failed
					</h3>

					<p className="text-text-muted mb-6 max-w-sm mx-auto">{error}</p>

					<div className="flex items-center justify-center gap-3">
						<button
							onClick={handleBackToContact}
							className="text-text-muted hover:text-text transition-colors"
						>
							Back to Contact
						</button>

						<button
							onClick={handleRetry}
							className="bg-cta hover:bg-cta/90 text-black font-heading font-semibold px-6 py-2 rounded-xl transition-all duration-200"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="flex items-center gap-3 mb-6">
				<button className="text-text-muted hover:text-text transition-colors">
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="text-2xl font-heading font-bold">Payment</h1>
			</div>

			<div className="bg-surface rounded-2xl border border-stroke p-8 text-center">
				<div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<Spinner size="lg" />
				</div>

				<h3 className="text-lg font-heading font-semibold text-text mb-2">
					Redirecting to Payment...
				</h3>

				<p className="text-text-muted max-w-sm mx-auto">
					Please wait while we redirect you to our secure payment provider.
				</p>
			</div>
		</div>
	);
}
