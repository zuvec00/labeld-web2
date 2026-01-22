"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import EventOnboardingFlow from "@/components/onboarding/EventOnboardingFlow";

function OnboardingContent() {
	const searchParams = useSearchParams();
	const mode = searchParams.get("mode");

	if (mode === "event") {
		return <EventOnboardingFlow />;
	}
	return <OnboardingFlow />;
}

export default function OnboardingPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-bg" />}>
			<OnboardingContent />
		</Suspense>
	);
}
