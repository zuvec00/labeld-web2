// src/app/(dashboard)/insights/page.tsx
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
	Activity,
} from "lucide-react";
import { useBrandSpace } from "@/hooks/useBrandSpace";
import { useDashboard } from "@/hooks/useDashboard";
import { useEventDashboard } from "@/hooks/useEventDashboard";
import { useAnalytics } from "@/hooks/useAnalytics";
import Link from "next/link";

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
		<span className={`text-[10px] px-2 py-0.5 rounded-full ${color}`}>
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
function InsightCard({ insight }: { insight: Insight }) {
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
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-sm font-medium text-text truncate">
							{insight.title}
						</h3>
						<ConfidenceBadge level={insight.confidence} />
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
							<TrendIndicator trend={insight.trend} delta={insight.delta} />
						</div>

						{insight.actionLabel && insight.actionHref && (
							<Link
								href={insight.actionHref}
								className="inline-flex items-center gap-1 text-xs text-cta hover:text-cta/80 transition-colors"
							>
								{insight.actionLabel}
								<ArrowRight className="w-3 h-3" />
							</Link>
						)}
					</div>

					{insight.isPlaceholder && (
						<span className="inline-block mt-2 px-2 py-1 text-[10px] bg-stroke/50 text-text-muted rounded">
							DEV: Data source needed
						</span>
					)}
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
}: {
	title: string;
	icon: React.ElementType;
	insights: Insight[];
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
					<InsightCard key={insight.id} insight={insight} />
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

export default function InsightsPage() {
	const { data: brandData, loading: brandLoading } = useBrandSpace({
		range: "7days",
	});
	const { data: dashboardData, loading: dashboardLoading } = useDashboard();
	const { data: eventData, loading: eventLoading } = useEventDashboard();
	const { summary: analytics, loading: analyticsLoading } = useAnalytics(30);

	const loading =
		brandLoading || dashboardLoading || eventLoading || analyticsLoading;

	// Generate insights grouped by intent
	const generateInsights = (): Record<InsightGroup, Insight[]> => {
		const groups: Record<InsightGroup, Insight[]> = {
			momentum: [],
			attention: [],
			conversion: [],
			events: [],
		};

		// === MOMENTUM INSIGHTS ===
		if (brandData) {
			// Heat trend
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
			} else if (brandData.kpis.heatScore >= 60) {
				groups.momentum.push({
					id: "high-heat",
					group: "momentum",
					type: "success",
					title: "Your brand is on fire!",
					description: "Great momentum. Perfect time to launch a new drop.",
					metric: `${brandData.kpis.heatScore.toFixed(1)}`,
					trend: "up",
					confidence: "strong",
					actionLabel: "Create a collection",
					actionHref: "/collections",
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

			// Posting cadence
			if (brandData.reactions.postingStreak >= 7) {
				groups.momentum.push({
					id: "posting-streak",
					group: "momentum",
					type: "success",
					title: "Amazing posting streak!",
					description: `${brandData.reactions.postingStreak} days of consistent posting. This drives brand heat.`,
					metric: `${brandData.reactions.postingStreak} days`,
					trend: "up",
					confidence: "strong",
				});
			} else if (
				brandData.reactions.postingStreak === 0 &&
				brandData.kpis.postsCount > 0
			) {
				groups.momentum.push({
					id: "broken-streak",
					group: "momentum",
					type: "warning",
					title: "Your posting streak is broken",
					description:
						"Consistent posting drives engagement. Try to post daily.",
					confidence: "strong",
					actionLabel: "Create a post",
					actionHref: "/radar",
				});
			}
		}

		// === ATTENTION INSIGHTS ===
		if (brandData) {
			// Engagement vs followers (if we have data)
			if (brandData.engagement.totalInteractions > 0) {
				const engagementRate =
					brandData.kpis.followersCount > 0
						? (brandData.engagement.totalInteractions /
								brandData.kpis.followersCount) *
						  100
						: 0;

				if (engagementRate > 5) {
					groups.attention.push({
						id: "high-engagement",
						group: "attention",
						type: "success",
						title: "High engagement rate",
						description:
							"Your audience is actively interacting with your content.",
						metric: `${engagementRate.toFixed(1)}%`,
						trend: "up",
						confidence: brandData.kpis.followersCount > 10 ? "strong" : "early",
					});
				}
			}

			// Reactions insight
			if (brandData.reactions.totalReactions > 10) {
				groups.attention.push({
					id: "reactions",
					group: "attention",
					type: "success",
					title: "People are reacting to your content",
					description:
						"High reactions indicate your content resonates with your audience.",
					metric: `${brandData.reactions.totalReactions} reactions`,
					confidence: "strong",
				});
			}

			// Real Radar performance data
			if (analytics) {
				if (analytics.radarToStoreClicks > 0) {
					groups.attention.push({
						id: "radar-performance",
						group: "attention",
						type: "success",
						title: "Your Radar posts are driving traffic",
						description: `${analytics.radarToStoreClicks} clicks to your store/products from Radar.`,
						metric: `${analytics.radarToStoreClicks} clicks`,
						confidence: analytics.radarToStoreClicks > 10 ? "strong" : "early",
						trend: "up",
					});
				} else {
					groups.attention.push({
						id: "radar-performance-empty",
						group: "attention",
						type: "info",
						title: "Start tracking Radar traffic",
						description: "Share links in your Radar posts to track clicks.",
						confidence: "limited",
					});
				}
			}
		}

		// === CONVERSION INSIGHTS ===
		if (dashboardData) {
			// Orders waiting
			if (dashboardData.fulfillmentCounts.unfulfilled > 3) {
				groups.conversion.push({
					id: "pending-fulfillment",
					group: "conversion",
					type: "warning",
					title: "Orders waiting to be fulfilled",
					description: "Quick fulfillment improves customer satisfaction.",
					metric: `${dashboardData.fulfillmentCounts.unfulfilled} orders`,
					confidence: "strong",
					actionLabel: "View orders",
					actionHref: "/orders",
				});
			}

			// Payout ready
			if (dashboardData.kpis.payoutEligible > 0) {
				groups.conversion.push({
					id: "payout-ready",
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

			// Drop linkage / Moment conversions
			if (analytics) {
				if (analytics.momentConversions > 0) {
					groups.conversion.push({
						id: "moment-conversions",
						group: "conversion",
						type: "success",
						title: "Moments are driving sales",
						description:
							"Shoppers are buying products directly from your Moments.",
						metric: `${analytics.momentConversions} sales`,
						confidence: "strong",
					});
				} else if (analytics.momentToProductClicks > 0) {
					groups.conversion.push({
						id: "moment-clicks",
						group: "conversion",
						type: "info",
						title: "Moments are getting clicks",
						description: `${analytics.momentToProductClicks} shoppers clicked products in your Moments.`,
						confidence: "early",
					});
				} else {
					groups.conversion.push({
						id: "drops-moments",
						group: "conversion",
						type: "info",
						title: "Drops with Moments convert 2.1× better",
						description:
							"Link your drops to Radar posts to increase conversion.",
						confidence: "limited",
					});
				}
			}

			// Store visits (derived from events or traffic)
			if (
				brandData &&
				brandData.engagement.totalInteractions > 0 &&
				dashboardData.kpis.orders === 0
			) {
				groups.conversion.push({
					id: "engagement-no-conversion",
					group: "conversion",
					type: "action",
					title: "Engagement is high but no sales yet",
					description:
						"Your content is getting reactions. Add pieces to convert to sales.",
					confidence: "early",
					actionLabel: "Add a piece",
					actionHref: "/pieces",
				});
			}
		}

		// === EVENTS INSIGHTS (only if user has events) ===
		if (
			eventData &&
			(eventData.kpis.upcomingEventsCount > 0 || eventData.kpis.totalOrders > 0)
		) {
			// Ticket velocity
			if (eventData.kpis.ordersPerDay > 0) {
				const velocityStatus =
					eventData.kpis.ordersPerDay > 1
						? "success"
						: eventData.kpis.ordersPerDay > 0.3
						? "info"
						: "warning";
				groups.events.push({
					id: "ticket-velocity",
					group: "events",
					type: velocityStatus,
					title:
						eventData.kpis.ordersPerDay > 1
							? "Tickets are selling fast!"
							: eventData.kpis.ordersPerDay > 0.3
							? "Steady ticket sales"
							: "Ticket sales are slow",
					description:
						velocityStatus === "warning"
							? "Consider promoting your event more."
							: "Your event promotion is working.",
					metric: `${eventData.kpis.ordersPerDay.toFixed(1)}/day`,
					trend: eventData.trend,
					confidence: "strong",
					actionLabel:
						velocityStatus === "warning" ? "Promote event" : undefined,
					actionHref: velocityStatus === "warning" ? "/events" : undefined,
				});
			}

			// Check-in rate (for past events)
			if (eventData.kpis.totalCheckedIn > 0 && eventData.kpis.checkInRate > 0) {
				groups.events.push({
					id: "checkin-rate",
					group: "events",
					type: eventData.kpis.checkInRate > 70 ? "success" : "info",
					title:
						eventData.kpis.checkInRate > 70
							? "Great event attendance!"
							: "Moderate check-in rate",
					description: `${eventData.kpis.checkInRate.toFixed(
						0
					)}% of ticket holders showed up.`,
					metric: `${eventData.kpis.checkInRate.toFixed(0)}%`,
					confidence: "strong",
				});
			}

			// Event -> Store Spillover
			if (analytics && analytics.eventToStoreSpillover > 0) {
				groups.events.push({
					id: "event-store-spillover",
					group: "events",
					type: "success",
					title: "Event attendees are browsing your store",
					description: `${analytics.eventToStoreSpillover} attendees visited your store or products.`,
					metric: `${analytics.eventToStoreSpillover} visits`,
					confidence: analytics.eventToStoreSpillover > 10 ? "strong" : "early",
					actionLabel: "View products",
					actionHref: "/pieces",
				});
			} else if (eventData.kpis.totalTicketsSold > 0) {
				groups.events.push({
					id: "event-store-spillover-empty",
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

	// Generate recommended actions
	const generateActions = (): RecommendedAction[] => {
		const actions: RecommendedAction[] = [];

		if (brandData) {
			if (brandData.kpis.heatScore < 30) {
				actions.push({
					id: "post-radar",
					text: "Post a Radar today to rebuild momentum",
					href: "/radar",
					priority: "high",
				});
			}

			if (
				brandData.kpis.piecesCount === 0 &&
				brandData.engagement.totalInteractions > 0
			) {
				actions.push({
					id: "add-piece",
					text: "Add your first piece to start selling",
					href: "/pieces",
					priority: "high",
				});
			}
		}

		if (dashboardData && dashboardData.fulfillmentCounts.unfulfilled > 0) {
			actions.push({
				id: "fulfill-orders",
				text: `Fulfill ${
					dashboardData.fulfillmentCounts.unfulfilled
				} pending order${
					dashboardData.fulfillmentCounts.unfulfilled > 1 ? "s" : ""
				}`,
				href: "/orders",
				priority: "high",
			});
		}

		if (
			eventData &&
			eventData.kpis.ordersPerDay < 0.5 &&
			eventData.kpis.upcomingEventsCount > 0
		) {
			actions.push({
				id: "promote-event",
				text: "Promote your event again — momentum is slowing",
				href: "/radar",
				priority: "medium",
			});
		}

		// Generic suggestions if we have few actions
		if (actions.length < 2) {
			actions.push({
				id: "link-moment",
				text: "Link your next Moment to a Drop",
				href: "/radar",
				priority: "low",
			});
		}

		return actions.slice(0, 3); // Max 3 actions
	};

	const insightGroups = generateInsights();
	const recommendedActions = generateActions();

	const hasAnyInsights = Object.values(insightGroups).some((g) => g.length > 0);

	if (loading) {
		return (
			<div className="space-y-6">
				<div>
					<div className="h-8 w-32 bg-stroke rounded animate-pulse mb-2" />
					<div className="h-4 w-64 bg-stroke rounded animate-pulse" />
				</div>
				<div className="space-y-8">
					{[1, 2, 3].map((i) => (
						<div key={i} className="space-y-3">
							<div className="h-4 w-24 bg-stroke rounded animate-pulse" />
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{[1, 2].map((j) => (
									<div
										key={j}
										className="rounded-xl bg-surface border border-stroke p-5"
									>
										<div className="animate-pulse space-y-3">
											<div className="h-10 w-10 bg-stroke rounded-lg" />
											<div className="h-4 w-48 bg-stroke rounded" />
											<div className="h-3 w-full bg-stroke rounded" />
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="font-heading text-2xl font-semibold">Insights</h1>
				<p className="text-text-muted mt-1">
					What's happening with your brand and what to do next.
				</p>
			</div>

			{hasAnyInsights ? (
				<>
					{/* Momentum */}
					<InsightGroupSection
						title="Momentum"
						icon={Flame}
						insights={insightGroups.momentum}
					/>

					{/* Attention */}
					<InsightGroupSection
						title="Attention"
						icon={Eye}
						insights={insightGroups.attention}
					/>

					{/* Conversion */}
					<InsightGroupSection
						title="Conversion"
						icon={ShoppingBag}
						insights={insightGroups.conversion}
					/>

					{/* Events (only if has events) */}
					<InsightGroupSection
						title="Events"
						icon={Calendar}
						insights={insightGroups.events}
					/>

					{/* Recommended Actions */}
					<RecommendedActionsSection actions={recommendedActions} />
				</>
			) : (
				<div className="p-12 rounded-xl border border-dashed border-stroke text-center">
					<Lightbulb className="w-12 h-12 text-text-muted mx-auto mb-4" />
					<h3 className="text-lg font-medium text-text mb-2">
						No insights yet
					</h3>
					<p className="text-sm text-text-muted max-w-md mx-auto">
						Start creating content and making sales. As your brand grows, we'll
						surface actionable insights to help you make better decisions.
					</p>
				</div>
			)}

			{/* Developer Notes - Only show if no analytics data yet */}
			{process.env.NODE_ENV === "development" &&
				(!analytics || analytics.radarToStoreClicks === 0) && (
					<div className="p-4 rounded-xl bg-surface border border-blue-500/20">
						<h4 className="text-sm font-medium text-blue-500 mb-2">
							📊 Analytics Integration Status
						</h4>
						<p className="text-xs text-text-muted mb-2">
							Waiting for data from Shopping/Events apps. Once implemented:
						</p>
						<ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
							<li>Radar clicks will replace placeholder insights</li>
							<li>Moment conversions will appear in Conversion section</li>
							<li>Event spillover will appear in Events section</li>
						</ul>
					</div>
				)}
		</div>
	);
}
