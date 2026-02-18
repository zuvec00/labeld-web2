/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Product } from "@/lib/firebase/queries/product";
import { formatWithCommasDouble, getCurrencyFromMap } from "@/lib/format";
import { Edit2, Trash2, MoreVertical, Star } from "lucide-react";

interface PiecesListViewProps {
	pieces: Product[];
	revenueMap: Record<string, number>;
	loadingRevenue?: boolean;
	onOpen: (p: Product) => void;
	onEdit: (p: Product) => void;
	onDelete: (p: Product) => void;
}

export default function PiecesListView({
	pieces,
	revenueMap, // Kept for API compatibility, though simpler view might hide it or show it subtly
	loadingRevenue,
	onOpen,
	onEdit,
	onDelete,
}: PiecesListViewProps) {
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);

	const handleMenuToggle = (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		setOpenMenuId(openMenuId === id ? null : id);
	};

	return (
		<div className="space-y-3 pb-20 md:pb-0">
			{pieces.map((piece) => {
				const currency = getCurrencyFromMap(piece.currency);
				const isSoldOut = piece.stockRemaining === 0;
				const isLowStock =
					(piece.stockRemaining ?? 0) > 0 && (piece.stockRemaining ?? 0) < 5;
				const avgRating = piece.reviewSummary?.avgRating;
				console.log("Reviews ", piece.reviewSummary);

				return (
					<div
						key={piece.id}
						className="relative flex items-center gap-4 p-3 rounded-xl border border-stroke bg-bg hover:bg-surface/50 transition-colors cursor-pointer group"
						onClick={() => onOpen(piece)}
					>
						{/* Leading: Image */}
						<div className="w-12 h-16 flex-shrink-0 bg-surface rounded-md overflow-hidden border border-stroke/50 relative">
							<img
								src={piece.mainVisualUrl}
								alt={piece.dropName}
								className="w-full h-full object-cover"
							/>
						</div>

						{/* Middle: Info */}
						<div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
							<h3 className="text-xs md:text-sm font-light text-text truncate pr-2 group-hover:text-edit transition-colors">
								{piece.dropName}
							</h3>

							<div className="flex items-center gap-2 text-xs text-text-muted">
								<span>
									{piece.stockRemaining === null
										? "Unlimited"
										: `${piece.stockRemaining} in stock`}
								</span>
							</div>

							<div className="flex items-center gap-2 mt-0.5">
								{isSoldOut ? (
									<span className="text-[10px] font-bold text-alert uppercase tracking-wide">
										Sold Out
									</span>
								) : isLowStock ? (
									<span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">
										Low Stock
									</span>
								) : piece.isAvailableNow ? (
									<span className="text-[10px] font-medium text-green-500 uppercase tracking-wide">
										Live
									</span>
								) : (
									<span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
										Hidden
									</span>
								)}

								{/* Rating (Next to status) */}
								{avgRating && avgRating > 0 && (
									<>
										<span className="text-text-muted/40">•</span>
										<div className="flex items-center gap-0.5 text-text-muted">
											<span className="text-[10px] font-bold pt-0.5">
												{avgRating.toFixed(1)}
											</span>
											<Star className="w-2.5 h-2.5 fill-text-muted text-text-muted" />
										</div>
									</>
								)}
							</div>
						</div>

						{/* Trailing: Price & Actions */}
						<div className="flex flex-col items-end justify-between h-full py-1 gap-1">
							<div className="text-sm font-bold text-text">
								{currency ? `${currency} ` : ""}
								{formatWithCommasDouble(piece.price)}
							</div>

							<div className="relative">
								<button
									onClick={(e) => handleMenuToggle(e, piece.id)}
									className="p-1 text-text-muted hover:text-text hover:bg-surface-neutral/50 rounded-lg transition-colors"
								>
									<MoreVertical className="w-5 h-5" />
								</button>

								{/* Popup Menu */}
								{openMenuId === piece.id && (
									<>
										<div
											className="fixed inset-0 z-40 cursor-default"
											onClick={(e) => {
												e.stopPropagation();
												setOpenMenuId(null);
											}}
										/>
										<div className="absolute right-0 top-8 z-50 w-32 bg-surface border border-stroke rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
											<div className="p-1 space-y-0.5">
												<button
													onClick={(e) => {
														e.stopPropagation();
														onEdit(piece);
														setOpenMenuId(null);
													}}
													className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-text hover:bg-surface-neutral/50 rounded-lg transition-colors text-left"
												>
													<Edit2 className="w-3.5 h-3.5" />
													Edit
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														onDelete(piece);
														setOpenMenuId(null);
													}}
													className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-alert hover:bg-alert/10 rounded-lg transition-colors text-left"
												>
													<Trash2 className="w-3.5 h-3.5" />
													Delete
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
