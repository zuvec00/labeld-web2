// components/dashboard/RecentContent.tsx
"use client";

import React from "react";
import {
	FileText,
	ExternalLink,
	Plus,
	Eye,
	EyeOff,
	CheckCircle,
	Clock,
} from "lucide-react";
import { ContentItem } from "@/hooks/useBrandSpace";
import { useRouter } from "next/navigation";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface RecentContentProps {
	items: ContentItem[];
	loading?: boolean;
	className?: string;
}

export default function RecentContent({
	items,
	loading = false,
	className = "",
}: RecentContentProps) {
	const router = useRouter();

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
					<div className="grid grid-cols-1 gap-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="animate-pulse border border-stroke rounded"
							>
								<div className="h-32 bg-stroke rounded-t"></div>
								<div className="p-3 space-y-2">
									<div className="h-3 bg-stroke rounded w-3/4"></div>
									<div className="h-2 bg-stroke rounded w-1/2"></div>
								</div>
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
					<h3 className="font-medium text-text">Recent Content</h3>
					<button
						onClick={() => router.push("/brand-space/radar")}
						className="text-xs text-cta hover:text-cta/80 transition-colors flex items-center gap-1"
					>
						<Plus className="w-3 h-3" />
						Create post
					</button>
				</div>
				<div className="text-center py-8">
					<FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted mb-2">No posts yet</div>
					<div className="text-xs text-text-muted">
						Share behind-the-scenes or drop teasers to build momentum
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
				<h3 className="font-medium text-text">Recent Content</h3>
				<button
					onClick={() => router.push("/radar")}
					className="text-xs text-cta hover:text-cta/80 transition-colors flex items-center gap-1"
				>
					<ExternalLink className="w-3 h-3" />
					View all Posts
				</button>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{items.slice(0, 6).map((item) => (
					<div
						key={item.id}
						className="border border-stroke rounded-lg overflow-hidden hover:border-cta/20 transition-colors"
					>
						{/* Image */}
						<div className="aspect-square bg-bg relative overflow-hidden">
							{item.teaserImageUrl ? (
								<OptimizedImage
									src={item.teaserImageUrl}
									alt={item.caption || "Post content"}
									fill
									className="w-full h-full object-cover"
									sizeContext="card"
									quality={85}
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<FileText className="w-8 h-8 text-text-muted" />
								</div>
							)}

							{/* Status badges */}
							<div className="absolute top-1 left-1 flex flex-col gap-1">
								{item.visibility === "public" ? (
									<span className="text-xs px-1.5 py-0.5 rounded-full bg-bg/80 text-text-muted border border-stroke/50 flex items-center gap-1">
										<Eye className="w-2.5 h-2.5" />
									</span>
								) : (
									<span className="text-xs px-1.5 py-0.5 rounded-full bg-bg/80 text-text-muted border border-stroke/50 flex items-center gap-1">
										<EyeOff className="w-2.5 h-2.5" />
									</span>
								)}

								{item.isPublished ? (
									<span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
										<CheckCircle className="w-2.5 h-2.5" />
									</span>
								) : (
									<span className="text-xs px-1.5 py-0.5 rounded-full bg-edit/10 text-edit border border-edit/20 flex items-center gap-1">
										<Clock className="w-2.5 h-2.5" />
									</span>
								)}
							</div>

							{/* Reactions count */}
							{item.reactionsCount > 0 && (
								<div className="absolute top-1 right-1">
									<span className="text-xs px-1.5 py-0.5 rounded-full bg-bg/80 text-text border border-stroke/50">
										{item.reactionsCount}
									</span>
								</div>
							)}
						</div>

						{/* Content */}
						<div className="p-2">
							<div className="text-xs text-text line-clamp-2 mb-1">
								{item.caption || "No caption"}
							</div>
							<div className="text-xs text-text-muted">
								{formatRelativeTime(item.createdAt)}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span>Last {Math.min(items.length, 6)} posts</span>
					<span>
						{items.filter((item) => item.isPublished).length} published
					</span>
				</div>
			</div>
		</div>
	);
}
