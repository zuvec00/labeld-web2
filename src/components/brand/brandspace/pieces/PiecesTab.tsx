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
	Star,
	FileSpreadsheet,
	History,
} from "lucide-react";
import CsvImportModal from "./import/CsvImportModal";
import ImportHistoryDrawer from "./import/ImportHistoryDrawer";
import { subscribeImportHistory } from "@/lib/firebase/queries/importHistory";
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
	const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
	const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [pendingImportCount, setPendingImportCount] = useState(0);

	// Track active imports for badge.
	// The isActive guard prevents React StrictMode's double-invoke from
	// creating two simultaneous listeners that crash the Firestore SDK.
	useEffect(() => {
		let isActive = true;
		let unsub: (() => void) | null = null;
		unsub = subscribeImportHistory(brandId, (list) => {
			if (!isActive) return;
			const active = list.filter(
				(i) => i.status === "pending" || i.status === "processing"
			).length;
			setPendingImportCount(active);
		});
		return () => {
			isActive = false;
			unsub?.();
		};
	}, [brandId]);

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
			pieces.length,
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
				<div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
					<button
						onClick={() => router.push("/pieces/new")}
						className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stroke bg-surface text-sm font-semibold text-text hover:bg-bg transition-colors"
					>
						<Plus className="w-4 h-4" />
						Add manually
					</button>
					<button
						onClick={() => setIsCsvImportOpen(true)}
						className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
					>
						<FileSpreadsheet className="w-4 h-4" />
						Import from CSV
					</button>
				</div>
				<div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3">
					{isFabMenuOpen && (
						<div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-200">
							<button
								onClick={() => { setIsFabMenuOpen(false); router.push("/pieces/new"); }}
								className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-stroke rounded-xl shadow-xl hover:bg-bg transition-colors"
							>
								<span className="text-sm font-semibold">Manual Entry</span>
								<div className="w-10 h-10 rounded-full bg-surface border border-stroke flex items-center justify-center">
									<Plus className="w-5 h-5" />
								</div>
							</button>
							<button
								onClick={() => { setIsFabMenuOpen(false); setIsCsvImportOpen(true); }}
								className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-stroke rounded-xl shadow-xl hover:bg-bg transition-colors"
							>
								<div className="flex flex-col items-end">
									<span className="text-sm font-semibold">CSV Import</span>
									<span className="text-[10px] text-text-muted">Bumpa, Shopify or any CSV</span>
								</div>
								<div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
									<FileSpreadsheet className="w-5 h-5 text-accent" />
								</div>
							</button>
						</div>
					)}
					<button
						onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
						className={`h-14 w-14 rounded-full bg-cta text-bg shadow-lg flex items-center justify-center transition-all duration-300 ${isFabMenuOpen ? 'rotate-45 scale-90 bg-surface border border-stroke text-text' : 'hover:scale-105'}`}
						title="Drop a Product"
					>
						<Plus className="w-6 h-6" />
					</button>
				</div>

				<CsvImportModal
					isOpen={isCsvImportOpen}
					onClose={() => setIsCsvImportOpen(false)}
					brandId={brandId}
					onViewHistory={() => setIsHistoryOpen(true)}
				/>
				<ImportHistoryDrawer
					isOpen={isHistoryOpen}
					onClose={() => setIsHistoryOpen(false)}
					brandId={brandId}
				/>
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
		currentPage * ITEMS_PER_PAGE,
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
					{/* Import History */}
					<button
						onClick={() => setIsHistoryOpen(true)}
						className="relative p-1.5 rounded-lg border border-stroke hover:bg-surface text-text-muted hover:text-text transition-colors"
						title="Import History"
					>
						<History className="w-4 h-4" />
						{pendingImportCount > 0 && (
							<span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cta text-bg text-[8px] font-bold flex items-center justify-center">
								{pendingImportCount}
							</span>
						)}
					</button>

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

			{/* FAB Menu */}
			<div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3">
				{/* History button — shown when there are active imports */}
				{pendingImportCount > 0 && !isFabMenuOpen && (
					<button
						onClick={() => setIsHistoryOpen(true)}
						className="flex items-center gap-2 px-3 py-2 bg-surface border border-stroke rounded-xl shadow-lg text-sm font-semibold text-text hover:bg-bg transition-all animate-in slide-in-from-bottom-2 duration-200"
					>
						<div className="relative">
							<History className="w-4 h-4" />
							<span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-cta text-bg text-[8px] font-bold flex items-center justify-center">
								{pendingImportCount}
							</span>
						</div>
						Importing…
					</button>
				)}
				{isFabMenuOpen && (
					<div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-200">
						<button
							onClick={() => {
								setIsFabMenuOpen(false);
								router.push("/pieces/new");
							}}
							className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-stroke rounded-xl shadow-xl hover:bg-surface-neutral transition-colors"
						>
							<span className="text-sm font-semibold">Manual Entry</span>
							<div className="w-10 h-10 rounded-full bg-surface border border-stroke flex items-center justify-center">
								<Plus className="w-5 h-5" />
							</div>
						</button>

						<button
							onClick={() => {
								setIsFabMenuOpen(false);
								setIsCsvImportOpen(true);
							}}
							className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-stroke rounded-xl shadow-xl hover:bg-surface-neutral transition-colors group"
						>
							<div className="flex flex-col items-end">
								<span className="text-sm font-semibold">CSV Import</span>
								<span className="text-[10px] text-text-muted">Bumpa, Shopify or any CSV</span>
							</div>
							<div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
								<FileSpreadsheet className="w-5 h-5 text-accent" />
							</div>
						</button>

					</div>
				)}

				<button
					data-tour="create-product"
					onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
					className={`h-14 w-14 rounded-full bg-cta text-bg shadow-lg flex items-center justify-center transition-all duration-300 ${isFabMenuOpen ? 'rotate-45 scale-90 bg-surface border border-stroke text-text' : 'hover:scale-105'}`}
					title="Drop a Product"
				>
					<Plus className="w-6 h-6" />
				</button>
			</div>

			<CsvImportModal
				isOpen={isCsvImportOpen}
				onClose={() => setIsCsvImportOpen(false)}
				brandId={brandId}
				onViewHistory={() => setIsHistoryOpen(true)}
			/>

			<ImportHistoryDrawer
				isOpen={isHistoryOpen}
				onClose={() => setIsHistoryOpen(false)}
				brandId={brandId}
			/>
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
	let remaining = 0;
	let isUnlimited = false;

	if (piece.stockMode === "variants") {
		// Variant Mode: Sum of all variant quantities
		if (piece.variantStock) {
			remaining = Object.values(piece.variantStock).reduce(
				(acc, qty) => acc + (Number(qty) || 0),
				0,
			);
		}
	} else {
		// Global Mode (Default)
		if (piece.stockRemaining === null || piece.stockRemaining === undefined) {
			isUnlimited = true;
		} else {
			remaining = Number(piece.stockRemaining) || 0;
		}
	}

	const isSoldOut = !isUnlimited && remaining === 0;
	const isLowStock = !isUnlimited && remaining > 0 && remaining < 5; // Threshold 5

	const avgRating = piece.reviewSummary?.avgRating;

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

				{/* Rating Badge (Top Right) */}
				{/* {avgRating && avgRating > 0 && (
					<div className="absolute top-2 right-2">
						<div className="flex items-center gap-1 bg-black/60 backdrop-blur text-white px-1.5 py-0.5 rounded-full">
							<span className="text-[10px] font-bold">
								{avgRating.toFixed(1)}
							</span>
							<Star className="w-2.5 h-2.5 fill-white text-white" />
						</div>
					</div>
				)} */}

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
					<div className="flex items-center gap-2">
						<div className="text-sm text-text-muted font-bold">
							{currency ? `${currency} ` : ""}
							{formatWithCommasDouble(piece.price)}
						</div>
					</div>

					{/* Status Dot (Live/Hidden) */}
					<div className="flex items-center gap-2">
						{/* Rating (Inline with Price) */}
						{avgRating && avgRating > 0 && (
							<div className="flex items-center gap-0.5 text-text-muted">
								<span className="text-[10px] font-bold pt-0.5">
									{avgRating.toFixed(1)}
								</span>
								<Star className="w-3 h-3 fill-text-muted text-text-muted" />
							</div>
						)}
						{/* Text Status for Cards */}
						{isSoldOut ? (
							<span className="text-[10px] font-medium text-alert uppercase">
								Sold Out
							</span>
						) : isLowStock ? (
							<span className="text-[10px] font-medium text-orange-500 uppercase">
								{remaining} Left
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
