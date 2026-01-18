"use client";

import React from "react";
import {
	Lightbulb,
	TrendingUp,
	TrendingDown,
	Minus,
	ArrowRight,
	Flame,
	Eye,
	ShoppingBag,
	Calendar,
	Zap,
	AlertCircle,
	CheckCircle,
	BarChart3,
} from "lucide-react";
import { useBrandSpace } from "@/hooks/useBrandSpace";
import { useDashboard } from "@/hooks/useDashboard";
import { useEventDashboard } from "@/hooks/useEventDashboard";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useMarketBenchmarks } from "@/hooks/useMarketBenchmarks";
import Link from "next/link";
import LockedCard from "@/components/pro/LockedCard";
import UpgradeBanner from "@/components/pro/UpgradeBanner";
import CompetitorBenchmarks from "@/components/pro/CompetitorBenchmarks";
import EventStoreInsights from "@/components/pro/EventStoreInsights";
import { Skeleton } from "@/components/ui/skeleton";

// Types
type InsightType = "success" | "warning" | "info" | "action";
type ConfidenceLevel = "strong" | "early" | "limited";
type InsightGroup = "momentum" | "attention" | "conversion" | "events";

interface Insight {
	id: string;
	group: InsightGroup;
	type: InsightType;
	title: string;
	description: string;
	metric?: string;
	trend?: "up" | "down" | "flat";
	delta?: string;
	confidence: ConfidenceLevel;
	actionLabel?: string;
	actionHref?: string;
	isPlaceholder?: boolean;
}

interface RecommendedAction {
	id: string;
	text: string;
	href: string;
	priority: "high" | "medium" | "low";
}

// Confidence badge component
function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
	const config = {
		strong: { label: "Strong signal", color: "text-green-600 bg-green-500/10" },
		early: { label: "Early signal", color: "text-blue-600 bg-blue-500/10" },
		limited: { label: "Limited data", color: "text-gray-500 bg-gray-500/10" },
	};
	const { label, color } = config[level];

	return (
		<span
			className={`text-[10px] px-2 py-0.5 rounded-full flex-nowrap ${color}`}
		>
			{label}
		</span>
	);
}

// Trend indicator component
function TrendIndicator({
	trend,
	delta,
}: {
	trend?: "up" | "down" | "flat";
	delta?: string;
}) {
	if (!trend) return null;

	const Icon =
		trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
	const color =
		trend === "up"
			? "text-green-500"
			: trend === "down"
			? "text-red-500"
			: "text-gray-500";

	return (
		<div className={`flex items-center gap-1 ${color}`}>
			<Icon className="w-3 h-3" />
			{delta && <span className="text-xs font-medium">{delta}</span>}
		</div>
	);
}

// Insight card component
function InsightCard({
	insight,
	isPro = true,
}: {
	insight: Insight;
	isPro?: boolean;
}) {
	const typeConfig = {
		success: {
			icon: CheckCircle,
			cardBg: "bg-surface",
			iconBg: "bg-green-500/10",
			borderColor: "border-green-500/20",
			iconColor: "text-green-500",
		},
		warning: {
			icon: AlertCircle,
			cardBg: "bg-surface",
			iconBg: "bg-orange-500/10",
			borderColor: "border-orange-500/20",
			iconColor: "text-orange-500",
		},
		info: {
			icon: Lightbulb,
			cardBg: "bg-surface",
			iconBg: "bg-blue-500/10",
			borderColor: "border-blue-500/20",
			iconColor: "text-blue-500",
		},
		action: {
			icon: Zap,
			cardBg: "bg-surface",
			iconBg: "bg-purple-500/10",
			borderColor: "border-purple-500/20",
			iconColor: "text-purple-500",
		},
	};

	const config = typeConfig[insight.type];
	const Icon = config.icon;

	return (
		<div
			className={`rounded-xl border ${config.borderColor} bg-surface p-5 ${
				insight.isPlaceholder ? "opacity-60" : ""
			}`}
		>
			<div className="flex items-start gap-4">
				<div className={`p-2 rounded-lg ${config.iconBg}`}>
					<Icon className={`w-5 h-5 ${config.iconColor}`} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1 flex-nowrap">
						<h3 className="text-smfont-medium text-text">{insight.title}</h3>
						{isPro && <ConfidenceBadge level={insight.confidence} />}
					</div>

					<p className="text-sm text-text-muted mb-3 line-clamp-2">
						{insight.description}
					</p>

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{insight.metric && (
								<span className="text-lg font-heading font-bold text-text">
									{insight.metric}
								</span>
							)}
							{isPro && (
								<TrendIndicator trend={insight.trend} delta={insight.delta} />
							)}
						</div>

						{isPro && insight.actionLabel && insight.actionHref && (
							<Link
								href={insight.actionHref}
								className="inline-flex items-center gap-1 text-xs text-cta hover:text-cta/80 transition-colors"
							>
								{insight.actionLabel}
								<ArrowRight className="w-3 h-3" />
							</Link>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// Insight group component
function InsightGroupSection({
	title,
	icon: Icon,
	insights,
	isPro = true,
}: {
	title: string;
	icon: React.ElementType;
	insights: Insight[];
	isPro?: boolean;
}) {
	if (insights.length === 0) return null;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Icon className="w-4 h-4 text-text-muted" />
				<h2 className="text-sm font-medium text-text-muted uppercase tracking-wide">
					{title}
				</h2>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{insights.map((insight) => (
					<InsightCard key={insight.id} insight={insight} isPro={isPro} />
				))}
			</div>
		</div>
	);
}

// Recommended actions section
function RecommendedActionsSection({
	actions,
}: {
	actions: RecommendedAction[];
}) {
	if (actions.length === 0) return null;

	return (
		<div className="p-5 rounded-xl bg-surface border border-purple-500/20">
			<div className="flex items-center gap-2 mb-4">
				<div className="p-1.5 rounded-md bg-purple-500/10">
					<Zap className="w-4 h-4 text-purple-500" />
				</div>
				<h2 className="text-sm font-medium text-text">
					Recommended next moves
				</h2>
			</div>
			<div className="space-y-2">
				{actions.map((action) => (
					<Link
						key={action.id}
						href={action.href}
						className="flex items-center justify-between p-3 rounded-lg bg-bg border border-stroke/50 hover:bg-surface hover:border-purple-500/30 transition-all group"
					>
						<span className="text-sm text-text">{action.text}</span>
						<ArrowRight className="w-4 h-4 text-text-muted group-hover:text-purple-500 transition-colors" />
					</Link>
				))}
			</div>
		</div>
	);
}

// Metric Card for Overview
function OverviewMetric({
	label,
	value,
	subtext,
	loading = false,
}: {
	label: string;
	value: string;
	subtext?: string;
	loading?: boolean;
}) {
	return (
		<div className="p-4 rounded-xl bg-surface border border-stroke">
			<p className="text-xs text-text-muted uppercase tracking-wide mb-1">
				{label}
			</p>
			{loading ? (
				<Skeleton className="h-8 w-24 mb-1" />
			) : (
				<p className="text-2xl font-heading font-bold text-text mb-1">
					{value}
				</p>
			)}
			{subtext && <p className="text-xs text-text-muted">{subtext}</p>}
		</div>
	);
}

// Loading Skeletons for Insights
function InsightSkeletons() {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Skeleton className="w-4 h-4 rounded-full" />
				<Skeleton className="h-4 w-24" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Skeleton className="h-32 w-full rounded-xl" />
				<Skeleton className="h-32 w-full rounded-xl" />
			</div>
		</div>
	);
}

export default function AnalyticsOverviewPage() {
	const { data: brandData, loading: brandLoading } = useBrandSpace({
		range: "30days",
	});
	const { data: dashboardData, loading: dashboardLoading } = useDashboard();
	const { data: eventData, loading: eventLoading } = useEventDashboard();
	const { data: benchmarksData, loading: benchmarksLoading } =
		useMarketBenchmarks("global");

	const { roleDetection } = useDashboardContext();
	const isPro = roleDetection?.brandSubscriptionTier === "pro";

	// --- LOGIC MIGRATION FROM INSIGHTS START ---
	// (Keeping the logic identical to Insights for now to ensure we have the data)
	const generateInsights = (): Record<InsightGroup, Insight[]> => {
		const groups: Record<InsightGroup, Insight[]> = {
			momentum: [],
			attention: [],
			conversion: [],
			events: [],
		};

		// Momentum
		if (brandData) {
			if (brandData.kpis.heatScore < 20) {
				groups.momentum.push({
					id: "low-heat",
					group: "momentum",
					type: "warning",
					title: "Your brand is cooling down",
					description: "Heat has dropped due to reduced posting activity.",
					metric: `${brandData.kpis.heatScore.toFixed(1)}`,
					trend: "down",
					confidence: "strong",
					actionLabel: "Create a Radar post",
					actionHref: "/radar",
				});
			} else {
				groups.momentum.push({
					id: "stable-heat",
					group: "momentum",
					type: "info",
					title: "Brand momentum is stable",
					description: "Consistent activity keeps your heat score steady.",
					metric: `${brandData.kpis.heatScore.toFixed(1)}`,
					trend: "flat",
					confidence: "strong",
				});
			}
		}

		// Attention
		if (brandData) {
			if (brandData.engagement.totalInteractions > 0) {
				const followers = brandData.kpis.followersCount || 1;
				const rate = (brandData.engagement.totalInteractions / followers) * 100;
				if (rate > 5) {
					groups.attention.push({
						id: "high-engagement",
						group: "attention",
						type: "success",
						title: "High engagement rate",
						description: "Your audience is actively interacting.",
						metric: `${rate.toFixed(1)}%`,
						trend: "up",
						confidence: "strong",
					});
				} else {
					// Logic from screenshot: "Your Radar posts are driving traffic"
					groups.attention.push({
						id: "radar-traffic",
						group: "attention",
						type: "success",
						title: "Your Radar posts are driving traffic",
						description: `${brandData.engagement.totalInteractions} clicks to your store/products from Radar.`,
						metric: `${brandData.engagement.totalInteractions} clicks`,
						trend: "up",
						confidence: "early",
					});
				}
			}
		}

		// Conversion
		if (dashboardData) {
			if (dashboardData.kpis.payoutEligible > 0) {
				groups.conversion.push({
					id: "revenue-ready",
					group: "conversion",
					type: "success",
					title: "You have money ready to withdraw",
					description: "Funds from your sales are eligible for payout.",
					metric: `₦${(
						dashboardData.kpis.payoutEligible / 100
					).toLocaleString()}`,
					confidence: "strong",
					actionLabel: "View wallet",
					actionHref: "/wallet",
				});
			}
			// Static/Placeholder logic based on screenshot
			groups.conversion.push({
				id: "drops-moments",
				group: "conversion",
				type: "info",
				title: "Drops with Moments convert 2.1x better",
				description: "Link your drops to Radar posts to increase conversion.",
				confidence: "limited",
			});
		}

		// Events
		if (eventData) {
			const ticketSalesRate = eventData.kpis.ordersPerDay || 0;
			if (ticketSalesRate < 1 && eventData.kpis.upcomingEventsCount > 0) {
				groups.events.push({
					id: "slow-sales",
					group: "events",
					type: "warning",
					title: "Ticket sales are slow",
					description: "Consider promoting your event more.",
					metric: `${ticketSalesRate.toFixed(1)}/day`,
					confidence: "strong",
					actionLabel: "Promote event",
					actionHref: "/events",
				});
			}

			if (eventData.kpis.checkInRate > 0 && eventData.kpis.checkInRate < 30) {
				groups.events.push({
					id: "moderate-checkin",
					group: "events",
					type: "info",
					title: "Moderate check-in rate",
					description: `${eventData.kpis.checkInRate.toFixed(
						0
					)}% of ticket holders showed up.`,
					metric: `${eventData.kpis.checkInRate.toFixed(0)}%`,
					confidence: "strong",
				});
			} else {
				// Fallback generic event insight
				groups.events.push({
					id: "event-customers",
					group: "events",
					type: "info",
					title: "Event attendees could become customers",
					description: "Link event merch to drive post-event sales.",
					confidence: "limited",
					actionLabel: "Link merch",
					actionHref: "/events",
				});
			}
		}

		return groups;
	};

	const insightGroups = generateInsights();
	const displayedInsights = insightGroups; // Show all for now, filter in UI
	// --- LOGIC MIGRATION END ---

	// Metrics Calculation
	const uniqueUsers = brandData?.engagement?.uniqueUsers || 0;
	const orders = dashboardData?.kpis.orders || 0;
	const gmv = dashboardData?.kpis.gmv || 0;
	// Conversion Rate: Orders / Unique Users (Approximation)
	const conversionRate = uniqueUsers > 0 ? (orders / uniqueUsers) * 100 : 0;

	return (
		<div className="space-y-8 pb-10">
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div>
					<h1 className="font-heading text-2xl font-semibold">Overview</h1>
					<p className="text-text-muted mt-1">
						High-level health and performance of your brand.
					</p>
				</div>
			</div>

			{/* Market Benchmarks */}
			{brandLoading || benchmarksLoading ? (
				<Skeleton className="w-full h-48 rounded-xl" />
			) : (
				<CompetitorBenchmarks
					isPro={isPro}
					metrics={{
						conversionRate,
						engagementRate: brandData?.engagement?.uniqueUsers
							? (brandData.engagement.totalInteractions /
									brandData.engagement.uniqueUsers) *
							  100 // Rough calc
							: 0,
					}}
					benchmarks={benchmarksData}
				/>
			)}

			{/* Key Metrics Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<OverviewMetric
					label="Total Reach"
					value={
						brandData?.engagement?.totalInteractions?.toLocaleString() || "0"
					}
					subtext="Interactions"
					loading={brandLoading}
				/>
				<OverviewMetric
					label="Total Orders"
					value={orders.toLocaleString()}
					loading={dashboardLoading}
				/>
				<OverviewMetric
					label="Revenue"
					value={`₦${(gmv / 100).toLocaleString()}`}
					loading={dashboardLoading}
				/>
				<OverviewMetric
					label="Conversion Rate"
					value={`${conversionRate.toFixed(2)}%`}
					subtext="Visits to Order"
					loading={brandLoading || dashboardLoading}
				/>
			</div>

			{/* Insights Section */}
			<div className="space-y-6">
				<div className="flex items-center gap-2">
					<Lightbulb className="w-5 h-5 text-text" />
					<h2 className="text-lg font-heading font-semibold">Insights</h2>
				</div>

				{brandLoading ? (
					<>
						<InsightSkeletons />
					</>
				) : (
					<>
						{displayedInsights.momentum.length > 0 && (
							<InsightGroupSection
								title="Momentum"
								icon={Flame}
								insights={displayedInsights.momentum}
								isPro={isPro}
							/>
						)}

						{displayedInsights.attention.length > 0 && (
							<InsightGroupSection
								title="Attention"
								icon={Eye}
								insights={displayedInsights.attention}
								isPro={isPro}
							/>
						)}
					</>
				)}

				{/* Conversion Insights */}
				{dashboardLoading ? (
					<InsightSkeletons />
				) : (
					displayedInsights.conversion.length > 0 && (
						<InsightGroupSection
							title="Conversion"
							icon={ShoppingBag}
							insights={displayedInsights.conversion}
							isPro={isPro}
						/>
					)
				)}

				{/* Event Insights */}
				{eventLoading ? (
					<InsightSkeletons />
				) : (
					displayedInsights.events.length > 0 && (
						<InsightGroupSection
							title="Events"
							icon={Calendar}
							insights={displayedInsights.events}
							isPro={isPro}
						/>
					)
				)}

				{/* Fallback Empty State */}
				{!brandLoading &&
					!dashboardLoading &&
					!eventLoading &&
					Object.values(displayedInsights).every((g) => g.length === 0) && (
						<p className="text-text-muted text-sm">
							No specific insights available yet.
						</p>
					)}
			</div>

			{/* Ecosystem Component */}
			<EventStoreInsights isPro={isPro} />
		</div>
	);
}
