"use client";

import { TicketTypeDoc } from "@/hooks/useTicketTypes";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import { formatCurrency } from "@/lib/checkout/calc";
import QtySelector from "./QtySelector";

interface TicketListProps {
	ticketTypes: TicketTypeDoc[];
	loading?: boolean;
}

export default function TicketList({
	ticketTypes,
	loading = false,
}: TicketListProps) {
	const { updateQty } = useCheckoutCart();

	const handleQtyChange = (ticketTypeId: string, qty: number) => {
		const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
		if (!ticketType) return;

		updateQty({ _type: "ticket", id: ticketTypeId }, qty);
	};

	if (loading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="bg-surface rounded-2xl border border-stroke p-6 animate-pulse"
					>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="h-4 bg-stroke rounded mb-2 w-3/4"></div>
								<div className="h-3 bg-stroke rounded w-1/2"></div>
							</div>
							<div className="w-24 h-10 bg-stroke rounded"></div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{ticketTypes.map((ticketType) => {
				const isSoldOut = ticketType.quantityRemaining === 0;
				const isUnlimited = ticketType.quantityRemaining === null;

				return (
					<div
						key={ticketType.id}
						className="bg-surface rounded-2xl border border-stroke p-6 hover:border-accent/50 hover:scale-[1.01] transition-all duration-200"
					>
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								{/* Ticket Name and Type */}
								<div className="flex items-center gap-2 mb-2">
									<h3 className="text-lg font-heading font-semibold text-text">
										{ticketType.name}
									</h3>
									{ticketType.kind === "group" && (
										<span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
											Group ticket
										</span>
									)}
									{ticketType.admitType && (
										<span className="text-xs px-2 py-1 rounded-full bg-surface border border-stroke text-text-muted">
											{ticketType.admitType.toUpperCase()}
										</span>
									)}
								</div>

								{/* Description */}
								{ticketType.description && (
									<p className="text-sm text-text-muted mb-3">
										{ticketType.description}
									</p>
								)}

								{/* Price */}
								{ticketType.price && (
									<p className="text-sm text-text-muted">
										{formatCurrency(ticketType.price, ticketType.currency)}{" "}
										includes{" "}
										{formatCurrency(
											ticketType.price * 0.064,
											ticketType.currency
										)}{" "}
										fee
									</p>
								)}

								{/* Stock Info */}
								{!isUnlimited && (
									<p className="text-xs text-text-muted mt-2">
										{isSoldOut
											? "Sold out"
											: `${ticketType.quantityRemaining} remaining`}
									</p>
								)}
							</div>

							{/* Quantity Selector or Sold Out */}
							<div className="ml-4 flex-shrink-0">
								{isSoldOut ? (
									<span className="px-4 py-2 bg-stroke text-text-muted rounded-lg text-sm font-medium">
										Sold Out
									</span>
								) : (
									<QtySelector
										value={0} // TODO: Get current cart quantity
										onChange={(qty) => handleQtyChange(ticketType.id, qty)}
										max={ticketType.quantityRemaining || undefined}
										disabled={isSoldOut}
									/>
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
