"use client";

import { useEffect, useState, use } from "react";
// import { useRouter } from "next/navigation";
import DropStatusCapsule from "@/components/brand/brandspace/DropStatusCapsule";
import { Spinner } from "@/components/ui/spinner";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
	DropContent,
	fetchBrandById,
	fetchDropContentById,
	fetchProductById,
	Product,
} from "@/lib/firebase/queries/brandspace";
import { BrandModel } from "@/lib/models/brand";

export default function FeedDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	//const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [content, setContent] = useState<DropContent | null>(null);
	const [product, setProduct] = useState<Product | null>(null);
	const [brand, setBrand] = useState<BrandModel | null>(null);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const c = await fetchDropContentById(id);
				if (!mounted) return;
				if (!c) {
					setErr("Content not found");
					setLoading(false);
					return;
				}
				setContent(c);

				const [p, b] = await Promise.all([
					c.dropProductId
						? fetchProductById(c.dropProductId)
						: Promise.resolve(null),
					fetchBrandById(c.brandId),
				]);
				if (!mounted) return;
				setProduct(p);
				setBrand(b);
				setErr(null);
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [id]);

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}
	if (err || !content) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<div className="text-center">
					<p className="text-text-muted">{err ?? "Not found"}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
			{/* Top visual (rounded-20) with capsule bottom-left */}
			<div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
				<OptimizedImage
					src={content.teaserImageUrl}
					alt={content.momentName ?? "Drop content"}
					fill
					priority
					sizeContext="hero"
					objectFit="cover"
				/>
				<div className="absolute left-3 bottom-3 z-10">
					<DropStatusCapsule launchDate={product?.launchDate ?? null} />
				</div>
			</div>

			{/* Reactions + (right-side CTA omitted as per “always brand content”) */}
			<div className="mt-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					{/* 🔥 count only (toggle later if you want) */}
					<div className="flex items-center gap-2">
						<span className="text-2xl">🔥</span>
						<span className="font-medium text-base">
							{(content.reactions?.["🔥"] ?? 0).toString()}
						</span>
					</div>
				</div>
				{/* Right side left blank for brand-view */}
				<div />
			</div>

			{/* Body copy */}
			<div className="mt-6">
				{/* Brand logo/name (if you want it like Flutter when viewer ≠ brand, keep it simple here) */}
				{brand && (
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 relative rounded-md overflow-hidden">
							<OptimizedImage
								src={brand.logoUrl}
								alt={brand.brandName}
								fill
								sizeContext="thumbnail"
								objectFit="cover"
							/>
						</div>
						<div>
							<div className="font-medium">{brand.brandName}</div>
							<div className="text-text-muted text-sm">@{brand.username}</div>
						</div>
					</div>
				)}

				{content.momentName ? (
					<div className="mb-2 font-heading font-semibold text-lg">
						{content.momentName}
					</div>
				) : null}

				{content.momentDescription ? (
					<p className="text-base">{content.momentDescription}</p>
				) : null}

				<hr className="my-6 border-stroke" />

				{/* “More from brand”, “Similar energy” sections omitted for now */}
			</div>
		</div>
	);
}
