"use client";

"use client";

import React, { useState } from "react";
import { Store, Lock } from "lucide-react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import UpgradeBanner from "@/components/pro/UpgradeBanner";
import OverviewTab from "@/components/analytics/storefront/OverviewTab";
import ProductsTab from "@/components/analytics/storefront/ProductsTab";
import ContentTab from "@/components/analytics/storefront/ContentTab";
import { useStorefrontAnalytics } from "@/hooks/useStorefrontAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = "overview" | "products" | "content";

export default function StorefrontAnalyticsPage() {
	const { roleDetection } = useDashboardContext();
	const isPro = roleDetection?.brandSubscriptionTier === "pro";

	const [activeTab, setActiveTab] = useState<Tab>("overview");
	const { data, loading } = useStorefrontAnalytics("30days");

	const renderTabContent = () => {
		if (loading) return <AnalyticsSkeleton />;
		if (!data)
			return (
				<div className="p-12 text-center text-text-muted">
					Unable to load data.
				</div>
			);

		switch (activeTab) {
			case "overview":
				return <OverviewTab data={data} />;
			case "products":
				return <ProductsTab data={data} />;
			case "content":
				return <ContentTab data={data} />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-8 max-w-[1600px] mx-auto">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="font-heading text-2xl font-semibold">
						Storefront Analytics
					</h1>
					<p className="text-text-muted mt-1">
						Deep dive into your website performance, traffic sources, and
						conversion funnels.
					</p>
				</div>
				{/* Date Picker Placeholder - V1 defaults to 30d */}
				<div className="text-sm font-medium text-text-muted bg-surface-neutral px-3 py-1.5 rounded-md border border-stroke">
					Last 30 Days
				</div>
			</div>

			{!isPro ? (
				<div className="space-y-8">
					<UpgradeBanner
						title="Unlock Storefront Intelligence"
						description="See exactly how users interact with your site, where they drop off, and what drives purchases."
						variant="default"
					/>
					{/* Blurred Preview */}
					<div className="opacity-50 pointer-events-none filter blur-sm">
						<AnalyticsSkeleton />
					</div>
				</div>
			) : (
				<div className="space-y-6">
					{/* Tabs */}
					<div className="flex items-center gap-1 border-b border-stroke pb-0">
						<TabButton
							active={activeTab === "overview"}
							onClick={() => setActiveTab("overview")}
							label="Overview"
						/>
						<TabButton
							active={activeTab === "products"}
							onClick={() => setActiveTab("products")}
							label="Products"
						/>
						<TabButton
							active={activeTab === "content"}
							onClick={() => setActiveTab("content")}
							label="Homepage & Content"
						/>
					</div>

					{/* Content */}
					<div className="min-h-[400px]">{renderTabContent()}</div>

					<p className="text-xs text-text-muted text-center pt-8">
						Analytics are aggregated daily. Data may be delayed by up to 24
						hours.
					</p>
				</div>
			)}
		</div>
	);
}

function TabButton({
	active,
	onClick,
	label,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			onClick={onClick}
			className={`px-4 py-2.5 text-sm font-medium !font-sans border-b-2 transition-colors ${
				active
					? "border-cta text-cta"
					: "border-transparent text-text-muted hover:text-text hover:border-text-muted/30"
			}`}
		>
			{label}
		</button>
	);
}

function AnalyticsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
			</div>
			<div className="grid grid-cols-3 gap-6">
				<Skeleton className="h-[300px] col-span-2" />
				<Skeleton className="h-[300px] col-span-1" />
			</div>
		</div>
	);
}
