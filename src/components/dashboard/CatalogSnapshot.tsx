// components/dashboard/CatalogSnapshot.tsx
"use client";

import React from "react";
import { Package, ExternalLink, Plus } from "lucide-react";
import { CatalogItem } from "@/hooks/useBrandSpace";
import { useRouter } from "next/navigation";

interface CatalogSnapshotProps {
	items: CatalogItem[];
	loading?: boolean;
	className?: string;
}

export default function CatalogSnapshot({
	items,
	loading = false,
	className = "",
}: CatalogSnapshotProps) {
	const router = useRouter();

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
					<div className="space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className="animate-pulse flex items-center gap-3 p-2 border border-stroke rounded"
							>
								<div className="w-10 h-10 bg-stroke rounded"></div>
								<div className="flex-1 space-y-1">
									<div className="h-3 bg-stroke rounded w-24"></div>
									<div className="h-2 bg-stroke rounded w-16"></div>
								</div>
								<div className="h-3 bg-stroke rounded w-12"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-medium text-text">Catalog Snapshot</h3>
					<button
						onClick={() => router.push("/pieces")}
						className="text-xs text-cta hover:text-cta/80 transition-colors flex items-center gap-1"
					>
						<Plus className="w-3 h-3" />
						Add piece
					</button>
				</div>
				<div className="text-center py-8">
					<Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted mb-2">No pieces yet</div>
					<div className="text-xs text-text-muted">
						Add your first piece to fill your Catalog
					</div>
				</div>
			</div>
		);
	}

	const formatRelativeTime = (date: Date): string => {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffMinutes = Math.floor(diffMs / (1000 * 60));

		if (diffDays > 0) return `${diffDays}d ago`;
		if (diffHours > 0) return `${diffHours}h ago`;
		if (diffMinutes > 0) return `${diffMinutes}m ago`;
		return "Just now";
	};

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text">Catalog Snapshot</h3>
				<button
					onClick={() => router.push("/pieces")}
					className="text-xs text-cta hover:text-cta/80 transition-colors flex items-center gap-1"
				>
					<ExternalLink className="w-3 h-3" />
					Manage Products
				</button>
			</div>

			<div className="space-y-2">
				{items.map((item) => (
					<div
						key={item.id}
						className="flex items-center gap-3 p-2 border border-stroke rounded-lg hover:border-cta/20 transition-colors"
					>
						{/* Thumbnail */}
						<div className="w-10 h-10 bg-bg border border-stroke rounded flex items-center justify-center overflow-hidden">
							{item.mainVisualUrl ? (
								<img
									src={item.mainVisualUrl}
									alt={item.name}
									className="w-full h-full object-cover"
								/>
							) : (
								<Package className="w-4 h-4 text-text-muted" />
							)}
						</div>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<div className="text-sm font-medium text-text truncate">
								{item.name}
							</div>
							<div className="text-xs text-text-muted">
								{formatRelativeTime(item.updatedAt)}
							</div>
						</div>

						{/* Status */}
						<div className="flex items-center gap-2">
							{item.isAvailableNow && (
								<span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
									Available now
								</span>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span>Top {items.length} by freshness</span>
					<span>
						{items.filter((item) => item.isAvailableNow).length} available
					</span>
				</div>
			</div>
		</div>
	);
}
