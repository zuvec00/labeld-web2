// src/app/(dashboard)/dashboard/page.tsx
"use client";

import React from "react";
import { useBrandSpace, BrandSpaceFilters } from "@/hooks/useBrandSpace";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useEventDashboard } from "@/hooks/useEventDashboard";
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

export default function DashboardPage() {
	const [filters, setFilters] = React.useState<BrandSpaceFilters>({
		range: "7days",
	});

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

	if (loading) {
		return (
			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
						<p className="text-text-muted mt-1">
							{activeRole === "brand"
								? "Your brand intelligence overview"
								: "Your event organizer overview"}
						</p>
					</div>
					<div className="animate-pulse">
						<div className="h-10 w-40 bg-stroke rounded-lg"></div>
					</div>
				</div>

				{/* Skeleton sections */}
				<div className="space-y-4">
					<div>
						<div className="h-6 w-32 bg-stroke rounded animate-pulse mb-2" />
						<div className="h-4 w-48 bg-stroke rounded animate-pulse" />
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

				<div className="space-y-4">
					<div>
						<div className="h-6 w-40 bg-stroke rounded animate-pulse mb-2" />
						<div className="h-4 w-64 bg-stroke rounded animate-pulse" />
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="space-y-4">
							<div className="h-5 w-32 bg-stroke rounded animate-pulse" />
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="h-24 rounded-xl bg-stroke animate-pulse"
									/>
								))}
							</div>
						</div>
						<div className="space-y-4">
							<div className="h-5 w-32 bg-stroke rounded animate-pulse" />
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="h-16 rounded-lg bg-stroke animate-pulse"
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error && activeRole === "brand") {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
					<p className="text-text-muted mt-1">
						Your brand intelligence overview
					</p>
				</div>

				<div className="rounded-lg bg-surface border border-stroke p-8 text-center">
					<div className="text-red-600 mb-2">Error loading dashboard</div>
					<div className="text-text-muted mb-4">{error}</div>
					<button
						onClick={refresh}
						className="px-4 py-2 bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors"
					>
						Try Again
					</button>
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
						<h1 className="font-heading text-2xl font-semibold">{title}</h1>
						<p className="text-text-muted mt-1">{subtitle}</p>
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
				<DashboardContextSwitch
					activeRole={activeRole}
					onRoleChange={setActiveRole}
					canSwitch={canSwitchRoles}
				/>
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
					{/* Section A: Brand Health - Is your brand alive? */}
					<BrandHealthSection
						data={brandData}
						loading={loadingProgress.kpis || loadingProgress.engagement}
					/>

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
