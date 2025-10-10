/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { formatWithCommasDouble, getCurrencyFromMap } from "@/lib/format";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { fetchProductById, Product } from "@/lib/firebase/queries/product";

export default function PieceDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const [loading, setLoading] = useState(true);
	const [piece, setPiece] = useState<Product | null>(null);
	const [err, setErr] = useState<string | null>(null);
	const [idx, setIdx] = useState(0);
	const router = useRouter();

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const p = await fetchProductById(id);
				if (!mounted) return;
				setPiece(p);
				if (!p) setErr("Piece not found.");
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load piece.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [id]);

	const images = useMemo(() => {
		if (!piece) return [];
		return [piece.mainVisualUrl, ...(piece.galleryImages ?? [])].filter(
			Boolean
		);
	}, [piece]);

	const canPrev = idx > 0;
	const canNext = idx < images.length - 1;

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!piece) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<div className="text-center">
					<p className="text-text-muted mb-4">{err ?? "Not found"}</p>
					<Button text="Back" onClick={() => router.back()} />
				</div>
			</div>
		);
	}

	const currency = getCurrencyFromMap(piece.currency);

	return (
		<div className="pb-10">
			{/* Hero image w/ swipe-like controls */}
			<div className="relative h-[65vh] rounded-b-2xl overflow-hidden">
				<OptimizedImage
					key={images[idx]}
					src={images[idx]}
					alt={piece.dropName}
					fill
					priority
					sizeContext="hero"
					objectFit="cover"
				/>

				{images.length > 1 && (
					<>
						{canPrev && (
							<button
								className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white px-3 py-2 z-10"
								onClick={() => setIdx((i) => Math.max(0, i - 1))}
							>
								‹
							</button>
						)}
						{canNext && (
							<button
								className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white px-3 py-2 z-10"
								onClick={() =>
									setIdx((i) => Math.min(images.length - 1, i + 1))
								}
							>
								›
							</button>
						)}
					</>
				)}
			</div>

			{/* Thumbnails */}
			{images.length > 1 && (
				<div className="px-4 sm:px-6 mt-3 flex gap-2 overflow-x-auto">
					{images.map((src, i) => (
						<button
							key={src + i}
							onClick={() => setIdx(i)}
							className={`shrink-0 relative h-16 w-16 ${
								i === idx ? "ring-2 ring-accent" : ""
							} rounded-xl overflow-hidden`}
						>
							<OptimizedImage
								src={src}
								alt={`View ${i + 1}`}
								fill
								sizeContext="thumbnail"
								objectFit="cover"
							/>
						</button>
					))}
				</div>
			)}

			{/* Info */}
			<div className="px-4 sm:px-6 mt-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="font-heading font-light text-xl">
							{piece.dropName}
						</h1>
						<div className="mt-1 font-semibold">
							{currency ? `${currency} ` : ""}
							{formatWithCommasDouble(piece.price)}
						</div>
					</div>
					{/* Dashboard view: omit "Lock Me In"/"Cop Now" logic */}
				</div>

				{piece.description && (
					<div className="mt-4 rounded-2xl bg-surface border border-stroke p-4">
						<p>{piece.description}</p>
					</div>
				)}

				{piece.sizeOptions?.length ? (
					<div className="mt-6">
						<div className="text-text-muted">Size</div>
						<div className="mt-1 flex flex-wrap items-center gap-3">
							{piece.sizeOptions.map((s, i) => (
								<span key={s + i} className="font-medium">
									{s}
								</span>
							))}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
