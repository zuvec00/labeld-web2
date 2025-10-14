// components/FeatureBanner.tsx
"use client";

import React from "react";
import { Sparkles, X } from "lucide-react";
import { FeatureKey } from "@/lib/featureFlags";

interface FeatureBannerProps {
	lockedFeatures: FeatureKey[];
	message?: string;
	onDismiss?: () => void;
	className?: string;
}

export function FeatureBanner({
	lockedFeatures,
	message,
	onDismiss,
	className = "",
}: FeatureBannerProps) {
	const getFeatureDisplayName = (feature: FeatureKey): string => {
		switch (feature) {
			case "events":
				return "Events";
			case "orders":
				return "Orders";
			case "wallet":
				return "Wallet";
			case "sales":
				return "Sales";
			case "brandspace":
				return "Brand Space";
			default:
				return feature;
		}
	};

	const getFeatureIcon = (feature: FeatureKey): string => {
		switch (feature) {
			case "events":
				return "🎫";
			case "orders":
				return "📦";
			case "wallet":
				return "💰";
			case "sales":
				return "📊";
			case "brandspace":
				return "🎨";
			default:
				return "✨";
		}
	};

	if (lockedFeatures.length === 0) return null;

	const defaultMessage =
		lockedFeatures.length === 1
			? `${getFeatureDisplayName(lockedFeatures[0])} dropping this season`
			: `${lockedFeatures
					.map(getFeatureDisplayName)
					.join(" & ")} dropping this season`;

	return (
		<div
			className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-cta/10 via-accent/10 to-edit/10 border border-cta/20 p-4 ${className}`}
		>
			{/* Background pattern */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute inset-0 bg-gradient-to-r from-cta/20 via-transparent to-edit/20"></div>
				<div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
			</div>

			<div className="relative flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-cta animate-pulse" />
						<span className="text-sm font-medium text-text">
							{message || defaultMessage}
						</span>
					</div>

					<div className="flex items-center gap-2">
						{lockedFeatures.map((feature) => (
							<div
								key={feature}
								className="flex items-center gap-1 px-2 py-1 rounded-full bg-bg/50 border border-stroke/50"
							>
								<span className="text-sm">{getFeatureIcon(feature)}</span>
								<span className="text-xs text-text-muted">
									{getFeatureDisplayName(feature)}
								</span>
							</div>
						))}
					</div>
				</div>

				{onDismiss && (
					<button
						onClick={onDismiss}
						className="p-1 rounded-full hover:bg-bg/50 transition-colors"
						title="Dismiss"
					>
						<X className="w-4 h-4 text-text-muted" />
					</button>
				)}
			</div>

			{/* Subtle animation */}
			<div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cta via-accent to-edit animate-pulse"></div>
		</div>
	);
}

// Server component wrapper
export function FeatureBannerServer({
	lockedFeatures,
	message,
	onDismiss,
	className = "",
}: Omit<FeatureBannerProps, "lockedFeatures"> & {
	lockedFeatures?: FeatureKey[];
}) {
	// This will be replaced by the actual server component implementation
	// For now, we'll use a client component that gets the locked features
	return (
		<FeatureBannerClient
			message={message}
			onDismiss={onDismiss}
			className={className}
		/>
	);
}

// Client component that will receive the locked features from server
function FeatureBannerClient({
	message,
	onDismiss,
	className = "",
}: Omit<FeatureBannerProps, "lockedFeatures">) {
	// This is a placeholder - in a real implementation, this would receive
	// the locked features from a server component that calls getLockedFeatures
	const lockedFeatures: FeatureKey[] = ["events", "orders", "wallet"]; // This will be replaced with actual server-side logic

	return (
		<FeatureBanner
			lockedFeatures={lockedFeatures}
			message={message}
			onDismiss={onDismiss}
			className={className}
		/>
	);
}
