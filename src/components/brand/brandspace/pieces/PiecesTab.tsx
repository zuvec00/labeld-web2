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
import Button from "@/components/ui/button";

export default function PiecesTab({ brandId }: { brandId: string }) {
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);
	const [pieces, setPieces] = useState<Product[]>([]);
	const router = useRouter();

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

	const onOpen = (p: Product) => router.push(`/brand-space/piece/${p.id}`);
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
			<div className="px-4 sm:px-6 py-16 text-center">
				<div className="flex justify-end mb-8">
					<Button
						text="Drop a Piece"
						variant="cta"
						onClick={() => {
							console.log("Drop a Piece button clicked");
							router.push("/pieces/new");
						}}
					/>
				</div>
				<img
					src="/images/empty-radar.png"
					alt=""
					className="mx-auto mb-4 opacity-80 max-w-[220px]"
				/>
				<p className="text-text-muted">
					Add your pieces so people can see and shop your products.
				</p>
			</div>
		);
	}

	console.log("PiecesTab: Showing pieces grid, pieces.length:", pieces.length);
	return (
		<div className="px-3 sm:px-4">
			<div className="flex justify-end mb-8">
				<Button
					text="Drop a Piece"
					variant="cta"
					onClick={() => {
						console.log("Drop a Piece button clicked (from grid view)");
						router.push("/pieces/new");
					}}
				/>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
				{pieces.map((p) => (
					<PieceCard
						key={p.id}
						piece={p}
						onOpen={() => onOpen(p)}
						onEdit={() => onEdit(p)}
						onDelete={() => onDelete(p)}
					/>
				))}
			</div>
		</div>
	);
}

/* --- Card --- */
function PieceCard({
	piece,
	onOpen,
	onEdit,
	onDelete,
}: {
	piece: Product;
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const currency = getCurrencyFromMap(piece.currency);
	return (
		<div className="group cursor-pointer" onClick={onOpen}>
			<div className="relative">
				<img
					src={piece.mainVisualUrl}
					alt={piece.dropName}
					className="w-full h-56 object-cover rounded-2xl border border-stroke"
				/>
				{/* Edit/Delete (dashboard: always show on hover) */}
				<div
					className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={(e) => e.stopPropagation()}
				>
					<IconButton label="Edit" onClick={onEdit} />
					<IconButton label="Delete" tone="alert" onClick={onDelete} />
				</div>
			</div>

			<div className="px-2 mt-2">
				<div className="font-heading font-light">{piece.dropName}</div>
				<div className="mt-1 font-semibold text-sm">
					{currency ? `${currency} ` : ""}
					{formatWithCommasDouble(piece.price)}
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
			? "text-alert border-alert/30"
			: "text-edit border-edit/30";
	return (
		<button
			aria-label={label}
			onClick={onClick}
			className={`rounded-xl border px-3 py-1.5 bg-bg/80 backdrop-blur ${toneClass}`}
		>
			{label}
		</button>
	);
}
