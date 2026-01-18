"use client";

import BrandOnboardingFlow from "@/components/brand/onboarding/BrandOnboardingFlow";

export default function BrandOnboardingModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	if (!isOpen) return null;

	return <BrandOnboardingFlow isModal={true} onClose={onClose} />;
}
