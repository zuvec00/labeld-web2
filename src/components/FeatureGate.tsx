// components/FeatureGate.tsx
"use client";

import React from "react";
import { Lock } from "lucide-react";
import { FeatureKey } from "@/lib/featureFlags";

type Props = {
	feature: FeatureKey;
	enabled: boolean;
	children: React.ReactNode;
	fallback?: React.ReactNode;
	showLockIcon?: boolean;
	className?: string;
};

/**
 * Client-safe gate. We only receive a boolean value; no secrets.
 * For links/buttons, wrap with this to disable interaction when locked.
 */
export function FeatureGate({
	feature,
	enabled,
	children,
	fallback,
	showLockIcon = true,
	className = "",
}: Props) {
	if (enabled) return <>{children}</>;

	return (
		fallback ?? (
			<div
				aria-disabled="true"
				className={`opacity-60 cursor-not-allowed pointer-events-none select-none relative ${className}`}
				title="Coming this season"
			>
				{children}
				{showLockIcon && (
					<div className="absolute top-1 right-1">
						<Lock className="w-3 h-3 text-text-muted" />
					</div>
				)}
			</div>
		)
	);
}

// Server component wrapper that calls the feature flag function
export function FeatureGateServer({
	feature,
	children,
	fallback,
	showLockIcon = true,
	className = "",
}: Omit<Props, "enabled">) {
	// This will be replaced by the actual server component implementation
	// For now, we'll use a client component that gets the enabled state
	return (
		<FeatureGateClient
			feature={feature}
			children={children}
			fallback={fallback}
			showLockIcon={showLockIcon}
			className={className}
		/>
	);
}

// Client component that will receive the enabled state from server
function FeatureGateClient({
	feature,
	children,
	fallback,
	showLockIcon = true,
	className = "",
}: Omit<Props, "enabled">) {
	// This is a placeholder - in a real implementation, this would receive
	// the enabled state from a server component that calls isFeatureEnabled
	const enabled = false; // This will be replaced with actual server-side logic

	return (
		<FeatureGate
			feature={feature}
			enabled={enabled}
			children={children}
			fallback={fallback}
			showLockIcon={showLockIcon}
			className={className}
		/>
	);
}
