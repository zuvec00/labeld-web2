"use client";

import { useState } from "react";
import { MerchItemDoc } from "@/hooks/useMerchForEvent";
import { useCheckoutCart } from "@/hooks/useCheckoutCart";
import { formatCurrency } from "@/lib/checkout/calc";
import QtySelector from "./QtySelector";

interface MerchListProps {
	merchItems: MerchItemDoc[];
	loading?: boolean;
}

export default function MerchList({
	merchItems,
	loading = false,
}: MerchListProps) {
	const { updateQty } = useCheckoutCart();

	const handleQtyChange = (
		merchItemId: string,
		qty: number,
		size?: string,
		color?: string
	) => {
		updateQty(
			{
				_type: "merch",
				id: merchItemId,
				variantKey: `${size || ""}-${color || ""}`,
			},
			qty
		);
	};

	if (loading) {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div
						key={i}
						className="bg-surface rounded-2xl border border-stroke p-4 animate-pulse"
					>
						<div className="aspect-square bg-stroke rounded-lg mb-4"></div>
						<div className="h-4 bg-stroke rounded mb-2"></div>
						<div className="h-3 bg-stroke rounded w-1/2 mb-4"></div>
						<div className="w-24 h-8 bg-stroke rounded"></div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{merchItems.map((merchItem) => (
				<MerchCard
					key={merchItem.id}
					merchItem={merchItem}
					onQtyChange={handleQtyChange}
				/>
			))}
		</div>
	);
}

interface MerchCardProps {
	merchItem: MerchItemDoc;
	onQtyChange: (
		merchItemId: string,
		qty: number,
		size?: string,
		color?: string
	) => void;
}

function MerchCard({ merchItem, onQtyChange }: MerchCardProps) {
	const [selectedSize, setSelectedSize] = useState<string>("");
	const [selectedColor, setSelectedColor] = useState<string>("");
	const [qty, setQty] = useState(0);

	const handleQtyChange = (newQty: number) => {
		setQty(newQty);
		onQtyChange(merchItem.id, newQty, selectedSize, selectedColor);
	};

	const isSoldOut = merchItem.stockRemaining === 0;
	const isUnlimited = merchItem.stockRemaining === null;

	return (
		<div className="bg-surface rounded-2xl border border-stroke p-4 hover:border-accent/50 hover:scale-[1.01] transition-all duration-200">
			{/* Image */}
			<div className="aspect-square bg-stroke rounded-lg mb-4 overflow-hidden">
				{merchItem.images[0] && (
					<img
						src={merchItem.images[0].url}
						alt={merchItem.images[0].alt || merchItem.name}
						className="w-full h-full object-cover"
					/>
				)}
			</div>

			{/* Name */}
			<h3 className="text-lg font-heading font-semibold text-text mb-2">
				{merchItem.name}
			</h3>

			{/* Price */}
			<p className="text-sm font-medium text-text mb-4">
				{formatCurrency(merchItem.priceMinor, merchItem.currency)}
			</p>

			{/* Size Options */}
			{merchItem.sizeOptions && merchItem.sizeOptions.length > 0 && (
				<div className="mb-3">
					<label className="block text-xs font-medium text-text-muted mb-2">
						Size
					</label>
					<div className="flex flex-wrap gap-2">
						{merchItem.sizeOptions.map((size) => (
							<button
								key={size}
								onClick={() => setSelectedSize(size)}
								className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
									selectedSize === size
										? "border-accent bg-accent/20 text-accent"
										: "border-stroke text-text-muted hover:border-accent/50"
								}`}
							>
								{size}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Color Options */}
			{merchItem.colorOptions && merchItem.colorOptions.length > 0 && (
				<div className="mb-4">
					<label className="block text-xs font-medium text-text-muted mb-2">
						Color
					</label>
					<div className="flex flex-wrap gap-2">
						{merchItem.colorOptions.map((color) => (
							<button
								key={color}
								onClick={() => setSelectedColor(color)}
								className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
									selectedColor === color
										? "border-accent bg-accent/20 text-accent"
										: "border-stroke text-text-muted hover:border-accent/50"
								}`}
							>
								{color}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Stock Info */}
			{!isUnlimited && (
				<p className="text-xs text-text-muted mb-3">
					{isSoldOut ? "Sold out" : `${merchItem.stockRemaining} remaining`}
				</p>
			)}

			{/* Quantity Selector */}
			<div className="flex justify-center">
				{isSoldOut ? (
					<span className="px-4 py-2 bg-stroke text-text-muted rounded-lg text-sm font-medium">
						Sold Out
					</span>
				) : (
					<QtySelector
						value={qty}
						onChange={handleQtyChange}
						max={merchItem.stockRemaining || undefined}
						disabled={isSoldOut}
					/>
				)}
			</div>
		</div>
	);
}
