// src/app/(dashboard)/dashboard/page.tsx
"use client";

import React from "react";
import { useBrandSpace, BrandSpaceFilters } from "@/hooks/useBrandSpace";
import BrandSpaceControls from "@/components/dashboard/BrandSpaceControls";
import BrandSpaceCards from "@/components/dashboard/BrandSpaceCards";
import EngagementOverview from "@/components/dashboard/EngagementOverview";
import ReactionsVelocity from "@/components/dashboard/ReactionsVelocity";
import CatalogSnapshot from "@/components/dashboard/CatalogSnapshot";
import RecentContent from "@/components/dashboard/RecentContent";
import { FeatureProvider } from "@/components/FeatureProvider";
import GatedMetric from "@/components/GatedMetric";
import GatedWallet from "@/components/GatedWallet";
import GatedRevenueChart from "@/components/GatedRevenueChart";
import GatedFulfillmentSnapshot from "@/components/GatedFulfillmentSnapshot";
import GatedRecentOrders from "@/components/GatedRecentOrders";
import GatedTopPerformers from "@/components/GatedTopPerformers";
import GatedUpcomingEvents from "@/components/GatedUpcomingEvents";

export default function DashboardPage() {
	const [filters, setFilters] = React.useState<BrandSpaceFilters>({
		range: "7days",
	});
	const { user, loading, error, data, refresh } = useBrandSpace(filters);

	const handleFiltersChange = (newFilters: BrandSpaceFilters) => {
		setFilters(newFilters);
	};

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
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
						<p className="text-text-muted mt-1">
							Your brand&apos;s performance overview
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
					{[1, 2, 3, 4, 5, 6].map((i) => (
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
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
					<p className="text-text-muted mt-1">
						Your brand&apos;s performance overview
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

	if (!data) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
					<p className="text-text-muted mt-1">
						Your brand&apos;s performance overview
					</p>
				</div>

				<div className="rounded-lg bg-surface border border-stroke p-8 text-center">
					<div className="text-text-muted">No data available</div>
				</div>
			</div>
		);
	}

	return (
		<FeatureProvider>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
						<p className="text-text-muted mt-1">
							Your brand&apos;s performance overview
						</p>
					</div>
					<button
						onClick={refresh}
						className="px-4 py-2 bg-background border border-stroke text-text rounded-lg hover:bg-surface transition-colors"
					>
						Refresh
					</button>
				</div>

				{/* Controls */}
				<BrandSpaceControls
					filters={filters}
					onFiltersChange={handleFiltersChange}
					loading={loading}
				/>

				{/* Brand Pulse - Above the fold */}
				<div className="mb-6">
					<div className="mb-4">
						<h2 className="text-lg font-heading font-semibold text-text">
							Brand Pulse
						</h2>
						<p className="text-sm text-text-muted">
							Your brand&apos;s live performance metrics
						</p>
					</div>
					<BrandSpaceCards data={data || null} loading={loading} />
				</div>

				{/* Engagement Row */}
				<div className="mb-6">
					<div className="mb-4">
						<h2 className="text-lg font-heading font-semibold text-text">
							Engagement
						</h2>
						<p className="text-sm text-text-muted">
							How your audience interacts with your brand
						</p>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<EngagementOverview
							data={data?.engagement || null}
							loading={loading}
						/>
						<ReactionsVelocity
							data={data?.reactions || null}
							loading={loading}
						/>
					</div>
				</div>

				{/* Catalog & Content Row */}
				<div className="mb-6">
					<div className="mb-4">
						<h2 className="text-lg font-heading font-semibold text-text">
							Catalog & Content
						</h2>
						<p className="text-sm text-text-muted">
							Your latest pieces and posts
						</p>
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<CatalogSnapshot
							items={data?.catalogItems || []}
							loading={loading}
						/>
						<RecentContent
							items={data?.recentContent || []}
							loading={loading}
						/>
					</div>
				</div>

				{/* Commerce Section - Gated */}
				<div className="mb-6">
					<div className="mb-4">
						<h2 className="text-lg font-heading font-semibold text-text-muted">
							Commerce
						</h2>
						<p className="text-sm text-text-muted">
							Sales and fulfillment metrics
						</p>
						<span className="text-xs px-2 py-0.5 rounded-full bg-edit/10 text-edit border border-edit/20 mt-2 inline-block">
							Dropping soon
						</span>
					</div>

					{/* Gated KPI Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
						<GatedMetric
							feature="orders"
							title="GMV"
							value={0}
							subtitle="Gross merchandise value"
							lockedNote="Drops with Orders"
						/>
						<GatedMetric
							feature="orders"
							title="Orders"
							value={0}
							subtitle="Total orders"
							lockedNote="Drops with Orders"
						/>
						<GatedMetric
							feature="orders"
							title="AOV"
							value={0}
							subtitle="Average order value"
							lockedNote="Drops with Orders"
						/>
						<GatedMetric
							feature="wallet"
							title="Payout Eligible"
							value={0}
							subtitle="Ready to withdraw"
							lockedNote="Drops with Wallet"
						/>
						<GatedMetric
							feature="orders"
							title="Pending Fulfillment"
							value={0}
							subtitle="Orders to fulfill"
							lockedNote="Drops with Orders"
						/>
					</div>

					{/* Gated Charts and Tables */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
						<GatedRevenueChart
							data={[]}
							loading={false}
							className="lg:col-span-2"
						/>
						<GatedFulfillmentSnapshot
							counts={{
								unfulfilled: 0,
								shipped: 0,
								delivered: 0,
								cancelled: 0,
							}}
							onReviewOrders={() => {}}
							loading={false}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
						<GatedTopPerformers
							topSKUs={[]}
							topTicketTypes={[]}
							loading={false}
						/>
						<GatedRecentOrders
							orders={[]}
							onOrderClick={() => {}}
							loading={false}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<GatedUpcomingEvents events={[]} loading={false} />
						<GatedWallet walletSummary={undefined} loading={false} />
					</div>
				</div>
			</div>
		</FeatureProvider>
	);
}
