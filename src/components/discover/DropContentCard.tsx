"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DropStatusCapsule from "@/components/brand/brandspace/DropStatusCapsule";
import { fetchBrandById } from "@/lib/firebase/queries/brandspace";
import { BrandModel } from "@/lib/models/brand";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface DropContentCardProps {
	dropContent: {
		id: string;
		brandId: string;
		teaserImageUrl: string;
		momentName?: string | null;
		momentDescription?: string | null;
		launchDate?: Date | null;
		reactions?: Record<string, number>;
	};
	compact?: boolean;
}

export default function DropContentCard({
	dropContent,
	compact = false,
}: DropContentCardProps) {
	const router = useRouter();
	const [imageError, setImageError] = useState(false);
	const [brand, setBrand] = useState<BrandModel | null>(null);
	const [brandLoading, setBrandLoading] = useState(true);

	// Fetch brand data
	useEffect(() => {
		async function fetchBrand() {
			try {
				setBrandLoading(true);
				const brandData = await fetchBrandById(dropContent.brandId);
				setBrand(brandData);
			} catch (error) {
				console.error("Error fetching brand:", error);
			} finally {
				setBrandLoading(false);
			}
		}

		if (dropContent.brandId) {
			fetchBrand();
		}
	}, [dropContent.brandId]);

	const handleClick = () => {
		// Navigate to the drop content detail page
		// router.push(`/brand-space/feed/${dropContent.id}`);
	};

	return (
		<div className={`${compact ? "w-64" : "w-80"}`}>
			<div className="group cursor-pointer" onClick={handleClick}>
				<div className="relative aspect-[4/5] bg-surface rounded-2xl overflow-hidden border border-stroke hover:border-accent transition-all duration-300 hover:shadow-glow">
					{/* Teaser Image */}
					{dropContent.teaserImageUrl && !imageError ? (
						<OptimizedImage
							src={dropContent.teaserImageUrl}
							alt={dropContent.momentName || "Drop content"}
							fill
							sizeContext="card"
							objectFit="cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-500">
							<span className="text-lg">No Image</span>
						</div>
					)}

					{/* Drop Status Capsule */}
					{dropContent.launchDate && (
						<div className="absolute top-3 left-3">
							<DropStatusCapsule
								launchDate={dropContent.launchDate}
								shortText={false}
							/>
						</div>
					)}

					{/* Content Overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
						<div className="absolute bottom-0 left-0 right-0 p-4">
							{dropContent.momentName && (
								<h3 className="text-white font-heading font-semibold text-lg mb-1">
									{dropContent.momentName}
								</h3>
							)}
							{dropContent.momentDescription && (
								<p className="text-gray-200 text-sm font-manrope line-clamp-2">
									{dropContent.momentDescription}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Brand Information */}
			{brand && (
				<div className="flex items-center justify-between mt-3">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 relative">
							{brand.logoUrl ? (
								<OptimizedImage
									src={brand.logoUrl}
									alt={brand.brandName}
									fill
									sizeContext="thumbnail"
									objectFit="cover"
								/>
							) : (
								<div className="w-full h-full bg-stroke flex items-center justify-center">
									<span className="text-xs text-text-muted">?</span>
								</div>
							)}
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-text-muted truncate">
								{brand.brandName}
							</p>
						</div>
					</div>

					{/* Fire Reaction Count */}
					<div className="flex items-center gap-1 flex-shrink-0">
						<span className="text-lg">🔥</span>
						<span className="text-sm font-medium text-text-muted">
							{dropContent.reactions?.["🔥"] || 0}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
