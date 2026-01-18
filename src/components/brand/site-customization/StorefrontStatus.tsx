import React, { useState } from "react";
import { ExternalLink, CheckCircle, Store, ShoppingBag } from "lucide-react";
import Button from "@/components/ui/button";
import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";
import MaintenanceModal from "@/components/modals/MaintenanceModal";

interface StorefrontStatusProps {
	username: string;
	brandName: string;
	isPro: boolean;
}

export default function StorefrontStatus({
	username,
	brandName,
	isPro,
}: StorefrontStatusProps) {
	// Onboarding Check
	const { isComplete } = useBrandOnboardingStatus();
	const [showMaintenance, setShowMaintenance] = useState(false);

	// Construct URLs based on plan
	const shopUrl = isPro
		? `https://${username}.labeld.app`
		: `https://shop.labeld.app/${username}`;

	const displayUrl = isPro
		? `${username}.labeld.app`
		: `shop.labeld.app/${username}`;

	const handleVisitStore = () => {
		if (isComplete) {
			window.open(shopUrl, "_blank");
		} else {
			setShowMaintenance(true);
		}
	};

	return (
		<>
			<div className="bg-surface border border-stroke rounded-2xl p-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
					{/* Left: Status Info */}
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div
								className={`w-12 h-12 rounded-xl flex items-center justify-center ${
									isPro ? "bg-accent/10" : "bg-stroke"
								}`}
							>
								{isPro ? (
									<Store
										className={`w-6 h-6 ${
											isPro ? "text-accent" : "text-text-muted"
										}`}
									/>
								) : (
									<ShoppingBag className="w-6 h-6 text-text-muted" />
								)}
							</div>
							<div>
								<h2 className="font-heading font-semibold text-lg">
									{isPro ? "Brand Storefront" : "Marketplace Storefront"}
								</h2>
								<div className="flex items-center gap-2 text-sm text-text-muted">
									<span
										className={`w-2 h-2 rounded-full ${
											isPro ? "bg-accent" : "bg-green-500"
										}`}
									/>
									<span>Live at</span>
									<button
										onClick={handleVisitStore}
										className="text-text hover:underline font-medium flex items-center gap-1"
									>
										{displayUrl}
										<ExternalLink className="w-3 h-3" />
									</button>
								</div>
							</div>
						</div>

						<div className="flex gap-4">
							<div className="flex items-center gap-2 text-sm">
								<CheckCircle className="w-4 h-4 text-accent" />
								<span className="text-text-muted">
									{isPro ? "White-label branding" : "Labeld branding visible"}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<CheckCircle className="w-4 h-4 text-accent" />
								<span className="text-text-muted">
									{isPro ? "Custom domain enabled" : "Labeld.app subdomain"}
								</span>
							</div>
						</div>
					</div>

					{/* Right: Action */}
					<div className="flex-shrink-0 hidden sm:block">
						<Button
							text="Visit Store"
							variant="outline"
							onClick={handleVisitStore}
						/>
					</div>
				</div>
			</div>

			<MaintenanceModal
				isOpen={showMaintenance}
				onClose={() => setShowMaintenance(false)}
			/>
		</>
	);
}
