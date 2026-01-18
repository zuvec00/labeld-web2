import React from "react";
import { ProductListingSection } from "@/lib/models/site-customization";
import { cn } from "@/lib/utils";
import { Lock, ShoppingBag } from "lucide-react";

export default function PreviewProductListing({
	section,
	products = [],
}: {
	section: ProductListingSection;
	products?: {
		id: string;
		name: string;
		price: string;
		image: string;
		discountPercent?: number | null;
		sizeOptions?: string[];
		originalPrice?: number;
	}[];
}) {
	// Generate grid classes based on column count - Scaled down for preview
	const gridCols = {
		2: "grid-cols-2",
		3: "grid-cols-2 md:grid-cols-3",
		4: "grid-cols-2 md:grid-cols-4",
	}[section.columns];

	// Determine which products to show
	const displayProducts = React.useMemo(() => {
		let chosenProducts = [...products];

		if (section.manualSelection && section.productIds?.length) {
			// Manual Selection: Filter and maintain order of selection if possible (or just filter)
			chosenProducts = chosenProducts.filter((p) =>
				section.productIds!.includes(p.id)
			);
		} else {
			// Automatic Sort
			switch (section.order) {
				case "price_asc":
					chosenProducts.sort((a, b) => {
						const priceA = parseInt(a.price.replace(/[^0-9]/g, "")) || 0;
						const priceB = parseInt(b.price.replace(/[^0-9]/g, "")) || 0;
						return priceA - priceB;
					});
					break;
				case "price_desc":
					chosenProducts.sort((a, b) => {
						const priceA = parseInt(a.price.replace(/[^0-9]/g, "")) || 0;
						const priceB = parseInt(b.price.replace(/[^0-9]/g, "")) || 0;
						return priceB - priceA;
					});
					break;
				case "random":
					chosenProducts.sort(() => Math.random() - 0.5);
					break;
				case "latest":
				default:
					// Assuming input list is already roughly "latest" or we don't have dates.
					// Keep default order.
					break;
			}
		}

		// Cap number of items based on simple heuristic or just show top 4-8 for preview
		return chosenProducts.length > 0
			? chosenProducts.slice(0, 8)
			: Array.from({ length: 4 }).map((_, i) => ({
					id: `mock-${i}`,
					name: `Signature Tee ${String(i + 1).padStart(2, "0")}`,
					price: "₦45,000",
					image: "",
					discountPercent: i === 1 ? 20 : null, // Mock discount for 2nd item
					originalPrice: 45000,
					sizeOptions: ["M", "L"],
			  }));
	}, [products, section.manualSelection, section.productIds, section.order]);

	const formatPrice = (amount: number) => {
		return `₦${amount.toLocaleString()}`;
	};

	return (
		<section className="relative w-full py-8 md:py-12 px-4 md:px-6 border-b border-dashed border-stroke/20 group bg-bg">
			{/* Required Badge */}
			<div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-surface border border-stroke text-text-muted text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
				<Lock className="w-3 h-3" />
				<span>Required Section</span>
			</div>

			<div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
				{/* Section Header */}
				<div className="text-center space-y-3 mb-6 md:mb-8">
					{section.title !== "" && (
						<h3 className="font-heading text-lg md:text-xl lg:text-2xl font-medium tracking-tight">
							{section.title ?? "Shop Collection"}
						</h3>
					)}
					{section.order && !section.manualSelection && (
						<div className="text-[10px] uppercase font-bold tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded inline-block">
							Sorted: {section.order.replace("_", " ")}
						</div>
					)}
					<div className="w-8 h-px bg-text mx-auto opacity-20" />
				</div>

				{/* Product Grid */}
				<div className={cn("grid gap-x-4 gap-y-6 md:gap-y-8", gridCols)}>
					{displayProducts.map((product) => {
						const hasDiscount =
							(product.discountPercent || 0) > 0 && product.originalPrice;
						const discountedPrice = hasDiscount
							? product.originalPrice! * (1 - product.discountPercent! / 100)
							: null;

						return (
							<div
								key={product.id}
								className="group/card space-y-3 cursor-default"
							>
								{/* Product Image */}
								<div className="aspect-[3/4] bg-surface-2 rounded-sm relative overflow-hidden group-hover/card:shadow-md transition-all duration-500">
									{product.image ? (
										<img
											src={product.image}
											alt={product.name}
											className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
										/>
									) : (
										<div className="absolute inset-0 flex items-center justify-center text-text-muted/10 group-hover/card:text-text-muted/20 transition-colors">
											<ShoppingBag className="w-8 h-8" />
										</div>
									)}
									{/* Hover Overlay */}
									<div className="absolute inset-0 bg-black/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
								</div>

								{/* Product Info & Action */}
								<div className="space-y-3 text-left">
									<div className="space-y-1">
										<p
											className="font-heading text-xs md:text-[10px] font-light text-text leading-snug mb-0.5 uppercase tracking-tight"
											style={{ fontFamily: "var(--font-unbounded)" }}
										>
											{product.name}
										</p>

										{/* Price */}
										<div className="flex items-center justify-start gap-2">
											{hasDiscount ? (
												<>
													<span className="text-xs md:text-[10px] font-bold text-text">
														{formatPrice(discountedPrice!)}
													</span>
													<span className="text-[10px] md:text-[9px] text-text-muted line-through decoration-text-muted decoration-1">
														{formatPrice(product.originalPrice!)}
													</span>
												</>
											) : (
												<p className="text-xs md:text-[10px] text-text-muted font-bold">
													{product.price}
												</p>
											)}
										</div>
									</div>

									{/* Select Options Button - Under Price */}
									<div className="w-full">
										<button className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm hover:opacity-90 transition-opacity">
											Select Options
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
