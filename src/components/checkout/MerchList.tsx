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
	const { updateQty, addItem, items } = useCheckoutCart();

	const handleQtyChange = (
		merchItemId: string,
		qty: number,
		size?: string,
		color?: string
	) => {
		const merchItem = merchItems.find((item) => item.id === merchItemId);
		if (!merchItem) return;
		console.log(merchItem.stockRemaining);
		// Prevent adding to cart if out of stock
		if (merchItem.stockRemaining === 0) {
			console.warn(`Cannot add ${merchItem.name} to cart - out of stock`);
			return;
		}

		// Check stock limit
		if (merchItem.stockRemaining !== null && qty > merchItem.stockRemaining) {
			console.warn(
				`Cannot select more than ${merchItem.stockRemaining} items for ${merchItem.name}`
			);
			return;
		}

		const variantKey = `${size || ""}-${color || ""}`;
		const existingItem = items.find(
			(item) =>
				item._type === "merch" &&
				item.merchItemId === merchItemId &&
				`${item.size || ""}-${item.color || ""}` === variantKey
		);

		if (existingItem) {
			// Update existing item
			updateQty(
				{
					_type: "merch",
					id: merchItemId,
					variantKey: variantKey,
				},
				qty
			);
		} else {
			// Add new item to cart
			const newItem = {
				_type: "merch" as const,
				merchItemId: merchItem.id,
				name: merchItem.name,
				unitPriceMinor: merchItem.priceMinor,
				currency: merchItem.currency,
				qty: qty,
				size: size,
				color: color,
			};
			addItem(newItem);
		}
	};

	// Get current cart quantity for a merch item with specific variant
	const getCurrentQty = (
		merchItemId: string,
		size?: string,
		color?: string
	) => {
		const variantKey = `${size || ""}-${color || ""}`;
		const cartItem = items.find(
			(item) =>
				item._type === "merch" &&
				item.merchItemId === merchItemId &&
				`${item.size || ""}-${item.color || ""}` === variantKey
		);
		return cartItem?.qty || 0;
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
					getCurrentQty={getCurrentQty}
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
	getCurrentQty: (merchItemId: string, size?: string, color?: string) => number;
}

function MerchCard({ merchItem, onQtyChange, getCurrentQty }: MerchCardProps) {
	const [selectedSize, setSelectedSize] = useState<string>("");
	const [selectedColor, setSelectedColor] = useState<string>("");

	const handleQtyChange = (newQty: number) => {
		// Prevent adding to cart if out of stock
		if (isSoldOut) return;
		onQtyChange(merchItem.id, newQty, selectedSize, selectedColor);
	};

	const isSoldOut = merchItem.stockRemaining === 0;
	const isUnlimited = merchItem.stockRemaining === null;

	return (
		<div
			className={`bg-surface rounded-2xl border border-stroke p-4 transition-all duration-200 relative ${
				isSoldOut
					? "opacity-50 cursor-not-allowed"
					: "hover:border-accent/50 hover:scale-[1.01]"
			}`}
		>
			{/* Out of Stock Watermark */}
			{isSoldOut && (
				<div className="absolute inset-0 z-10 flex items-center justify-center">
					<div className="bg-red-500/90 text-white font-heading font-bold text-lg px-6 py-3 rounded-xl transform -rotate-12 shadow-lg">
						OUT OF STOCK
					</div>
				</div>
			)}

			{/* Image */}
			<div className="aspect-square bg-stroke rounded-lg mb-4 overflow-hidden relative">
				{merchItem.images[0] && (
					<img
						src={merchItem.images[0].url}
						alt={merchItem.images[0].alt || merchItem.name}
						className={`w-full h-full object-cover ${
							isSoldOut ? "grayscale" : ""
						}`}
					/>
				)}
				{isSoldOut && <div className="absolute inset-0 bg-black/30"></div>}
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
								onClick={() => !isSoldOut && setSelectedSize(size)}
								disabled={isSoldOut}
								className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
									isSoldOut
										? "border-stroke/50 text-text-muted/50 cursor-not-allowed"
										: selectedSize === size
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
								onClick={() => !isSoldOut && setSelectedColor(color)}
								disabled={isSoldOut}
								className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
									isSoldOut
										? "border-stroke/50 text-text-muted/50 cursor-not-allowed"
										: selectedColor === color
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
				<p
					className={`text-xs mb-3 ${
						isSoldOut ? "text-red-400 font-medium" : "text-text-muted"
					}`}
				>
					{isSoldOut ? "Sold out" : `${merchItem.stockRemaining} remaining`}
				</p>
			)}

			{/* Quantity Selector */}
			<div className="flex justify-center">
				{isSoldOut ? (
					<span className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium">
						Sold Out
					</span>
				) : (
					<QtySelector
						value={getCurrentQty(merchItem.id, selectedSize, selectedColor)}
						onChange={handleQtyChange}
						max={merchItem.stockRemaining || undefined}
						disabled={
							isSoldOut ||
							(merchItem.sizeOptions &&
								merchItem.sizeOptions.length > 0 &&
								!selectedSize) ||
							(merchItem.colorOptions &&
								merchItem.colorOptions.length > 0 &&
								!selectedColor)
						}
					/>
				)}
			</div>

			{/* Variant Selection Required Message */}
			{!isSoldOut &&
				((merchItem.sizeOptions &&
					merchItem.sizeOptions.length > 0 &&
					!selectedSize) ||
					(merchItem.colorOptions &&
						merchItem.colorOptions.length > 0 &&
						!selectedColor)) && (
					<p className="text-xs text-text-muted text-center mt-2">
						Please select{" "}
						{merchItem.sizeOptions &&
						merchItem.sizeOptions.length > 0 &&
						!selectedSize
							? "size"
							: ""}
						{merchItem.sizeOptions &&
						merchItem.sizeOptions.length > 0 &&
						!selectedSize &&
						merchItem.colorOptions &&
						merchItem.colorOptions.length > 0 &&
						!selectedColor
							? " and "
							: ""}
						{merchItem.colorOptions &&
						merchItem.colorOptions.length > 0 &&
						!selectedColor
							? "color"
							: ""}
					</p>
				)}
		</div>
	);
}
