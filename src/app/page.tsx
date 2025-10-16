import OnboardingSplit from "@/components/marketing/OnboardingHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Labeld Studio - Launch Your Brand or Drop Events",
	description:
		"Join Labeld Studio to launch your streetwear brand, manage drops, or organize unforgettable events. Built for creators, by the culture.",
	openGraph: {
		title: "Labeld Studio - Launch Your Brand or Drop Events",
		description:
			"Join Labeld Studio to launch your streetwear brand, manage drops, or organize unforgettable events. Built for creators, by the culture.",
		type: "website",
		url: "https://studio.labeld.app",
		images: [
			{
				url: "/images/onboarding-hero.JPEG",
				width: 1200,
				height: 630,
				alt: "Labeld Studio - For the Culture",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Labeld Studio - Launch Your Brand or Drop Events",
		description:
			"Join Labeld Studio to launch your streetwear brand, manage drops, or organize unforgettable events.",
		images: ["/images/onboarding-hero.JPEG"],
	},
};

export default function Landing() {
	return <OnboardingSplit />;
}
