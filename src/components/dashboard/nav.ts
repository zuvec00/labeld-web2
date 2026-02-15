import { FeatureKey } from "@/lib/featureFlags";
import { getNavIcon } from "./navIcons";

export type NavItem = {
	label: string;
	href: string;
	icon?: React.ReactNode;
	badge?: string;
	feature?: FeatureKey; // Optional feature gate
	roles?: ("brand" | "eventOrganizer")[]; // Optional: if omitted, shown to all
};

export const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
	{
		title: "Overview",
		items: [
			{ label: "Dashboard", href: "/dashboard", icon: getNavIcon("Dashboard") },
		],
	},
	{
		title: "Brand Space",
		items: [
			{
				label: "Brand Space",
				href: "/brand-space",
				feature: "brandspace",
				icon: getNavIcon("BrandSpace"),
				roles: ["brand"],
			},
			{
				label: "Radar",
				href: "/radar",
				feature: "brandspace",
				icon: getNavIcon("Radar"),
				roles: ["brand"],
			},
			{
				label: "Products",
				href: "/pieces",
				feature: "brandspace",
				icon: getNavIcon("Products"),
				roles: ["brand"],
			},
			{
				label: "Collections",
				href: "/collections",
				feature: "brandspace",
				icon: getNavIcon("Collections"),
				roles: ["brand"],
			},
			{
				label: "Site Customization",
				href: "/brand-space/site-customization",
				feature: "brandspace",
				icon: getNavIcon("SiteCustomization"),
				badge: "PRO",
				roles: ["brand"],
			},
		],
	},
	{
		title: "Event Organizer Space",
		items: [
			{
				label: "Organizer Space",
				href: "/organizer-space",
				feature: "events",
				icon: getNavIcon("EventProfile"),
				roles: ["eventOrganizer"],
			},
			{
				label: "Events",
				href: "/events",
				feature: "events",
				icon: getNavIcon("Events"),
				roles: ["eventOrganizer"],
			},
			{
				label: "Bookings",
				href: "/bookings",
				feature: "events",
				icon: getNavIcon("Bookings"),
				roles: ["eventOrganizer"],
			},
			{
				label: "Event Customization",
				href: "/events/site-customization",
				feature: "events",
				icon: getNavIcon("EventSite"),
				badge: "PRO",
				roles: ["eventOrganizer"],
			},
		],
	},
	{
		title: "Monetization",
		items: [
			{
				label: "Orders",
				href: "/orders",
				feature: "orders",
				icon: getNavIcon("Orders"),
			},
			{
				label: "Wallet",
				href: "/wallet",
				feature: "wallet",
				icon: getNavIcon("Wallet"),
			},
			// { label: "Payouts", href: "/monetization/payouts", feature: "wallet", icon: getNavIcon("Payouts") },
			// { label: "Transactions", href: "/monetization/transactions", feature: "wallet", icon: getNavIcon("Transactions") },
		],
	},
	{
		title: "Studio Analytics",
		items: [
			{
				label: "Overview",
				href: "/analytics/overview",
				icon: getNavIcon("Overview"),
			},
			{
				label: "Storefront",
				href: "/storefront-analytics",
				icon: getNavIcon("StorefrontAnalytics"),
				badge: "PRO",
				roles: ["brand"],
			},
			{
				label: "Marketplace",
				href: "/marketplace-analytics",
				icon: getNavIcon("MarketplaceAnalytics"),
				roles: ["brand"],
			},
			{
				label: "Event Site",
				href: "/events-analytics",
				icon: getNavIcon("EventsAnalytics"),
				badge: "PRO",
				roles: ["eventOrganizer"],
			},
		],
	},
	{
		title: "General",
		items: [
			{ label: "Settings", href: "/settings", icon: getNavIcon("Settings") },
		],
	},
];

