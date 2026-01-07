/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatWithCommasDouble, getCurrencyFromMap } from "@/lib/format";
import {
	deleteDropProduct,
	getProductListForBrand,
	Product,
} from "@/lib/firebase/queries/product";
import { useStoreOrders } from "@/hooks/useStoreOrders";
import { useMemo } from "react";
import { Flame, Heart, ArrowDownUp, Plus } from "lucide-react";

export default function PiecesTab({ brandId }: { brandId: string }) {
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);
	const [pieces, setPieces] = useState<Product[]>([]);
	const [sort, setSort] = useState<
		"newest" | "oldest" | "price-high" | "price-low"
	>("newest");
	const router = useRouter();
	const { orders } = useStoreOrders();

	const revenueMap = useMemo(() => {
		const map: Record<string, number> = {};
		orders.forEach((order) => {
			if (order.status === "cancelled" || order.status === "failed") return;
			order.lineItems.forEach((item) => {
				if (item._type === "product") {
					map[item.productId] = (map[item.productId] || 0) + item.subtotalMinor;
				}
			});
		});
		return map;
	}, [orders]);

	const cycleSort = () => {
		const options: (typeof sort)[] = [
			"newest",
			"oldest",
			"price-high",
			"price-low",
		];
		const next = options[(options.indexOf(sort) + 1) % options.length];
		setSort(next);
	};

	const sortLabel = {
		newest: "Newest",
		oldest: "Oldest",
		"price-high": "Price: High to Low",
		"price-low": "Price: Low to High",
	}[sort];

	async function load() {
		setLoading(true);
		setErr(null);
		try {
			const list = await getProductListForBrand(brandId);
			console.log("PiecesTab: Loaded pieces:", list.length, list);
			setPieces(list);
		} catch (e: any) {
			console.error("PiecesTab: Error loading pieces:", e);
			setErr(e?.message ?? "Failed to load pieces.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, [brandId]);

	const onOpen = (p: Product) => router.push(`/brand-space/piece/${p.id}/edit`);
	const onEdit = (p: Product) => router.push(`/brand-space/piece/${p.id}/edit`);
	const onDelete = async (p: Product) => {
		if (!confirm("Delete this piece? This cannot be undone.")) return;
		await deleteDropProduct(p.id, p.brandId);
		await load();
	};

	if (loading) {
		return (
			<div className="px-3 sm:px-4">
				<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="animate-pulse">
							<div className="h-56 rounded-2xl bg-surface border border-stroke" />
							<div className="mt-2 h-4 w-3/4 rounded bg-surface" />
							<div className="mt-1 h-4 w-1/2 rounded bg-surface" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (err) {
		return (
			<div className="min-h-[40vh] grid place-items-center">
				<div className="text-center">
					<p className="text-text-muted mb-3">{err}</p>
					<button
						onClick={load}
						className="px-4 py-2 rounded-xl border border-stroke"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (!pieces.length) {
		console.log(
			"PiecesTab: Showing empty state, pieces.length:",
			pieces.length
		);
		return (
			<div className="px-4 sm:px-6 py-16 text-center relative min-h-[50vh]">
				<img
					src="/images/empty-radar.png"
					alt=""
					className="mx-auto mb-4 opacity-80 max-w-[220px]"
				/>
				<p className="text-text-muted">
					Add your pieces so people can see and shop your products.
				</p>
				<button
					onClick={() => router.push("/pieces/new")}
					className="fixed bottom-8 right-6 z-50 h-14 w-14 rounded-full bg-cta text-bg shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
					title="Drop a Piece"
				>
					<Plus className="w-6 h-6" />
				</button>
			</div>
		);
	}

	// Derived sorted pieces
	const sortedPieces = [...pieces].sort((a, b) => {
		switch (sort) {
			case "newest":
				return (b.launchDate?.getTime() || 0) - (a.launchDate?.getTime() || 0);
			case "oldest":
				return (a.launchDate?.getTime() || 0) - (b.launchDate?.getTime() || 0);
			case "price-high":
				return b.price - a.price;
			case "price-low":
				return a.price - b.price;
			default:
				return 0;
		}
	});

	console.log("PiecesTab: Showing pieces grid, pieces.length:", pieces.length);
	return (
		<div className="px-3 sm:px-4 pb-20">
			{/* Curation & Sort Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="text-sm font-medium text-text-muted">
					{pieces.length} Creative Assets
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={cycleSort}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stroke text-xs font-medium hover:bg-surface text-text-muted hover:text-text transition-colors"
					>
						<ArrowDownUp className="w-3.5 h-3.5" />
						Sort: {sortLabel}
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
				{sortedPieces.map((p, i) => (
					<PieceCard
						key={p.id}
						piece={p}
						revenue={revenueMap[p.id] || 0}
						onOpen={() => onOpen(p)}
						onEdit={() => onEdit(p)}
						onDelete={() => onDelete(p)}
					/>
				))}
			</div>

			<button
				onClick={() => router.push("/pieces/new")}
				className="fixed bottom-8 right-6 z-50 h-14 w-14 rounded-full bg-cta text-bg shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
				title="Drop a Piece"
			>
				<Plus className="w-6 h-6" />
			</button>
		</div>
	);
}

/* --- Card --- */
function PieceCard({
	piece,
	revenue,
	onOpen,
	onEdit,
	onDelete,
}: {
	piece: Product;
	revenue: number;
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const currency = getCurrencyFromMap(piece.currency);

	return (
		<div className="group cursor-pointer space-y-3" onClick={onOpen}>
			<div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface border border-stroke/50">
				<img
					src={piece.mainVisualUrl}
					alt={piece.dropName}
					className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>

				{/* Pinned Signal - Removed per request */}

				{/* Overlay: Actions & Revenue */}
				<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
					{/* Revenue Signal (Bottom Right) */}
					<div className="self-end">
						<div
							className="bg-bg/90 backdrop-blur rounded-lg px-3 py-1.5 text-center border border-white/10 shadow-sm"
							title="Revenue"
						>
							<div className="text-[10px] uppercase text-text-muted mb-0.5">
								Revenue
							</div>
							<div className="flex items-center gap-1 justify-center">
								<span className="text-green-500 font-bold text-xs">₦</span>
								<span className="text-xs font-bold text-text">
									{formatWithCommasDouble(revenue / 100)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="space-y-1">
				<h3 className="font-medium text-text leading-tight group-hover:text-edit transition-colors">
					{piece.dropName}
				</h3>
				<div className="flex items-center justify-between">
					<div className="text-sm text-text-muted font-medium">
						{currency ? `${currency} ` : ""}
						{formatWithCommasDouble(piece.price)}
					</div>
					{/* Status Dot */}
					<div
						className={`w-1.5 h-1.5 rounded-full ${
							piece.isAvailableNow ? "bg-green-500" : "bg-stroke"
						}`}
					/>
				</div>
			</div>
		</div>
	);
}

function IconButton({
	label,
	tone = "neutral",
	onClick,
}: {
	label: string;
	tone?: "neutral" | "alert";
	onClick: () => void;
}) {
	const toneClass =
		tone === "alert"
			? "text-red-500 bg-white hover:bg-red-50"
			: "text-black bg-white hover:bg-gray-50";
	return (
		<button
			aria-label={label}
			onClick={onClick}
			className={`rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${toneClass}`}
		>
			{label}
		</button>
	);
}
