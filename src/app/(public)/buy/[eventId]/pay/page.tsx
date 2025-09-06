"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import { Button } from "@/components/ui/button";

export default function PayPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;
	const { contact, termsAccepted, setTermsAccepted } = useCheckoutCart();

	const handleBackToContact = () => {
		router.push(`/buy/${eventId}/contact`);
	};

	return (
		<div>
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<button
					onClick={handleBackToContact}
					className="text-text-muted hover:text-text transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="text-2xl font-heading font-bold">Payment Options</h1>
			</div>

			{/* Reservation Timer */}
			<div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
				<p className="text-sm text-text">
					We&apos;ve reserved your ticket. Please complete checkout within{" "}
					<span className="font-semibold text-cta">05:56</span> to secure your
					tickets.
				</p>
			</div>

			{/* Payment Options */}
			<div className="bg-surface rounded-2xl border border-stroke p-6 mb-6">
				<div className="space-y-4">
					{/* Pay with Card or Bank */}
					<div className="flex items-start gap-3">
						<input
							type="radio"
							name="paymentMethod"
							value="card"
							defaultChecked
							className="mt-1 w-4 h-4 accent-cta bg-surface border-stroke focus:ring-cta focus:ring-2"
						/>
						<div className="flex-1">
							<div className="font-medium text-text">Pay with Card or Bank</div>
							<div className="text-sm text-text-muted mt-1">
								Pay with Mastercard, Visa, or Verve or with bank transfer.
							</div>
							<div className="bg-surface/50 rounded-lg p-3 mt-2">
								<p className="text-xs text-text-muted">
									Once your payment is confirmed, your ticket will be emailed to
									you automatically within minutes.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Terms and Conditions */}
			<div className="bg-surface rounded-2xl border border-stroke p-6 mb-6">
				<div className="text-sm text-text-muted mb-4">
					You must accept the Labeld Terms and Conditions, Refund Policy and
					Privacy Policy before completing this purchase.
				</div>

				<div className="space-y-3">
					<label className="flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							checked={termsAccepted || false}
							onChange={(e) => setTermsAccepted(e.target.checked)}
							className="mt-1 w-4 h-4 text-cta bg-surface border-stroke rounded focus:ring-cta focus:ring-2"
						/>
						<div className="text-sm text-text">
							I accept the{" "}
							<a href="#" className="text-cta hover:underline">
								Labeld Terms and Conditions
							</a>
							,{" "}
							<a href="#" className="text-cta hover:underline">
								Refund Policy
							</a>{" "}
							and{" "}
							<a href="#" className="text-cta hover:underline">
								Privacy Policy
							</a>
						</div>
					</label>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex items-center gap-3"></div>
		</div>
	);
}
