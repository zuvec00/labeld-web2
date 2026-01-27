import { FeatureKey } from "@/lib/featureFlags";
import { getNavIcon } from "./navIcons";

export type NavItem = { 
  label: string; 
  href: string; 
  icon?: React.ReactNode; 
  badge?: string;
  feature?: FeatureKey; // Optional feature gate
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
      { label: "Brand Space", href: "/brand-space", feature: "brandspace", icon: getNavIcon("BrandSpace") },
      { label: "Radar", href: "/radar", feature: "brandspace", icon: getNavIcon("Radar") },
      { label: "Products", href: "/pieces", feature: "brandspace", icon: getNavIcon("Products") },
      { label: "Collections", href: "/collections", feature: "brandspace", icon: getNavIcon("Collections") },
      { label: "Site Customization", href: "/brand-space/site-customization", feature: "brandspace", icon: getNavIcon("SiteCustomization"),badge: "PRO"  },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Overview", href: "/analytics/overview", icon: getNavIcon("Overview") },
      { label: "Storefront", href: "/storefront-analytics", icon: getNavIcon("StorefrontAnalytics"), badge: "PRO" }, // Gated
      { label: "Marketplace", href: "/marketplace-analytics", icon: getNavIcon("MarketplaceAnalytics") },
      { label: "Events", href: "/events-analytics", icon: getNavIcon("EventsAnalytics") },
      // { label: "Reports", href: "/reports", icon: getNavIcon("Reports"), badge: "PRO" }, // Gated
    ],
  },
  {
    title: "Monetization",
    items: [
      { label: "Orders", href: "/orders", feature: "orders", icon: getNavIcon("Orders") },
      { label: "Wallet", href: "/wallet", feature: "wallet", icon: getNavIcon("Wallet") },
      { label: "Events", href: "/events", feature: "events", icon: getNavIcon("Events") },
    ],
  },
  {
    title: "General",
    items: [
      // { label: "Pricing", href: "/pricing", icon: getNavIcon("Pricing") },
      { label: "Settings", href: "/settings", icon: getNavIcon("Settings") },
      // { label: "Help Desk", href: "/help", icon: getNavIcon("Help") },
    ],
  },
];

