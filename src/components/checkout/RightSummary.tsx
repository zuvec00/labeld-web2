"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import { formatCurrency } from "@/lib/checkout/calc";
import LineItemRow from "./LineItemRow";
import { Info } from "lucide-react";
import { fetchEventById } from "@/lib/firebase/queries/event";
import {
	paystackService,
	type TotalsWithLabeldFee,
	type FinalizeOrderPayload,
	type PaymentMetadata,
} from "@/lib/payment/paystack";
import { generateCheckoutIdempotencyKey } from "@/lib/idempotency";
import { auth } from "@/lib/firebase/firebaseConfig";

// Helper function to safely map cart items to finalize line items
function toFinalizeLine(item: any) {
	if (item._type === "ticket" && item.ticketTypeId) {
		return {
			_type: "ticket" as const,
			ticketTypeId: item.ticketTypeId,
			qty: item.qty,
		};
	}
	if (item._type === "merch" && item.merchItemId) {
		return {
			_type: "merch" as const,
			merchItemId: item.merchItemId,
			qty: item.qty,
			variantKey: item.variantKey,
		};
	}
	throw new Error("Cart item missing required id");
}

interface RightSummaryProps {
	eventId: string;
}

export default function RightSummary({ eventId }: RightSummaryProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { items, removeItem, contact, termsAccepted, clear } =
		useCheckoutCart();
	const [eventName, setEventName] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [totals, setTotals] = useState<TotalsWithLabeldFee>({
		currency: "NGN",
		itemsSubtotalMinor: 0,
		buyerFeesMinor: 0,
		absorbedFeesMinor: 0,
		totalDueMinor: 0,
		lines: [],
	});
	const [finalizing, setFinalizing] = useState(false);

	const hasTickets = items.some(
		(item) => item._type === "ticket" && item.qty > 0
	);

	// Payment handlers
	const handlePaymentSuccess = useCallback(
		async (response: { reference: string }) => {
			if (finalizing) return;
			setFinalizing(true);

			try {
				setIsProcessing(true);

				// Determine order type
				const hasTickets = items.some((item) => item._type === "ticket");
				const hasMerch = items.some((item) => item._type === "merch");
				const orderType: "tickets" | "merch" | "mixed" =
					hasTickets && hasMerch ? "mixed" : hasTickets ? "tickets" : "merch";

				// Build line items for finalizeOrder using helper function
				const lineItems = items.map(toFinalizeLine);

				// Generate stable idempotency key for this checkout attempt
				const idempotencyKey = generateCheckoutIdempotencyKey(
					eventId,
					contact?.email || "",
					items
				);

				// Finalize order using the exact totals shown to user
				const orderId = await paystackService.finalizeOrder({
					idempotencyKey,
					eventId,
					buyerUserId: auth.currentUser?.uid || null, // Guest user for now
					deliverTo: {
						email: contact?.email || "",
						phone: contact?.phone,
					},
					provider: "paystack",
					providerRef: {
						initRef: response.reference,
						verifyRef: response.reference,
					},
					lineItems,
					clientTotals: {
						currency: totals.currency,
						itemsSubtotalMinor: totals.itemsSubtotalMinor,
						feesMinor: totals.buyerFeesMinor, // Use buyer fees
						totalMinor: totals.totalDueMinor, // Items + buyer fees
					},
				});

				// Clear cart and redirect to success
				clear();
				router.push(`/buy/${eventId}/success?orderId=${orderId}`);
			} catch (err) {
				console.error("Order finalization failed:", err);
				setError(
					"Payment succeeded but order could not be finalized. Please contact support."
				);
				setIsProcessing(false);
			} finally {
				setFinalizing(false);
			}
		},
		[eventId, items, totals, contact, clear, router, finalizing]
	);

	const handlePaymentClose = useCallback(() => {
		setIsProcessing(false);
		setError("Payment was cancelled. You can try again.");
	}, []);

	const handlePaymentError = useCallback((errorMessage: string) => {
		setIsProcessing(false);
		setError(errorMessage);
	}, []);

	// Fetch event data
	useEffect(() => {
		const fetchEvent = async () => {
			if (!eventId) return;
			try {
				setLoading(true);
				const event = await fetchEventById(eventId);
				if (event) {
					setEventName(event.title || "Event");
				}
			} catch (error) {
				console.error("Error fetching event:", error);
				setEventName("Event");
			} finally {
				setLoading(false);
			}
		};

		fetchEvent();
	}, [eventId]);

	// Calculate totals when items change
	useEffect(() => {
		const calculateTotals = async () => {
			if (items.length > 0) {
				try {
					const calculatedTotals = await paystackService.calculateFees(items);
					setTotals(calculatedTotals);
				} catch (error) {
					console.error("Error calculating totals:", error);
				}
			} else {
				setTotals({
					currency: "NGN",
					itemsSubtotalMinor: 0,
					buyerFeesMinor: 0,
					absorbedFeesMinor: 0,
					totalDueMinor: 0,
					lines: [],
				});
			}
		};

		calculateTotals();
	}, [items]);

	const getCurrentStep = () => {
		if (pathname.includes("/tickets")) return "tickets";
		if (pathname.includes("/merch")) return "merch";
		if (pathname.includes("/contact")) return "contact";
		if (pathname.includes("/pay")) return "pay";
		return "tickets";
	};

	const getCtaLabel = () => {
		const step = getCurrentStep();
		if (isProcessing) {
			return "Processing...";
		}
		switch (step) {
			case "tickets":
				return "Continue → Merch";
			case "merch":
				return "Continue → Contact";
			case "contact":
				return "Continue → Pay";
			case "pay":
				return "Checkout";
			default:
				return "Continue";
		}
	};

	const getNextStep = () => {
		const step = getCurrentStep();
		switch (step) {
			case "tickets":
				return `/buy/${eventId}/merch`;
			case "merch":
				return `/buy/${eventId}/contact`;
			case "contact":
				return `/buy/${eventId}/pay`;
			case "pay":
				return `/buy/${eventId}/success?orderId=ord_demo_123`;
			default:
				return `/buy/${eventId}/tickets`;
		}
	};

	const isCtaDisabled = () => {
		const step = getCurrentStep();
		if (step === "tickets") {
			return !hasTickets;
		}
		if (step === "contact") {
			// Check if required contact fields are filled
			const hasRequiredContact = contact?.email && contact?.phone;
			return !hasRequiredContact;
		}
		if (step === "pay") {
			// On payment step, check if terms are accepted and contact info is filled
			const hasRequiredContact = contact?.email && contact?.phone;
			const hasAcceptedTerms = termsAccepted === true;
			return !hasRequiredContact || !hasAcceptedTerms;
		}
		return false;
	};

	const handleContinue = async () => {
		if (isCtaDisabled()) return;

		const step = getCurrentStep();
		if (step === "pay") {
			// Handle payment on payment step
			try {
				setError(null);
				setIsProcessing(true);

				if (!contact?.email) {
					throw new Error("Email is required for payment");
				}

				const customerName =
					`${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
					"Guest";
				const phone = contact.phone || "";

				const metadata: PaymentMetadata = {
					eventId,
					customerName,
					phone,
					orderType:
						items.some((item) => item._type === "ticket") &&
						items.some((item) => item._type === "merch")
							? "mixed"
							: items.some((item) => item._type === "ticket")
							? "tickets"
							: "merch",
				};

				// Initialize Paystack payment
				await paystackService.initializePayment(
					totals.totalDueMinor, // Convert from minor units (kobo) to major units (naira)
					contact.email,
					metadata,
					handlePaymentSuccess,
					handlePaymentClose,
					handlePaymentError
				);
			} catch (err) {
				console.error("Checkout failed:", err);
				setError(err instanceof Error ? err.message : "Checkout failed");
				setIsProcessing(false);
			}
			return;
		}

		router.push(getNextStep());
	};

	return (
		<div>
			<h1 className="text-xl font-heading font-semibold mb-4">Summary</h1>
			<div className="bg-surface rounded-2xl border border-stroke p-6 max-h-[80vh] overflow-auto">
				{/* Event Title */}
				<h2 className="text-lg font-medium text-center text-text mb-4">
					{loading ? "Loading..." : eventName}
				</h2>

				{/* Line Items */}
				<div className="space-y-2 mb-6">
					{items.length === 0 ? (
						<p className="text-sm text-text-muted py-4 text-center">
							No items selected
						</p>
					) : (
						items.map((item, index) => (
							<LineItemRow
								key={`${item._type}-${
									item._type === "ticket" ? item.ticketTypeId : item.merchItemId
								}-${index}`}
								item={item}
								onRemove={() => {
									const variantKey =
										item._type === "merch"
											? `${item.size || ""}-${item.color || ""}`
											: undefined;
									removeItem({
										_type: item._type,
										id:
											item._type === "ticket"
												? item.ticketTypeId
												: item.merchItemId,
										variantKey,
									});
								}}
							/>
						))
					)}
				</div>

				{/* Fee Breakdown - Only show when transferFeesToGuest is true */}
				{items.length > 0 &&
					items.some(
						(item) => item._type === "ticket" && item.transferFeesToGuest
					) && (
						<div className="border-t border-stroke pt-4 mb-4">
							<div className="flex items-center justify-between text-sm mb-2">
								<div className="flex items-center gap-1 group relative">
									<span className="text-text-muted"> Fee</span>
									<Info className="w-3 h-3 text-text-muted cursor-help" />
									{/* Tooltip */}
									<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-stroke rounded-lg text-xs text-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
										Non-refundable fee
									</div>
								</div>
								<span className="text-text-muted">
									{formatCurrency(totals.buyerFeesMinor, totals.currency)}
								</span>
							</div>
						</div>
					)}

				{/* Subtotal */}
				{items.length > 0 && (
					<div className="border-t border-stroke pt-4 mb-4">
						<div className="flex items-center justify-between text-sm mb-2">
							<span className="text-text-muted">Subtotal</span>
							<span className="font-medium">
								{formatCurrency(totals.itemsSubtotalMinor, totals.currency)}
							</span>
						</div>
					</div>
				)}

				{/* Discount Message */}
				<div className="bg-surface/50 rounded-lg p-3 mb-4">
					<p className="text-xs text-text-muted">
						Discount codes are now added at the payment step.
					</p>
				</div>

				{/* Total */}
				<div className="border-t border-stroke pt-4 mb-6">
					<div className="flex items-center justify-between">
						<span className="text-lg font-heading font-semibold">Total</span>
						<span className="text-lg font-heading font-semibold">
							{formatCurrency(totals.totalDueMinor, totals.currency)}
						</span>
					</div>
				</div>

				{/* Error Display */}
				{error && (
					<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
						<p className="text-sm text-red-500">{error}</p>
						<button
							onClick={() => setError(null)}
							className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* CTA Button */}
				<button
					onClick={handleContinue}
					disabled={isCtaDisabled() || isProcessing}
					className="w-full bg-cta hover:bg-cta/90 disabled:bg-stroke disabled:text-text-muted text-black font-heading font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
				>
					{getCtaLabel()}
				</button>
			</div>
		</div>
	);
}
