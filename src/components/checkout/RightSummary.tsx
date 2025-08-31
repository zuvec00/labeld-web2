"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import { calcTotals, formatCurrency } from "@/lib/checkout/calc";
import LineItemRow from "./LineItemRow";
import { Info } from "lucide-react";

interface RightSummaryProps {
	eventId: string;
}

export default function RightSummary({ eventId }: RightSummaryProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { items, removeItem } = useCheckoutCart();

	const totals = calcTotals(items);
	const hasTickets = items.some(
		(item) => item._type === "ticket" && item.qty > 0
	);

	const getCurrentStep = () => {
		if (pathname.includes("/tickets")) return "tickets";
		if (pathname.includes("/merch")) return "merch";
		if (pathname.includes("/contact")) return "contact";
		if (pathname.includes("/pay")) return "pay";
		return "tickets";
	};

	const getCtaLabel = () => {
		const step = getCurrentStep();
		switch (step) {
			case "tickets":
				return "Continue → Merch";
			case "merch":
				return "Continue → Contact";
			case "contact":
				return "Continue → Pay";
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
			default:
				return `/buy/${eventId}/tickets`;
		}
	};

	const isCtaDisabled = () => {
		const step = getCurrentStep();
		if (step === "tickets") {
			return !hasTickets;
		}
		return false;
	};

	const handleContinue = () => {
		if (isCtaDisabled()) return;
		router.push(getNextStep());
	};

	return (
		<div className="bg-surface rounded-2xl border border-stroke p-6 max-h-[80vh] overflow-auto">
			<h2 className="text-lg font-heading font-semibold mb-4">Summary</h2>

			{/* Event Title */}
			<h3 className="text-sm font-medium text-text mb-4">
				The Nolly Trivia: September Edition
			</h3>

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

			{/* Fee Breakdown */}
			{items.length > 0 && (
				<div className="border-t border-stroke pt-4 mb-4">
					<div className="flex items-center justify-between text-sm mb-2">
						<div className="flex items-center gap-1">
							<span className="text-text-muted">Fees</span>
							<Info className="w-3 h-3 text-text-muted" />
						</div>
						<span className="text-text-muted">
							{formatCurrency(
								totals.breakdown.platformFeeMinor +
									totals.breakdown.paymentFeeMinor,
								totals.currency
							)}
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
						{formatCurrency(totals.totalMinor, totals.currency)}
					</span>
				</div>
			</div>

			{/* CTA Button */}
			<button
				onClick={handleContinue}
				disabled={isCtaDisabled()}
				className="w-full bg-cta hover:bg-cta/90 disabled:bg-stroke disabled:text-text-muted text-black font-heading font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
			>
				{getCtaLabel()}
			</button>
		</div>
	);
}
