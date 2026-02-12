// src/app/(dashboard)/dashboard/page.tsx
"use client";

import React, { useEffect } from "react";
import { useBrandSpace, BrandSpaceFilters } from "@/hooks/useBrandSpace";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useEventDashboard } from "@/hooks/useEventDashboard";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useToast } from "@/app/hooks/use-toast";
import BrandSpaceControls from "@/components/dashboard/BrandSpaceControls";
import BrandHealthSection from "@/components/dashboard/BrandHealthSection";
import MomentumSection from "@/components/dashboard/MomentumSection";
import MoneySnapshot from "@/components/dashboard/MoneySnapshot";
import EventHealthSection from "@/components/dashboard/EventHealthSection";
import PromotionSection from "@/components/dashboard/PromotionSection";
import EventRevenueSnapshot from "@/components/dashboard/EventRevenueSnapshot";
import DashboardContextSwitch from "@/components/dashboard/DashboardContextSwitch";
import EventTimelineControls from "@/components/dashboard/EventTimelineControls";
import BrandStoreToggle from "@/components/dashboard/BrandStoreToggle";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import EventOnboardingChecklist from "@/components/onboarding/EventOnboardingChecklist";
import AdvancedHealth from "@/components/pro/AdvancedHealth";
import { X, Lightbulb } from "lucide-react";

const CONTEXT_SWITCH_TIP_KEY = "labeld-context-switch-tip-dismissed";

export default function DashboardPage() {
	const { toast } = useToast();
	const [filters, setFilters] = React.useState<BrandSpaceFilters>({
		range: "7days",
	});
	const [showContextTip, setShowContextTip] = React.useState(false);

	// Role-aware context
	const {
		user,
		loading: contextLoading,
		activeRole,
		setActiveRole,
		canSwitchRoles,
		roleDetection: detectionData,
	} = useDashboardContext();

	// Brand data
	const {
		loading: brandLoading,
		error,
		data: brandData,
		refresh: refreshBrand,
		loadingProgress,
	} = useBrandSpace(filters);

	// Commerce data
	const { data: dashboardData, loading: dashboardLoading } = useDashboard();

	// Analytics data
	const { summary: analytics } = useAnalytics();

	// Event dashboard data with timeline
	const {
		data: eventData,
		loading: eventLoading,
		timelineRange,
		setTimelineRange,
		refresh: refreshEvents,
	} = useEventDashboard();

	const handleFiltersChange = (newFilters: BrandSpaceFilters) => {
		setFilters(newFilters);
	};

	// Pro status (for potential Pro-only insights)
	const isPro = detectionData?.brandSubscriptionTier === "pro";

	// Track previous role for toast notification
	const prevRoleRef = React.useRef<string | null>(null);

	// Show toast when role changes or on initial load
	useEffect(() => {
		if (contextLoading || !detectionData) return;

		const roleName = activeRole === "brand" ? "Brand" : "Events";

		// Only show toast if role actually changed or it's first meaningful load
		if (prevRoleRef.current !== null && prevRoleRef.current !== activeRole) {
			toast({
				title: `Switched to ${roleName}`,
				description: `You're now viewing your ${roleName.toLowerCase()} dashboard`,
				duration: 3000,
			});
		} else if (prevRoleRef.current === null) {
			// First load - show welcome toast
			toast({
				title: `Viewing ${roleName} Dashboard`,
				description:
					activeRole === "brand"
						? "Your brand intelligence overview"
						: "Your event organizer overview",
				duration: 3000,
			});
		}

		prevRoleRef.current = activeRole;
	}, [activeRole, contextLoading, detectionData, toast]);

	// Check if context switch tip should be shown
	useEffect(() => {
		if (canSwitchRoles) {
			const dismissed = localStorage.getItem(CONTEXT_SWITCH_TIP_KEY);
			if (!dismissed) {
				setShowContextTip(true);
			}
		}
	}, [canSwitchRoles]);

	const dismissContextTip = () => {
		setShowContextTip(false);
		localStorage.setItem(CONTEXT_SWITCH_TIP_KEY, "true");
	};

	// Loading state
	const loading =
		contextLoading || (activeRole === "brand" ? brandLoading : eventLoading);

	// Refresh function based on active role
	const refresh = activeRole === "brand" ? refreshBrand : refreshEvents;

	if (!user) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<div className="text-center">
					<div className="text-text-muted">
						Please sign in to view your dashboard
					</div>
				</div>
			</div>
		);
	}

	// Compute commerce metrics
	const gmv = dashboardData?.kpis.gmv ?? 0;
	const ordersCount = dashboardData?.kpis.orders ?? 0;
	const payoutEligible = dashboardData?.kpis.payoutEligible ?? 0;
	const fulfillmentCounts = dashboardData?.fulfillmentCounts ?? {
		unfulfilled: 0,
		shipped: 0,
		delivered: 0,
		cancelled: 0,
	};
	const hasCommerceData = ordersCount > 0 || gmv > 0;
	const hasAnyOrders = dashboardData?.hasAnyOrders ?? false;

	// Determine dynamic title
	const brandName = detectionData?.brandName;
	const organizerName = detectionData?.organizerName;

	let title = "Studio";
	let subtitle = "";

	if (activeRole === "brand") {
		title = brandName ? `${brandName} Studio` : "Studio Setup";
		subtitle = brandName
			? "Your brand intelligence overview"
			: "Complete your brand setup to get started";
	} else {
		title = organizerName ? `${organizerName} Studio` : "Studio Setup";
		subtitle = organizerName
			? "Your event organizer overview"
			: "Complete your organizer setup to get started";
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div>
						{contextLoading ? (
							<div className="space-y-2">
								<div className="h-8 w-48 bg-stroke rounded animate-pulse" />
								<div className="h-4 w-64 bg-stroke rounded animate-pulse" />
							</div>
						) : (
							<>
								<h1 className="font-heading text-2xl font-semibold">{title}</h1>
								<p className="text-text-muted mt-1">{subtitle}</p>
							</>
						)}
					</div>
					<div className="flex items-center gap-3">
						{activeRole === "brand" && <BrandStoreToggle />}
						<button
							onClick={refresh}
							className="px-4 py-2 bg-bg border border-stroke text-text rounded-lg hover:bg-surface transition-colors text-sm"
						>
							Refresh
						</button>
					</div>
				</div>

				{/* Context Switch - only show if user has both roles */}
				<div className="flex items-center gap-3">
					<DashboardContextSwitch
						activeRole={activeRole}
						onRoleChange={setActiveRole}
						canSwitch={canSwitchRoles}
					/>
					{/* Dismissible tip for context switching */}
					{showContextTip && canSwitchRoles && (
						<div className="flex items-center gap-2 px-3 py-1.5 bg-cta/10 border border-cta/20 rounded-lg text-xs">
							<Lightbulb className="w-3.5 h-3.5 text-cta flex-shrink-0" />
							<span className="text-text-muted">
								Switch between Brand & Events anytime
							</span>
							<button
								onClick={dismissContextTip}
								className="p-0.5 hover:bg-cta/20 rounded transition-colors"
							>
								<X className="w-3 h-3 text-text-muted" />
							</button>
						</div>
					)}
				</div>
				{/* Onboarding Checklist (Role-appropriate) */}
				{activeRole === "brand" && <OnboardingChecklist />}
				{activeRole === "eventOrganizer" && <EventOnboardingChecklist />}

				{/* Upgrade CTA for Free Plan */}
				{activeRole === "brand" &&
					detectionData?.brandSubscriptionTier !== "pro" && (
						<div className="rounded-xl border border-cta/20 bg-gradient-to-r from-cta/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
							<div>
								<h3 className="font-heading font-semibold text-text flex items-center gap-2">
									<span className="text-lg">✨</span> Unlock your brand’s full
									potential
								</h3>
								<p className="text-sm text-text-muted mt-1 max-w-xl">
									Get a custom storefront, advanced analytics, and remove Labeld
									branding with Pro.
								</p>
							</div>
							<button
								onClick={() => (window.location.href = "/pricing")}
								className="shrink-0 px-4 py-2 bg-cta text-text font-semibold rounded-lg hover:bg-cta/90 transition-all shadow-sm hover:shadow-md text-sm"
							>
								Upgrade to Pro
							</button>
						</div>
					)}
			</div>

			{/* Controls - different for each role */}
			{activeRole === "brand" && (
				<BrandSpaceControls
					filters={filters}
					onFiltersChange={handleFiltersChange}
					loading={brandLoading}
				/>
			)}

			{activeRole === "eventOrganizer" && (
				<EventTimelineControls
					value={timelineRange}
					onChange={setTimelineRange}
					loading={eventLoading}
				/>
			)}

			{/* === BRAND VIEW === */}
			{activeRole === "brand" && brandData && (
				<>
					<BrandHealthSection
						data={brandData}
						loading={loadingProgress.kpis || loadingProgress.engagement}
					>
						{/* 4.3 Advanced Brand Health (Pro) */}
						{isPro && (
							<AdvancedHealth
								brandData={brandData}
								dashboardData={dashboardData}
								analytics={analytics}
							/>
						)}
					</BrandHealthSection>

					{/* Section C: Money Snapshot - Is attention turning into money? */}
					<MoneySnapshot
						gmv={gmv}
						ordersCount={ordersCount}
						payoutEligible={payoutEligible}
						fulfillmentCounts={fulfillmentCounts}
						loading={dashboardLoading}
						hasCommerceData={hasCommerceData}
						hasAnyOrders={hasAnyOrders}
					/>

					{/* Section B: Momentum & Content - Is your audience reacting? */}
					<MomentumSection
						data={brandData}
						loading={loadingProgress.content || loadingProgress.catalog}
					/>
				</>
			)}

			{/* === EVENT ORGANIZER VIEW === */}
			{activeRole === "eventOrganizer" && (
				<>
					{/* Section A: Event Health - Is your event alive? */}
					<EventHealthSection data={eventData} loading={eventLoading} />
					{/* Section C: Event Revenue Snapshot - Is attention turning into money? */}
					<EventRevenueSnapshot data={eventData} loading={eventLoading} />

					{/* Section B: Promotion & Reach - Are people discovering your events? */}
					<PromotionSection data={eventData} loading={eventLoading} />
				</>
			)}
		</div>
	);
}
