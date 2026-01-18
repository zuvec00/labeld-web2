"use client";

import BrandOnboardingFlow from "@/components/brand/onboarding/BrandOnboardingFlow";

export default function BrandSetupPage() {
	return (
		<div className="p-4 sm:p-6 pb-20">
			<div className="max-w-2xl mx-auto mb-8 text-center">
				<h1 className="font-heading font-semibold text-2xl text-text">
					Start your new brand
				</h1>
				<p className="text-text-muted">
					Fill in the information below to get your store up and running.
				</p>
			</div>

			<BrandOnboardingFlow isModal={false} initialStep={1} />
		</div>
	);
}
