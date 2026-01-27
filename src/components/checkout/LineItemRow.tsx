"use client";

import { CartItem } from "@/hooks/useCheckoutCart";
import { formatCurrency } from "@/lib/checkout/calc";

interface LineItemRowProps {
	item: CartItem;
	onRemove?: () => void;
}

export default function LineItemRow({ item, onRemove }: LineItemRowProps) {
	const subtotal = item.unitPriceMinor * item.qty;

	// Calculate transferable fee if applicable
	// TODO: Move fee calculation to backend/server to prevent tampering
	const transferableFee =
		item._type === "ticket" && item.transferFeesToGuest
			? Math.round(subtotal * 0.06) + 10000 // 6% + ₦100
			: 0;

	const totalForItem = subtotal + transferableFee;

	return (
		<div className="flex items-center justify-between py-2">
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-text truncate">
						{item.qty} × {item.name}
					</span>
					{item._type === "ticket" && item.admitType && (
						<span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
							{item.admitType.toUpperCase()}
						</span>
					)}
					{item._type === "merch" && (item.size || item.color) && (
						<span className="text-xs px-2 py-1 rounded-full bg-surface border border-stroke text-text-muted">
							{[
								item.size,
								typeof item.color === "object"
									? (item.color as any).label
									: item.color,
							]
								.filter(Boolean)
								.join(" / ")}
						</span>
					)}
				</div>
				{item._type === "ticket" && item.groupSize && (
					<p className="text-xs text-text-muted mt-1">
						Group ticket ({item.groupSize} people)
					</p>
				)}
			</div>

			<div className="flex items-center gap-2 ml-4">
				<span className="text-sm font-medium text-text">
					{formatCurrency(totalForItem, item.currency)}
				</span>
				{onRemove && (
					<button
						onClick={onRemove}
						className="text-text-muted hover:text-text transition-colors"
					>
						<svg
							className="w-4 h-4"
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
				)}
			</div>
		</div>
	);
}
