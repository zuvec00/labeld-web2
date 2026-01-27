// components/dashboard/MomentumSection.tsx
"use client";

import React from "react";
import {
	FileText,
	Package,
	ExternalLink,
	Eye,
	Bookmark,
	TrendingDown,
} from "lucide-react";
import {
	BrandSpaceData,
	ContentItem,
	CatalogItem,
} from "@/hooks/useBrandSpace";
import Link from "next/link";
import Image from "next/image";

interface MomentumSectionProps {
	data: BrandSpaceData | null;
	loading?: boolean;
}

// Content performance tag types
type PerformanceTag = "driving-visits" | "high-saves" | "low-reach" | null;

// TODO: [DEV] Implement actual performance tag calculation
// This requires tracking:
// - Content → Store click-throughs (from interactions)
// - Save/bookmark counts per content
// - Reach/impression data
function getPerformanceTag(content: ContentItem): PerformanceTag {
	// Placeholder logic - replace with real data when available
	if (content.reactionsCount > 10) return "high-saves";
	if (content.reactionsCount === 0) return "low-reach";
	return null;
}

function PerformanceBadge({ tag }: { tag: PerformanceTag }) {
	if (!tag) return null;

	const config = {
		"driving-visits": {
			label: "Driving store visits",
			icon: ExternalLink,
			className: "bg-green-500/10 text-green-600 border-green-500/20",
		},
		"high-saves": {
			label: "High saves",
			icon: Bookmark,
			className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
		},
		"low-reach": {
			label: "Low reach",
			icon: TrendingDown,
			className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
		},
	};

	const { label, icon: Icon, className } = config[tag];

	return (
		<span
			className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${className}`}
		>
			<Icon className="w-3 h-3" />
			{label}
		</span>
	);
}

function ContentCard({ content }: { content: ContentItem }) {
	const tag = getPerformanceTag(content);

	return (
		<div className="group relative rounded-xl overflow-hidden border border-stroke hover:border-cta/30 transition-all hover:shadow-lg bg-surface">
			{/* Image */}
			<div className="aspect-square relative bg-bg">
				{content.teaserImageUrl ? (
					<Image
						src={content.teaserImageUrl}
						alt={content.caption || "Content"}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<FileText className="w-8 h-8 text-text-muted" />
					</div>
				)}

				{/* Overlay on hover */}
				<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
					<Eye className="w-6 h-6 text-white" />
				</div>
			</div>

			{/* Details */}
			<div className="p-3 space-y-2">
				{content.caption && (
					<p className="text-xs text-text line-clamp-2">{content.caption}</p>
				)}

				<div className="flex items-center justify-between">
					<span className="text-xs text-text-muted">
						{content.reactionsCount} reactions
					</span>
					{tag && <PerformanceBadge tag={tag} />}
				</div>
			</div>
		</div>
	);
}

function CatalogCard({ item }: { item: CatalogItem }) {
	return (
		<div className="group flex items-center gap-3 p-3 rounded-xl border border-stroke hover:border-cta/30 transition-all hover:shadow-lg bg-surface">
			{/* Thumbnail */}
			<div className="w-14 h-14 rounded-lg overflow-hidden bg-bg flex-shrink-0 relative">
				{item.mainVisualUrl ? (
					<Image
						src={item.mainVisualUrl}
						alt={item.name}
						fill
						className="object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Package className="w-5 h-5 text-text-muted" />
					</div>
				)}
			</div>

			{/* Details */}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-text truncate">{item.name}</p>
				<span
					className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full ${
						item.isAvailableNow
							? "bg-green-500/10 text-green-600 border border-green-500/20"
							: "bg-gray-500/10 text-gray-600 border border-gray-500/20"
					}`}
				>
					{item.isAvailableNow ? "Available" : "Upcoming"}
				</span>
			</div>
		</div>
	);
}

export default function MomentumSection({
	data,
	loading = false,
}: MomentumSectionProps) {
	if (loading || !data) {
		return (
			<div className="space-y-4">
				<div>
					<div className="h-6 w-40 bg-stroke rounded animate-pulse mb-2" />
					<div className="h-4 w-64 bg-stroke rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Content skeleton */}
					<div className="space-y-4">
						<div className="h-5 w-32 bg-stroke rounded animate-pulse" />
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div
									key={i}
									className="aspect-square rounded-xl bg-stroke animate-pulse"
								/>
							))}
						</div>
					</div>
					{/* Catalog skeleton */}
					<div className="space-y-4">
						<div className="h-5 w-32 bg-stroke rounded animate-pulse" />
						<div className="space-y-3">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="h-20 rounded-xl bg-stroke animate-pulse"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	const { recentContent, catalogItems } = data;

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-heading font-semibold text-text">
					Momentum & Content
				</h2>
				<p className="text-sm text-text-muted">
					Your latest Radar posts and Products driving brand culture.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recent Content */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-text">Recent Posts</h3>
						<Link
							href="/radar"
							className="text-xs text-cta hover:text-cta/80 transition-colors flex items-center gap-1"
						>
							View all
							<ExternalLink className="w-3 h-3" />
						</Link>
					</div>

					{recentContent.length > 0 ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{recentContent.slice(0, 6).map((content) => (
								<ContentCard key={content.id} content={content} />
							))}
						</div>
					) : (
						<div className="p-8 rounded-xl border border-dashed border-stroke text-center">
							<FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
							<p className="text-sm text-text-muted">No posts yet</p>
							<Link
								href="/radar"
								className="inline-block mt-2 text-xs text-cta hover:text-cta/80"
							>
								Create your first post →
							</Link>
						</div>
					)}
				</div>

				{/* Catalog Snapshot */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-text">Recent Products</h3>
						<Link
							href="/pieces"
							className="text-xs text-cta hover:text-cta/80 transition-colors flex items-center gap-1"
						>
							View all
							<ExternalLink className="w-3 h-3" />
						</Link>
					</div>

					{catalogItems.length > 0 ? (
						<div className="space-y-3">
							{catalogItems.slice(0, 4).map((item) => (
								<CatalogCard key={item.id} item={item} />
							))}
						</div>
					) : (
						<div className="p-8 rounded-xl border border-dashed border-stroke text-center">
							<Package className="w-8 h-8 text-text-muted mx-auto mb-2" />
							<p className="text-sm text-text-muted">No pieces yet</p>
							<Link
								href="/pieces"
								className="inline-block mt-2 text-xs text-cta hover:text-cta/80"
							>
								Add your first piece →
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
