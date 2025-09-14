// components/dashboard/ReactionsVelocity.tsx
"use client";

import React from "react";
import { Heart, FileText, TrendingUp, Calendar } from "lucide-react";
import { ReactionsData } from "@/hooks/useBrandSpace";

interface ReactionsVelocityProps {
	data: ReactionsData | null;
	loading?: boolean;
	className?: string;
}

export default function ReactionsVelocity({
	data,
	loading = false,
	className = "",
}: ReactionsVelocityProps) {
	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
					<div className="grid grid-cols-2 gap-4 mb-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="text-center">
								<div className="h-6 bg-stroke rounded w-12 mx-auto mb-1"></div>
								<div className="h-3 bg-stroke rounded w-16 mx-auto"></div>
							</div>
						))}
					</div>
					<div className="h-16 bg-stroke rounded"></div>
				</div>
			</div>
		);
	}

	const hasData = data && (data.totalReactions > 0 || data.postsInRange > 0);

	if (!hasData) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">
					Reactions & Content Velocity
				</h3>
				<div className="text-center py-8">
					<Heart className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted mb-2">No reactions yet</div>
					<div className="text-xs text-text-muted">
						Create engaging content to get reactions
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<h3 className="font-medium text-text mb-4">
				Reactions & Content Velocity
			</h3>

			{/* Mini KPIs */}
			<div className="grid grid-cols-2 gap-4 mb-6">
				<div className="text-center">
					<div className="text-lg font-heading font-semibold text-text">
						{data?.totalReactions || 0}
					</div>
					<div className="text-xs text-text-muted">Total reactions (7d)</div>
				</div>
				<div className="text-center">
					<div className="text-lg font-heading font-semibold text-text">
						{data?.postsInRange || 0}
					</div>
					<div className="text-xs text-text-muted">Posts (7d)</div>
				</div>
				<div className="text-center">
					<div className="text-lg font-heading font-semibold text-text">
						{data?.avgReactionsPerPost?.toFixed(1) || "0.0"}
					</div>
					<div className="text-xs text-text-muted">Avg reactions/post</div>
				</div>
				<div className="text-center">
					<div className="text-lg font-heading font-semibold text-text">
						{data?.postingStreak || 0}
					</div>
					<div className="text-xs text-text-muted">Streak (days)</div>
				</div>
			</div>

			{/* Posting Cadence Sparkline */}
			<div className="space-y-3">
				<div className="text-sm font-medium text-text">
					Posting cadence (last 14 days)
				</div>

				<div className="flex items-center gap-2">
					<div className="flex-1 h-8 flex items-end gap-1">
						{(data?.postingCadence || []).map((day, index) => (
							<div
								key={index}
								className={`flex-1 rounded-sm transition-all ${
									day.hasPost
										? "bg-cta"
										: "bg-background border border-stroke/50"
								}`}
								style={{ height: day.hasPost ? "100%" : "20%" }}
								title={`${day.date}: ${day.hasPost ? "Posted" : "No posts"}`}
							/>
						))}
					</div>
					<div className="text-xs text-text-muted">
						{(data?.postingStreak || 0) > 0
							? `Streak: ${data?.postingStreak || 0}d`
							: "No streak"}
					</div>
				</div>

				{/* Legend */}
				<div className="flex items-center gap-4 text-xs text-text-muted">
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 bg-cta rounded-sm"></div>
						<span>Posted</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 bg-background border border-stroke/50 rounded-sm"></div>
						<span>No posts</span>
					</div>
				</div>
			</div>

			{/* Summary */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span>
						{(data?.postsInRange || 0) > 0
							? `${data?.postsInRange || 0} post${
									(data?.postsInRange || 0) !== 1 ? "s" : ""
							  } in range`
							: "No posts in range"}
					</span>
					<span>
						{(data?.totalReactions || 0) > 0
							? `${data?.totalReactions || 0} total reactions`
							: "No reactions yet"}
					</span>
				</div>
			</div>
		</div>
	);
}
