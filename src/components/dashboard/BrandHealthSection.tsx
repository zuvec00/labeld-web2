// components/dashboard/BrandHealthSection.tsx
"use client";

import React, { useState } from "react";
import {
	TrendingUp,
	TrendingDown,
	Minus,
	Users,
	Zap,
	Flame,
	Info,
} from "lucide-react";
import { BrandSpaceData, BrandSpaceKPIs } from "@/hooks/useBrandSpace";

interface BrandHealthSectionProps {
	data: BrandSpaceData | null;
	loading?: boolean;
	children?: React.ReactNode;
}

// Tooltip component for explaining metrics
function MetricTooltip({
	content,
	children,
}: {
	content: string;
	children: React.ReactNode;
}) {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<div className="relative inline-block">
			<div
				onMouseEnter={() => setIsVisible(true)}
				onMouseLeave={() => setIsVisible(false)}
				className="cursor-help"
			>
				{children}
			</div>
			{isVisible && (
				<div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-text bg-surface border border-stroke rounded-lg shadow-lg whitespace-nowrap">
					{content}
					<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
						<div className="border-4 border-transparent border-t-stroke" />
					</div>
				</div>
			)}
		</div>
	);
}

function getHeatBucket(score: number): string {
	if (score >= 80) return "on fire";
	if (score >= 60) return "gaining serious heat";
	if (score >= 40) return "warming up";
	if (score >= 20) return "getting noticed";
	return "cold";
}

function getHeatColor(score: number): string {
	if (score >= 80) return "from-red-500 to-orange-500";
	if (score >= 60) return "from-orange-500 to-yellow-500";
	if (score >= 40) return "from-yellow-500 to-amber-500";
	if (score >= 20) return "from-blue-500 to-cyan-500";
	return "from-gray-500 to-slate-500";
}

function HeatScoreCard({
	kpis,
	heatLog,
}: {
	kpis: BrandSpaceKPIs;
	heatLog: BrandSpaceData["heatLog"];
}) {
	const heatBucket = getHeatBucket(kpis.heatScore);
	const gradientColor = getHeatColor(kpis.heatScore);

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
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-cta/30 transition-all hover:shadow-lg">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<div
						className={`p-2 rounded-lg bg-gradient-to-br ${gradientColor} bg-opacity-10`}
					>
						<Flame className="w-5 h-5 text-white" />
					</div>
					<MetricTooltip content="Heat increases with consistent posting and drops">
						<div className="flex items-center gap-1">
							<h3 className="text-sm font-medium text-text">Heat Score</h3>
							<Info className="w-3 h-3 text-text-muted" />
						</div>
					</MetricTooltip>
				</div>
				<div
					className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
						kpis.heatTrend === "up"
							? "bg-green-500/10 text-green-500"
							: kpis.heatTrend === "down"
								? "bg-red-500/10 text-red-500"
								: "bg-gray-500/10 text-gray-500"
					}`}
				>
					<TrendIcon className="w-3 h-3" />
					<span>
						{kpis.heatTrend === "up"
							? "Rising"
							: kpis.heatTrend === "down"
								? "Cooling"
								: "Stable"}
					</span>
				</div>
			</div>

			<div className="flex items-baseline gap-2 mb-2">
				<span
					className={`text-4xl font-heading font-bold bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent`}
				>
					{kpis.heatScore.toFixed(1)}
				</span>
				<span className="text-sm text-text-muted">/ 100</span>
			</div>

			<p className="text-sm text-text-muted capitalize mb-4">{heatBucket}</p>

			{/* Mini sparkline */}
			{heatLog.length > 0 && (
				<div className="h-10 flex items-end gap-0.5">
					{heatLog.slice(-20).map((entry, index) => (
						<div
							key={index}
							className={`flex-1 rounded-sm bg-gradient-to-t ${gradientColor} opacity-60 hover:opacity-100 transition-opacity`}
							style={{ height: `${Math.max((entry.score / 100) * 100, 4)}%` }}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function FollowersCard({ kpis }: { kpis: BrandSpaceKPIs }) {
	const isPositive = kpis.followersChange7d > 0;
	const isNegative = kpis.followersChange7d < 0;

	return (
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-cta/30 transition-all hover:shadow-lg">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-blue-500/10">
						<Users className="w-5 h-5 text-blue-500" />
					</div>
					<MetricTooltip content="People following your brand on Labeld">
						<div className="flex items-center gap-1">
							<h3 className="text-sm font-medium text-text">Followers</h3>
							<Info className="w-3 h-3 text-text-muted" />
						</div>
					</MetricTooltip>
				</div>
				{kpis.followersChange7d !== 0 && (
					<div
						className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
							isPositive
								? "bg-green-500/10 text-green-500"
								: "bg-red-500/10 text-red-500"
						}`}
					>
						{isPositive ? (
							<TrendingUp className="w-3 h-3" />
						) : (
							<TrendingDown className="w-3 h-3" />
						)}
						<span>
							{isPositive ? "+" : ""}
							{kpis.followersChange7d}
						</span>
					</div>
				)}
			</div>

			<div className="flex items-baseline gap-2 mb-2">
				<span className="text-4xl font-heading font-bold text-text">
					{kpis.followersCount.toLocaleString()}
				</span>
			</div>

			<p className="text-sm text-text-muted">
				{isPositive
					? `+${kpis.followersChange7d} new`
					: isNegative
						? `${kpis.followersChange7d}`
						: "No change"}{" "}
				this week
			</p>
		</div>
	);
}

function EngagementVelocityCard({
	engagement,
}: {
	engagement: BrandSpaceData["engagement"] | null;
}) {
	const velocity = engagement?.totalInteractions || 0;
	const perPost = engagement?.engagementPerPost || 0;

	return (
		<div className="rounded-xl bg-surface border border-stroke p-5 hover:border-cta/30 transition-all hover:shadow-lg">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-purple-500/10">
						<Zap className="w-5 h-5 text-purple-500" />
					</div>
					<MetricTooltip content="Engagement spikes when Moments link to Products">
						<div className="flex items-center gap-1">
							<h3 className="text-sm font-medium text-text">Engagement</h3>
							<Info className="w-3 h-3 text-text-muted" />
						</div>
					</MetricTooltip>
				</div>
			</div>

			<div className="flex items-baseline gap-2 mb-2">
				<span className="text-4xl font-heading font-bold text-text">
					{velocity.toLocaleString()}
				</span>
				<span className="text-sm text-text-muted">interactions</span>
			</div>

			<p className="text-sm text-text-muted">~{perPost.toFixed(1)} per post</p>
		</div>
	);
}

// Guidance micro-copy component
function BrandGuidance({
	kpis,
	engagement,
}: {
	kpis: BrandSpaceKPIs;
	engagement: BrandSpaceData["engagement"] | null;
}) {
	const messages: string[] = [];

	// Generate contextual guidance
	if (kpis.heatScore < 20) {
		messages.push("💡 Start posting consistently to build heat");
	} else if (kpis.heatScore < 40) {
		messages.push("🌱 Your brand is getting noticed! Keep the momentum going");
	} else if (kpis.heatScore >= 60) {
		messages.push("🔥 Great momentum! Consider launching a new drop");
	}

	if (kpis.postsCount === 0) {
		messages.push(
			"📝 Create your first Radar post to start building engagement",
		);
	}

	if (kpis.piecesCount === 0) {
		messages.push("👕 Add pieces to your catalog to enable commerce");
	}

	if (messages.length === 0) {
		messages.push("✨ Your brand is performing well. Keep creating!");
	}

	return (
		<div className="mt-4 p-4 rounded-xl bg-cta/5 border border-cta/20">
			<p className="text-sm text-text">{messages[0]}</p>
		</div>
	);
}

export default function BrandHealthSection({
	data,
	loading = false,
	children,
}: BrandHealthSectionProps) {
	if (loading || !data) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="h-6 w-32 bg-stroke rounded animate-pulse mb-2" />
						<div className="h-4 w-48 bg-stroke rounded animate-pulse" />
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="rounded-xl bg-surface border border-stroke p-5"
						>
							<div className="animate-pulse space-y-3">
								<div className="h-4 w-24 bg-stroke rounded" />
								<div className="h-10 w-20 bg-stroke rounded" />
								<div className="h-3 w-32 bg-stroke rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-heading font-semibold text-text">
					Brand Health
				</h2>
				<p className="text-sm text-text-muted">
					Is your brand alive? Here's your pulse check.
				</p>
			</div>

			{children && (
				<div className="animate-in fade-in slide-in-from-top-2 duration-500">
					{children}
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<HeatScoreCard kpis={data.kpis} heatLog={data.heatLog} />
				<FollowersCard kpis={data.kpis} />
				<EngagementVelocityCard engagement={data.engagement} />
			</div>

			<BrandGuidance kpis={data.kpis} engagement={data.engagement} />
		</div>
	);
}
