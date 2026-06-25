import { Suspense } from "react";
import OnboardingSplit from "@/components/marketing/OnboardingHero";

export default function Landing() {
	return (
		<Suspense fallback={null}>
			<OnboardingSplit />
		</Suspense>
	);
}
