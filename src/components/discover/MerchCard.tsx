import { ShoppingBag } from "lucide-react";
import { useState } from "react";

interface Merch {
	id: string;
	name: string;
	priceMinor: number;
	currency: "NGN" | "USD";
	stockTotal: number | null;
	stockRemaining: number | null;
	images: { url: string; alt?: string }[];
	isActive: boolean;
	visibility?: "public" | "hidden";
	createdAt?: any; // Firestore Timestamp
}

interface MerchCardProps {
	merch: Merch;
	compact?: boolean;
}

export default function MerchCard({ merch, compact = false }: MerchCardProps) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isHovering, setIsHovering] = useState(false);
	const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

	const formatPrice = (priceMinor: number, currency: string) => {
		const price = priceMinor / 100; // Convert from kobo/cents
		return `${currency === "NGN" ? "₦" : "$"}${price.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	};

	const getStockColor = (
		stockRemaining: number | null,
		stockTotal: number | null
	) => {
		if (stockRemaining === null || stockTotal === null) return "text-green-400"; // Unlimited
		if (stockRemaining === 0) return "text-red-400"; // Out of stock
		if (stockRemaining <= stockTotal * 0.2) return "text-yellow-400"; // Limited
		return "text-green-400"; // In stock
	};

	const getStockText = (
		stockRemaining: number | null,
		stockTotal: number | null
	) => {
		if (stockRemaining === null || stockTotal === null) return "In Stock";
		if (stockRemaining === 0) return "Out of Stock";
		if (stockRemaining <= stockTotal * 0.2) return "Limited";
		return "In Stock";
	};

	// Auto-advance images on hover if there are multiple images
	const handleMouseEnter = () => {
		if (merch.images && merch.images.length > 1) {
			setIsHovering(true);
			const interval = setInterval(() => {
				setCurrentImageIndex((prev) =>
					prev === merch.images.length - 1 ? 0 : prev + 1
				);
			}, 1500); // Change image every 1.5 seconds

			setIntervalId(interval);
		}
	};

	const handleMouseLeave = () => {
		setIsHovering(false);
		setCurrentImageIndex(0); // Reset to first image

		// Clear the interval
		if (intervalId) {
			clearInterval(intervalId);
			setIntervalId(null);
		}
	};

	return (
		<div
			className={`group cursor-pointer ${compact ? "w-64" : "w-80"}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<div className="bg-surface rounded-2xl border border-stroke overflow-hidden hover:border-[#C6FF00]/50 hover:shadow-[0_0_20px_rgba(198,255,0,0.2)] transition-all duration-300">
				{/* Product image placeholder */}
				<div className="aspect-[3/4] bg-gray-800 relative">
					{merch.images && merch.images.length > 0 ? (
						<img
							src={merch.images[currentImageIndex].url}
							alt={merch.images[currentImageIndex].alt || merch.name}
							className="w-full h-full object-cover transition-opacity duration-500"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-500">
							<span className="text-sm">No Image</span>
						</div>
					)}

					{/* Image indicator dots if multiple images */}
					{merch.images && merch.images.length > 1 && (
						<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
							{merch.images.map((_, index) => (
								<div
									key={index}
									className={`w-2 h-2 rounded-full transition-all duration-300 ${
										index === currentImageIndex ? "bg-white" : "bg-white/50"
									}`}
								/>
							))}
						</div>
					)}

					<div className="absolute top-4 right-4">
						<div className="bg-black/50 rounded-full p-2">
							<ShoppingBag className="h-4 w-4 text-white" />
						</div>
					</div>
				</div>

				{/* Product info */}
			</div>
			<div className="p-4">
				<h3 className="text-text font-unbounded font-normal text-lg mb-2 line-clamp-2">
					{merch.name}
				</h3>
				<div className="flex items-center justify-between">
					<span className="text-text font-bold text-lg">
						{formatPrice(merch.priceMinor, merch.currency)}
					</span>
					<span
						className={`text-sm font-medium ${getStockColor(
							merch.stockRemaining,
							merch.stockTotal
						)}`}
					>
						{getStockText(merch.stockRemaining, merch.stockTotal)}
					</span>
				</div>
			</div>
		</div>
	);
}
