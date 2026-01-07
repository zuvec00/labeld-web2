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
      { label: "Pieces", href: "/pieces", feature: "brandspace", icon: getNavIcon("Pieces") },
      { label: "Collections", href: "/collections", feature: "brandspace", icon: getNavIcon("Collections") },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Insights", href: "/insights", icon: getNavIcon("Insights") },
      { label: "Performance", href: "/performance", icon: getNavIcon("Performance") },
      { label: "Reports", href: "/reports", icon: getNavIcon("Reports") },
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
      { label: "Settings", href: "/settings", icon: getNavIcon("Settings") },
      // { label: "Help Desk", href: "/help", icon: getNavIcon("Help") },
    ],
  },
];

