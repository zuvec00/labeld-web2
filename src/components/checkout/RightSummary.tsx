"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useCheckoutCart, CartItem } from "@/hooks/useCheckoutCart";
import { formatCurrency } from "@/lib/checkout/calc";
import LineItemRow from "./LineItemRow";
import { Info } from "lucide-react";
import { fetchEventById } from "@/lib/firebase/queries/event";
import {
	paystackService,
	type TotalsWithLabeldFee,
	type PaymentMetadata,
} from "@/lib/payment/paystack";
// import { generateCheckoutIdempotencyKey } from "@/lib/idempotency"; // No longer needed
import { auth } from "@/lib/firebase/firebaseConfig";
import {
	shippingService,
	type VendorShippingInfo,
} from "@/lib/shipping/shippingService";

// Helper function to safely map cart items to finalize line items
function toFinalizeLine(item: CartItem) {
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
			size: item.size ?? undefined,
			color: item.color ?? undefined,
		};
	}
	throw new Error("Cart item missing required id");
}

// Helper function to compute shipping fees for all vendors
async function computeShippingFees(
	items: CartItem[],
	shippingAddress?: { state: string; city?: string }
): Promise<number> {
	if (!shippingAddress?.state) return 0;

	// Group merch items by vendorId
	const vendorItems = new Map<string, CartItem[]>();
	for (const item of items) {
		if (item._type === "merch" && item.brandId) {
			if (!vendorItems.has(item.brandId)) {
				vendorItems.set(item.brandId, []);
			}
			vendorItems.get(item.brandId)!.push(item);
		}
	}

	if (vendorItems.size === 0) return 0;

	// Get quotes for each vendor
	const vendors = Array.from(vendorItems.entries()).map(
		([vendorId, items]) => ({
			vendorId,
			items,
		})
	);

	const vendorsWithQuotes = await shippingService.quoteShippingForAllVendors(
		vendors,
		shippingAddress.state,
		shippingAddress.city
	);

	return shippingService.calculateTotalShippingFee(vendorsWithQuotes);
}

// Helper function to build stable idempotency key
function buildIdempotencyKey(
	eventId: string,
	email: string,
	lineItems: Array<{
		_type: "ticket" | "merch";
		ticketTypeId?: string;
		merchItemId?: string;
		qty: number;
		size?: string;
		color?: string;
	}>
): string {
	const canonicalItems = lineItems
		.slice()
		.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

	return [
		eventId,
		email.toLowerCase(),
		JSON.stringify(canonicalItems),
		Math.floor(Date.now() / 1000).toString(), // 1-second precision timestamp
	].join(":");
}

interface RightSummaryProps {
	eventId: string;
}

export default function RightSummary({ eventId }: RightSummaryProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { items, removeItem, contact, shipping, termsAccepted, clear } =
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
	const [vendorShipping, setVendorShipping] = useState<VendorShippingInfo[]>(
		[]
	);
	const [shippingFees, setShippingFees] = useState(0);

	// Debug log when shipping fees change
	useEffect(() => {
		console.log("🚚 RightSummary: Shipping fees state changed", {
			shippingFees,
		});
	}, [shippingFees]);

	const hasTickets = items.some(
		(item) => item._type === "ticket" && item.qty > 0
	);

	const hasMerch = items.some((item) => item._type === "merch" && item.qty > 0);

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

				// Log order type for debugging
				console.log(
					"Order type:",
					hasTickets && hasMerch ? "mixed" : hasTickets ? "tickets" : "merch"
				);

				// Build line items for finalizeOrder using helper function
				const lineItems = items.map(toFinalizeLine);

				// Compute shipping fees for the final order
				const shippingFeeMinor =
					hasMerch && shipping?.address?.state
						? await computeShippingFees(items, {
								state: shipping.address.state,
								city: shipping.address.city,
						  })
						: 0;

				console.log("💰 Final shipping fee:", shippingFeeMinor);

				// Generate stable idempotency key for this checkout attempt
				const idempotencyKey = buildIdempotencyKey(
					eventId,
					contact?.email || "",
					lineItems
				);

				// Prepare shipping info for finalizeOrder
				const shippingInfo =
					hasMerch && shipping
						? {
								method: shipping.method,
								address:
									shipping.method === "delivery"
										? {
												name: shipping.address?.name,
												phone: shipping.address?.phone,
												address: shipping.address?.address,
												city: shipping.address?.city,
												state: shipping.address?.state,
												postalCode: shipping.address?.postalCode,
										  }
										: undefined,
						  }
						: undefined;

				// Finalize order using the exact totals shown to user
				const orderId = await paystackService.finalizeOrder(
					{
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
							totalMinor:
								totals.itemsSubtotalMinor +
								totals.buyerFeesMinor +
								shippingFeeMinor,
							shippingFeeMinor, // NEW: Include shipping fee
						},
					},
					items,
					shippingInfo
				);

				// Fulfillment lines are now created automatically in finalizeOrder
				console.log("Vendor shipping info:", vendorShipping);

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
		[
			eventId,
			items,
			totals,
			contact,
			clear,
			router,
			finalizing,
			shipping,
			vendorShipping,
		]
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

	// Calculate shipping quotes when items or shipping address changes
	useEffect(() => {
		const calculateShipping = async () => {
			console.log("🚚 RightSummary: Starting shipping calculation", {
				hasMerch,
				shipping,
				itemsCount: items.length,
				merchItems: items.filter((item) => item._type === "merch"),
			});

			if (hasMerch && shipping) {
				try {
					const vendors = shippingService.getVendorsFromCart(items);
					console.log("🚚 RightSummary: Found vendors", { vendors });

					// For pickup orders, shipping fee is 0
					if (shipping.method === "pickup") {
						console.log(
							"🚚 RightSummary: Pickup method selected - setting fee to 0"
						);
						setVendorShipping(vendors);
						setShippingFees(0);
						return;
					}

					// For delivery orders, calculate shipping fees based on address
					if (shipping.method === "delivery" && shipping.address?.state) {
						console.log("🚚 RightSummary: Delivery method with address", {
							state: shipping.address.state,
							city: shipping.address.city,
							fullAddress: shipping.address,
						});

						const vendorsWithQuotes =
							await shippingService.quoteShippingForAllVendors(
								vendors,
								shipping.address.state,
								shipping.address.city
							);

						console.log("🚚 RightSummary: Got vendor quotes", {
							vendorsWithQuotes,
						});

						setVendorShipping(vendorsWithQuotes);
						const totalShippingFee =
							shippingService.calculateTotalShippingFee(vendorsWithQuotes);

						console.log("🚚 RightSummary: Calculated total shipping fee", {
							totalShippingFee,
						});
						setShippingFees(totalShippingFee);
					} else {
						// Delivery method selected but no address yet
						console.log("🚚 RightSummary: Delivery method but no address", {
							method: shipping.method,
							hasState: !!shipping.address?.state,
							address: shipping.address,
						});
						setVendorShipping(vendors);
						setShippingFees(0);
					}
				} catch (error) {
					console.error("🚚 RightSummary: Error calculating shipping:", error);
					setShippingFees(0);
				}
			} else {
				console.log("🚚 RightSummary: No merch or shipping - clearing fees", {
					hasMerch,
					hasShipping: !!shipping,
				});
				setVendorShipping([]);
				setShippingFees(0);
			}
		};

		calculateShipping();
	}, [items, shipping, hasMerch]);

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

			// If merch is in cart, also check shipping info
			if (hasMerch) {
				const hasRequiredShipping =
					shipping?.method &&
					(shipping.method === "pickup" ||
						(shipping.method === "delivery" &&
							shipping.address?.name &&
							shipping.address?.phone &&
							shipping.address?.address &&
							shipping.address?.city &&
							shipping.address?.state));
				return !hasRequiredContact || !hasRequiredShipping;
			}

			return !hasRequiredContact;
		}
		if (step === "pay") {
			// On payment step, check if terms are accepted and contact info is filled
			const hasRequiredContact = contact?.email && contact?.phone;
			const hasAcceptedTerms = termsAccepted === true;

			// If merch is in cart, also check shipping info
			if (hasMerch) {
				const hasRequiredShipping =
					shipping?.method &&
					(shipping.method === "pickup" ||
						(shipping.method === "delivery" &&
							shipping.address?.name &&
							shipping.address?.phone &&
							shipping.address?.address &&
							shipping.address?.city &&
							shipping.address?.state));

				// Debug logging
				console.log("Payment validation:", {
					hasRequiredContact,
					hasAcceptedTerms,
					hasRequiredShipping,
					hasMerch,
					shipping,
					contact,
				});

				return !hasRequiredContact || !hasAcceptedTerms || !hasRequiredShipping;
			}

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
					totals.itemsSubtotalMinor + totals.buyerFeesMinor + shippingFees, // Include shipping fees
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

				{/* Shipping Fees - Show if merch is in cart */}
				{hasMerch && (
					<div className="border-t border-stroke pt-4 mb-4">
						<div className="flex items-center justify-between text-sm mb-2">
							<div className="flex items-center gap-1 group relative">
								<span className="text-text-muted">Shipping</span>
								<Info className="w-3 h-3 text-text-muted cursor-help" />
								{/* Tooltip */}
								<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-stroke rounded-lg text-xs text-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
									{shipping?.method === "pickup"
										? "Pickup orders have no shipping fee"
										: "Shipping fees calculated based on your location"}
								</div>
							</div>
							<span className="text-text-muted">
								{(() => {
									const displayValue =
										shippingFees > 0
											? formatCurrency(shippingFees, totals.currency)
											: shipping?.method === "pickup"
											? "Free (Pickup)"
											: "Calculating...";
									console.log("🚚 RightSummary: Shipping display value", {
										shippingFees,
										shippingMethod: shipping?.method,
										displayValue,
									});
									return displayValue;
								})()}
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
							{formatCurrency(
								totals.itemsSubtotalMinor +
									totals.buyerFeesMinor +
									shippingFees,
								totals.currency
							)}
						</span>
					</div>
				</div>

				{/* Debug Info - Remove this in production */}
				{process.env.NODE_ENV === "development" && (
					<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
						<p className="text-xs text-yellow-600 font-mono">
							Debug: Contact: {JSON.stringify(contact)} | Shipping:{" "}
							{JSON.stringify(shipping)} | Terms:{" "}
							{termsAccepted ? "accepted" : "not accepted"} | Step:{" "}
							{getCurrentStep()} | Disabled: {isCtaDisabled() ? "yes" : "no"}
						</p>
					</div>
				)}

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
