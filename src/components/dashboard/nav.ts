export type NavItem = { label: string; href: string; icon?: React.ReactNode; badge?: string };

export const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Brand Space",
    items: [
      { label: "Brand Space", href: "/brand-space" },
      { label: "Radar", href: "/radar" },
      { label: "Pieces", href: "/pieces" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    title: "Monetization",
    items: [
      { label: "Wallet", href: "/wallet", badge: 'soon' },
      { label: "Events", href: "/events", badge: 'soon' },
    ],
  },
  {
    title: "General",
    items: [
      { label: "Settings", href: "/settings" },
      { label: "Help Desk", href: "/help" },
    ],
  },
];
