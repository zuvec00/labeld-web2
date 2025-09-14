// components/GatedNavItem.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { GatedNavClient } from "./GatedNavClient";

type Props = {
	feature: "events" | "orders" | "wallet" | "sales" | "brandspace";
	href: string;
	icon?: React.ReactNode;
	label: string;
	badge?: string;
	className?: string;
};

export default function GatedNavItem(props: Props) {
	const enabled = isFeatureEnabled(props.feature);
	return <GatedNavClient {...props} enabled={enabled} />;
}
