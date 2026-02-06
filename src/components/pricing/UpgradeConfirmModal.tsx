"use client";

import { useState } from "react";
import {
	startProSubscription,
	startOrganizerProSubscription,
	BillingCycle,
} from "@/lib/firebase/callables/subscriptions";
import Button from "@/components/ui/button";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	billingCycle: BillingCycle;
	priceDisplay: string; // "₦50,000"
	periodDisplay: string; // "/ year"
	mode?: "brand" | "organizer";
}

export default function UpgradeConfirmModal({
	isOpen,
	onClose,
	billingCycle,
	priceDisplay,
	periodDisplay,
	mode = "brand",
}: UpgradeConfirmModalProps) {
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const router = useRouter();

	if (!isOpen) return null;

	async function handleConfirm() {
		setStatus("loading");
		setErrorMsg(null);
		try {
			console.log("Billing Cycle: ", billingCycle);
			// Call the cloud function
			// isLive true for production
			if (mode === "organizer") {
				await startOrganizerProSubscription({ billingCycle, isLive: true });
			} else {
				await startProSubscription({ billingCycle, isLive: true });
			}

			setStatus("success");
			// Optional: Wait a bit before redirecting?
			setTimeout(() => {
				router.push(mode === "organizer" ? "/organizer-space" : "/dashboard"); // Go to dashboard to see new status
			}, 2000);
		} catch (err: any) {
			console.error("Upgrade failed:", err);
			// Explicitly log properties that might not show in the main object log
			console.log("Error Code:", err.code);
			console.log("Error Details:", err.details);
			console.log("Error Message:", err.message);

			// Handle Paystack Redirect (Missing Auth)
			// Check based on code OR if details has isRedirect (just in case code mapping varies)
			if (
				(err.code === "aborted" || err.code === "functions/aborted") &&
				err.details?.isRedirect
			) {
				console.log(
					"Redirecting to Paystack auth...",
					err.details.authorizationUrl,
				);

				if (err.details.authorizationUrl) {
					// Alert for debugging visibility as requested
					alert(`Redirecting to Paystack: ${err.details.authorizationUrl}`);
					window.location.href = err.details.authorizationUrl;
					return;
				}
			}

			setStatus("error");
			setErrorMsg(err.message || "Failed to start subscription.");
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="bg-surface border border-stroke rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-stroke">
					<h3 className="font-heading font-semibold text-xl">
						Confirm Upgrade
					</h3>
					<button
						onClick={onClose}
						disabled={status === "loading" || status === "success"}
						className="text-text-muted hover:text-text disabled:opacity-50"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* content */}
				<div className="p-6">
					{status === "success" ? (
						<div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
							<div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
								<CheckCircle2 className="w-8 h-8" />
							</div>
							<div>
								<h4 className="text-xl font-bold text-text">
									Upgrade Successful!
								</h4>
								<p className="text-text-muted mt-2">
									Your Pro subscription is active. <br />
									Redirecting you to settings...
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-6">
							{status === "error" && (
								<div className="bg-alert/10 border border-alert/20 rounded-xl p-4 flex gap-3 text-sm text-alert">
									<AlertCircle className="w-5 h-5 shrink-0" />
									<p>{errorMsg}</p>
								</div>
							)}

							<div className="bg-surface-neutral/50 rounded-xl p-4 border border-stroke space-y-3">
								<div className="flex justify-between items-center text-sm text-text-muted">
									<span>Plan</span>
									<span className="font-medium text-text">
										{mode === "organizer" ? "Event Pro" : "Labeld Pro"}
									</span>
								</div>
								<div className="flex justify-between items-center text-sm text-text-muted">
									<span>Billing Cycle</span>
									<span className="font-medium text-text capitalize">
										{billingCycle}
									</span>
								</div>
								<div className="border-t border-stroke pt-3 flex justify-between items-baseline">
									<span className="font-medium text-text">Total</span>
									<span className="text-xl font-bold font-heading text-text">
										{priceDisplay}{" "}
										<span className="text-sm font-sans font-normal text-text-muted">
											{periodDisplay}
										</span>
									</span>
								</div>
							</div>

							<p className="text-xs text-text-muted text-center leading-relaxed px-4">
								By confirming, you agree to be charged{" "}
								<strong>{priceDisplay}</strong>{" "}
								{periodDisplay.replace("/", "per ")}.
							</p>

							<div className="pt-2">
								<Button
									variant="primary"
									className="w-full h-12 text-base shadow-lg shadow-accent/20"
									text={
										status === "loading" ? "Processing..." : "Confirm & Pay"
									}
									disabled={status === "loading"}
									onClick={handleConfirm}
									leftIcon={
										status === "loading" ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : undefined
									}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
