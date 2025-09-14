// components/FeatureProvider.tsx (Server Component)
import React from "react";
import {
	isFeatureEnabled,
	getLockedFeatures,
	hasLockedFeatures,
} from "@/lib/featureFlags";
import { FeatureBanner } from "./FeatureBanner";

interface FeatureProviderProps {
	children: React.ReactNode;
}

export function FeatureProvider({ children }: FeatureProviderProps) {
	const lockedFeatures = getLockedFeatures();
	const hasLocked = hasLockedFeatures();

	return (
		<>
			{hasLocked && (
				<div className="mb-6">
					<FeatureBanner
						lockedFeatures={lockedFeatures}
						message="Events & Wallet dropping this season"
					/>
				</div>
			)}
			{children}
		</>
	);
}

// Individual feature gate server component
export function FeatureGateServer({
	feature,
	children,
	fallback,
}: {
	feature: "events" | "orders" | "wallet" | "sales" | "brandspace";
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const enabled = isFeatureEnabled(feature);

	if (enabled) {
		return <>{children}</>;
	}

	return fallback ? <>{fallback}</> : null;
}
