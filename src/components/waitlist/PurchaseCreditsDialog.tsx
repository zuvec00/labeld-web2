"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import Button from "@/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import {
	initializeCreditPayment,
	type InitializeCreditPaymentResponse,
} from "@/lib/firebase/queries/waitlist";
import { shouldUseLiveSubscriptionPayments } from "@/lib/payment/subscriptionMode";

const CREDIT_TIERS = [
	{ credits: 1000, price: 1000, label: "1,000 Credits", priceLabel: "₦1,000" },
	{ credits: 5000, price: 4500, label: "5,000 Credits", priceLabel: "₦4,500" },
	{ credits: 10000, price: 8000, label: "10,000 Credits", priceLabel: "₦8,000" },
	{ credits: 50000, price: 37500, label: "50,000 Credits", priceLabel: "₦37,500" },
];

interface PurchaseCreditsDialogProps {
	open: boolean;
	onClose: () => void;
	brandId: string;
	email?: string | null;
}

function getPaymentUrl(response: InitializeCreditPaymentResponse): string | undefined {
	return response.data?.authorization_url || response.authorization_url;
}

export default function PurchaseCreditsDialog({
	open,
	onClose,
	brandId,
	email,
}: PurchaseCreditsDialogProps) {
	const [selectedIndex, setSelectedIndex] = useState(1);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const selectedTier = useMemo(() => CREDIT_TIERS[selectedIndex], [selectedIndex]);

	if (!open) return null;

	async function handlePurchase() {
		if (!email) {
			toast({
				variant: "destructive",
				title: "Email required",
				description: "Your account email is needed to start checkout.",
			});
			return;
		}

		setLoading(true);
		try {
			const origin = typeof window !== "undefined" ? window.location.origin : "https://labeld.studio";
			const reference = `credit_txn_${Date.now()}`;
			const result = await initializeCreditPayment({
				email,
				amount: selectedTier.price,
				reference,
				callbackUrl: `${origin}/payment/success`,
				cancelUrl: `${origin}/payment/cancel`,
				isLive: shouldUseLiveSubscriptionPayments(),
				metadata: {
					type: "credit_purchase",
					brandId,
					credits: selectedTier.credits,
					buyer_user_id: brandId,
				},
			});

			const checkoutUrl = getPaymentUrl(result.data);
			if (!checkoutUrl) throw new Error("Could not start Paystack checkout.");
			window.location.href = checkoutUrl;
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Payment failed",
				description:
					error instanceof Error ? error.message : "Unable to prepare checkout.",
			});
			setLoading(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div className="w-full max-w-lg rounded-xl border border-stroke bg-surface shadow-xl">
				<div className="flex items-start justify-between border-b border-stroke px-5 py-4">
					<div>
						<h2 className="font-unbounded text-base font-semibold text-text">
							Top Up Credits
						</h2>
						<p className="mt-1 text-sm text-text-muted">
							One credit sends one waitlist email.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-2 text-text-muted transition hover:bg-bg hover:text-text"
						aria-label="Close credit purchase dialog"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="divide-y divide-stroke">
					{CREDIT_TIERS.map((tier, index) => {
						const selected = index === selectedIndex;
						const bestValue = tier.credits === 50000;
						return (
							<button
								key={tier.credits}
								type="button"
								onClick={() => setSelectedIndex(index)}
								className={[
									"flex w-full items-center gap-4 px-5 py-4 text-left transition",
									selected
										? "bg-bg text-text"
										: "bg-surface text-text hover:bg-bg/60",
								].join(" ")}
							>
								<span
									className={[
										"flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
										selected ? "border-accent" : "border-stroke",
									].join(" ")}
								>
									{selected && <span className="h-2 w-2 rounded-full bg-accent" />}
								</span>
								<span className="min-w-0 flex-1">
									<span className="flex flex-wrap items-center gap-2 font-semibold">
										{tier.label}
										{bestValue && (
											<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
												Best value
											</span>
										)}
									</span>
									<span className="text-sm text-text-muted">
										{tier.credits < 10000 ? "For starter campaigns" : "For active audience runs"}
									</span>
								</span>
								<span className="shrink-0 text-sm font-semibold text-text">
									{tier.priceLabel}
								</span>
							</button>
						);
					})}
				</div>

				<div className="border-t border-stroke px-5 py-4">
					<Button
						type="button"
						onClick={handlePurchase}
						isLoading={loading}
						loadingText="Preparing checkout..."
						className="w-full rounded-lg"
					>
						Purchase {selectedTier.label}
					</Button>
					<div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-text-muted">
						<ShieldCheck className="h-4 w-4" />
						Secure payment via Paystack. Credits update after webhook confirmation.
					</div>
				</div>
			</div>
		</div>
	);
}
