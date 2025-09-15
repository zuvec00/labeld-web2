// components/dashboard/BrandSpaceCards.tsx
"use client";

import React from "react";
import {
	TrendingUp,
	TrendingDown,
	Minus,
	Users,
	Package,
	Layers,
	Share2,
	Plus,
	FileText,
} from "lucide-react";
import { BrandSpaceKPIs, BrandSpaceData } from "@/hooks/useBrandSpace";

interface BrandSpaceCardsProps {
	data: BrandSpaceData | null;
	loading?: boolean;
}

function getHeatBucket(score: number): string {
	if (score >= 80) return "on fire";
	if (score >= 60) return "gaining serious heat";
	if (score >= 40) return "warming up";
	if (score >= 20) return "getting noticed";
	return "cold";
}

function getHeatColor(score: number): string {
	if (score >= 80) return "text-red-500";
	if (score >= 60) return "text-orange-500";
	if (score >= 40) return "text-yellow-500";
	if (score >= 20) return "text-blue-500";
	return "text-gray-500";
}

function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor(diffMs / (1000 * 60));

	if (diffDays > 0) return `${diffDays}d ago`;
	if (diffHours > 0) return `${diffHours}h ago`;
	if (diffMinutes > 0) return `${diffMinutes}m ago`;
	return "Just now";
}

function formatLaunchDate(date: Date): string {
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays <= 0) return "Today";
	if (diffDays === 1) return "Tomorrow";
	if (diffDays <= 7) return `In ${diffDays} days`;
	return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function HeatScoreCard({
	kpis,
	heatLog,
}: {
	kpis: BrandSpaceKPIs;
	heatLog: BrandSpaceData["heatLog"];
}) {
	const heatBucket = getHeatBucket(kpis.heatScore);
	const heatColor = getHeatColor(kpis.heatScore);

	const TrendIcon =
		kpis.heatTrend === "up"
			? TrendingUp
			: kpis.heatTrend === "down"
			? TrendingDown
			: Minus;
	const trendColor =
		kpis.heatTrend === "up"
			? "text-green-500"
			: kpis.heatTrend === "down"
			? "text-red-500"
			: "text-gray-500";

	return (
		<div className="rounded-lg bg-surface border border-stroke p-4 hover:border-cta/20 transition-colors">
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-medium text-text-muted">Heat Score</h3>
				<TrendIcon className={`w-4 h-4 ${trendColor}`} />
			</div>

			<div className="text-2xl font-heading font-semibold text-text mb-1">
				{kpis.heatScore.toFixed(2)}
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs text-text-muted capitalize">{heatBucket}</p>
				{heatLog.length > 0 && (
					<div className="text-xs text-text-muted">
						{kpis.heatTrend === "up"
							? "+"
							: kpis.heatTrend === "down"
							? "-"
							: ""}
					</div>
				)}
			</div>

			{/* Mini sparkline */}
			{heatLog.length > 0 && (
				<div className="mt-3 h-8 flex items-end gap-1">
					{heatLog.slice(-14).map((entry, index) => (
						<div
							key={index}
							className="flex-1 bg-cta/20 rounded-sm"
							style={{ height: `${(entry.score / 100) * 100}%` }}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function FollowersCard({ kpis }: { kpis: BrandSpaceKPIs }) {
	return (
		<div className="rounded-lg bg-surface border border-stroke p-4 hover:border-cta/20 transition-colors">
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-medium text-text-muted">Followers</h3>
				<Users className="w-4 h-4 text-text-muted" />
			</div>

			<div className="text-2xl font-heading font-semibold text-text mb-1">
				{kpis.followersCount.toLocaleString()}
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs text-text-muted">
					{kpis.followersChange7d > 0 ? "+" : ""}
					{kpis.followersChange7d} this 7d
				</p>
				{/* <button className="text-xs text-cta hover:text-cta/80 transition-colors flex items-center gap-1">
					<Share2 className="w-3 h-3" />
					Share link
				</button> */}
			</div>
		</div>
	);
}

export function PiecesCard({ kpis }: { kpis: BrandSpaceKPIs }) {
	return (
		<div className="rounded-lg bg-surface border border-stroke p-4 hover:border-cta/20 transition-colors">
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-medium text-text-muted">Pieces</h3>
				<Package className="w-4 h-4 text-text-muted" />
			</div>

			<div className="text-2xl font-heading font-semibold text-text mb-1">
				{kpis.piecesCount}
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs text-text-muted">
					{kpis.piecesAvailable} available now
				</p>
				<a
					href="/pieces"
					className="text-xs font-heading text-cta hover:text-cta/80  transition-colors flex items-center gap-1"
				>
					<Plus className="w-3 h-3" />
					Add piece
				</a>
			</div>
		</div>
	);
}

export function CollectionsCard({ kpis }: { kpis: BrandSpaceKPIs }) {
	return (
		<div className="rounded-lg bg-surface border border-stroke p-4 hover:border-cta/20 transition-colors">
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-medium text-text-muted">Collections</h3>
				<Layers className="w-4 h-4 text-text-muted" />
			</div>

			<div className="text-2xl font-heading font-semibold text-text mb-1">
				{kpis.collectionsCount}
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs text-text-muted">
					{kpis.collectionsPublished} published
				</p>
				{kpis.nextLaunchDate && (
					<span className="text-xs px-2 py-0.5 rounded-full bg-cta/10 text-cta border border-cta/20">
						Next: {formatLaunchDate(kpis.nextLaunchDate)}
					</span>
				)}
			</div>
		</div>
	);
}

export function PostsCard({ kpis }: { kpis: BrandSpaceKPIs }) {
	return (
		<div className="rounded-lg bg-surface border border-stroke p-4 hover:border-cta/20 transition-colors">
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-sm font-medium text-text-muted">Radar Posts</h3>
				<FileText className="w-4 h-4 text-text-muted" />
			</div>

			<div className="text-2xl font-heading font-semibold text-text mb-1">
				{kpis.postsCount}
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs text-text-muted">
					{kpis.lastPostDate
						? `Last: ${formatRelativeTime(kpis.lastPostDate)}`
						: "No posts yet"}
				</p>
				<a
					href="/radar"
					className="text-xs font-heading text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
				>
					<Plus className="w-3 h-3" />
					Create post
				</a>
			</div>
		</div>
	);
}

export default function BrandSpaceCards({
	data,
	loading = false,
}: BrandSpaceCardsProps) {
	if (loading || !data) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className="rounded-lg bg-surface border border-stroke p-4"
					>
						<div className="animate-pulse">
							<div className="h-3 bg-stroke rounded w-20 mb-2"></div>
							<div className="h-8 bg-stroke rounded w-24 mb-2"></div>
							<div className="h-3 bg-stroke rounded w-16"></div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
			<HeatScoreCard kpis={data.kpis} heatLog={data.heatLog} />
			<FollowersCard kpis={data.kpis} />
			<PiecesCard kpis={data.kpis} />
			<CollectionsCard kpis={data.kpis} />
			<PostsCard kpis={data.kpis} />
		</div>
	);
}
