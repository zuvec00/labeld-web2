/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatWithCommasDouble, getCurrencyFromMap } from "@/lib/format";
import {
	deleteDropProduct,
	getProductListForBrand,
	Product,
} from "@/lib/firebase/queries/product";
import { useStoreOrders } from "@/hooks/useStoreOrders";
import {
	Flame,
	Heart,
	ArrowDownUp,
	Plus,
	LayoutGrid,
	List,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import PiecesListView from "./PiecesListView";

const ITEMS_PER_PAGE = 25;

export default function PiecesTab({ brandId }: { brandId: string }) {
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);
	const [pieces, setPieces] = useState<Product[]>([]);
	const [sort, setSort] = useState<
		"newest" | "oldest" | "price-high" | "price-low"
	>("newest");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [currentPage, setCurrentPage] = useState(1);
	const router = useRouter();
	const { orders, loading: loadingOrders } = useStoreOrders();

	// Load view preference on mount
	useEffect(() => {
		const storedView = localStorage.getItem("piecesViewMode") as
			| "grid"
			| "list"
			| null;
		if (storedView) {
			setViewMode(storedView);
		}
	}, []);

	// Persist view preference
	const handleViewModeChange = (mode: "grid" | "list") => {
		setViewMode(mode);
		localStorage.setItem("piecesViewMode", mode);
	};

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

	// Reset pagination when pieces or sort changes (optional, but good UX)
	useEffect(() => {
		setCurrentPage(1);
	}, [pieces.length, sort]);

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
					title="Drop a Product"
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

	// Pagination Logic
	const totalPages = Math.ceil(sortedPieces.length / ITEMS_PER_PAGE);
	const paginatedPieces = sortedPieces.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	);

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
			// Optional: Scroll to top of list/grid
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	console.log("PiecesTab: Showing pieces grid, pieces.length:", pieces.length);
	return (
		<div className="px-3 sm:px-4 pb-20">
			{/* Curation & Sort Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
				<div className="text-sm font-medium text-text-muted">
					{pieces.length} Creative Assets
				</div>
				<div className="flex items-center gap-3 self-end sm:self-auto">
					{/* Sort Control */}
					<button
						onClick={cycleSort}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stroke text-xs font-medium hover:bg-surface text-text-muted hover:text-text transition-colors"
					>
						<ArrowDownUp className="w-3.5 h-3.5" />
						Sort: {sortLabel}
					</button>

					{/* View Toggle */}
					<div className="flex items-center bg-surface rounded-lg border border-stroke p-0.5">
						<button
							onClick={() => handleViewModeChange("grid")}
							className={`p-1.5 rounded-md transition-all ${
								viewMode === "grid"
									? "bg-bg shadow-sm text-text"
									: "text-text-muted hover:text-text"
							}`}
							title="Grid View"
						>
							<LayoutGrid className="w-4 h-4" />
						</button>
						<button
							onClick={() => handleViewModeChange("list")}
							className={`p-1.5 rounded-md transition-all ${
								viewMode === "list"
									? "bg-bg shadow-sm text-text"
									: "text-text-muted hover:text-text"
							}`}
							title="List View"
						>
							<List className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Content View */}
			{viewMode === "grid" ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
					{paginatedPieces.map((p, i) => (
						<PieceCard
							key={p.id}
							piece={p}
							revenue={revenueMap[p.id] || 0}
							loadingRevenue={loadingOrders}
							onOpen={() => onOpen(p)}
							onEdit={() => onEdit(p)}
							onDelete={() => onDelete(p)}
						/>
					))}
				</div>
			) : (
				<PiecesListView
					pieces={paginatedPieces}
					revenueMap={revenueMap}
					loadingRevenue={loadingOrders}
					onOpen={onOpen}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			)}

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 mt-8">
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className="p-2 rounded-lg border border-stroke bg-bg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
						aria-label="Previous Page"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
					<span className="text-sm font-medium text-text-muted">
						Page {currentPage} of {totalPages}
					</span>
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className="p-2 rounded-lg border border-stroke bg-bg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
						aria-label="Next Page"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			)}

			<button
				onClick={() => router.push("/pieces/new")}
				className="fixed bottom-8 right-6 z-50 h-14 w-14 rounded-full bg-cta text-bg shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
				title="Drop a Product"
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
	loadingRevenue,
	onOpen,
	onEdit,
	onDelete,
}: {
	piece: Product;
	revenue: number;
	loadingRevenue?: boolean;
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const currency = getCurrencyFromMap(piece.currency);

	// Stock Logic
	const isSoldOut = piece.stockRemaining === 0;
	const isLowStock =
		(piece.stockRemaining ?? 0) > 0 && (piece.stockRemaining ?? 0) < 5; // Threshold 5

	return (
		<div className="group cursor-pointer space-y-3" onClick={onOpen}>
			<div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface border border-stroke/50">
				<img
					src={piece.mainVisualUrl}
					alt={piece.dropName}
					className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>

				{/* Stock Status Badges */}
				<div className="absolute top-2 left-2 flex flex-col gap-1">
					{isSoldOut && (
						<div className="px-2 py-1 rounded bg-bg/90 backdrop-blur border border-stroke text-[10px] font-bold uppercase tracking-wider text-alert">
							Sold Out
						</div>
					)}
					{isLowStock && !isSoldOut && (
						<div className="px-2 py-1 rounded bg-orange-500/90 text-white backdrop-blur border border-orange-600/20 text-[10px] font-bold uppercase tracking-wider">
							Low Stock
						</div>
					)}
				</div>

				{/* Overlay: Actions & Revenue */}
				<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
					{/* Revenue Signal (Bottom Right) */}
					<div className="self-end">
						<div
							className="bg-bg/90 backdrop-blur rounded-lg px-3 py-1.5 text-center border border-white/10 shadow-sm min-w-[80px]"
							title="Revenue"
						>
							<div className="text-[10px] uppercase text-text-muted mb-0.5">
								Revenue
							</div>
							<div className="flex items-center gap-1 justify-center">
								{loadingRevenue ? (
									<div className="h-4 w-12 bg-surface-neutral/50 animate-pulse rounded" />
								) : (
									<>
										<span className="text-green-500 font-bold text-xs">₦</span>
										<span className="text-xs font-bold text-text">
											{formatWithCommasDouble(revenue / 100)}
										</span>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="space-y-1">
				<h3 className="font-light text-sm md:text-base text-text leading-tight group-hover:text-edit transition-colors">
					{piece.dropName}
				</h3>
				<div className="flex items-center justify-between">
					<div className="text-sm text-text-muted font-bold">
						{currency ? `${currency} ` : ""}
						{formatWithCommasDouble(piece.price)}
					</div>

					{/* Status Dot (Live/Hidden) */}
					<div className="flex items-center gap-2">
						{/* Text Status for Cards */}
						{isSoldOut ? (
							<span className="text-[10px] font-medium text-alert uppercase">
								Sold Out
							</span>
						) : isLowStock ? (
							<span className="text-[10px] font-medium text-orange-500 uppercase">
								{piece.stockRemaining} Left
							</span>
						) : null}
						<div
							className={`w-1.5 h-1.5 rounded-full ${
								piece.isAvailableNow ? "bg-green-500" : "bg-stroke"
							}`}
							title={piece.isAvailableNow ? "Live" : "Hidden"}
						/>
					</div>
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
