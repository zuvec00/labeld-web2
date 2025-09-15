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
		default:
			return null;
	}
};
