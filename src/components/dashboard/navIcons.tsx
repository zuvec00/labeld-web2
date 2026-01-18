// components/dashboard/navIcons.tsx
import React from "react";
import {
	LayoutDashboard,
	Radar,
	Package,
	Layers,
	ShoppingBag,
	Wallet,
	Ticket,
	Settings,
	HelpCircle,
	Globe,
	BarChart3,
	FileText,
	CreditCard,
	Palette,
	Store,
	PieChart,
} from "lucide-react";

export const getNavIcon = (iconName: string) => {
	const iconProps = { className: "w-4 h-4" };

	switch (iconName) {
		case "Dashboard":
			return <LayoutDashboard {...iconProps} />;
		case "BrandSpace":
			return <Globe {...iconProps} />;
		case "Radar":
			return <Radar {...iconProps} />;
		case "Pieces":
			return <Package {...iconProps} />;
		case "Collections":
			return <Layers {...iconProps} />;
		case "Orders":
			return <ShoppingBag {...iconProps} />;
		case "Wallet":
			return <Wallet {...iconProps} />;
		case "Events":
			return <Ticket {...iconProps} />;
		case "Settings":
			return <Settings {...iconProps} />;
		case "Help":
			return <HelpCircle {...iconProps} />;
		case "Insights": // Deprecated/Legacy support
		case "Overview":
			return <PieChart {...iconProps} />;
		case "Performance": // Deprecated/Legacy support
			return <BarChart3 {...iconProps} />;
		case "Reports":
			return <FileText {...iconProps} />;
		case "Pricing":
			return <CreditCard {...iconProps} />;
		case "SiteCustomization":
			return <Palette {...iconProps} />;
		case "StorefrontAnalytics":
			return <Store {...iconProps} />;
		case "MarketplaceAnalytics":
			return <Globe {...iconProps} />; // Reuse Globe for now, or maybe ShoppingBag
		case "EventsAnalytics":
			return <Ticket {...iconProps} />;
		default:
			return null;
	}
};
