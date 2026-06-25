import { Suspense } from "react";
import OnboardingHero from "@/components/marketing/OnboardingHero";

export default function Landing() {
	return (
		<Suspense fallback={null}>
			<OnboardingHero />
		</Suspense>
	);
}
