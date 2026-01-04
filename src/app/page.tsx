import OnboardingSplit from "@/components/marketing/OnboardingHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Labeld Studio — Brand & Event Management for Creators",
	description:
		"Create and manage your streetwear brand, product drops, or events with Labeld Studio. One unified dashboard for brands and organizers.",
	openGraph: {
		title: "Labeld Studio — Brand & Event Management for Creators",
		description:
			"Create and manage your streetwear brand, product drops, or events with Labeld Studio. One unified dashboard for brands and organizers.",
		type: "website",
		url: "https://studio.labeld.app",
		images: [
			{
				url: "/images/onboarding-hero.JPEG",
				width: 1200,
				height: 630,
				alt: "Labeld Studio — Brand & Event Management Platform",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Labeld Studio — Brand & Event Management for Creators",
		description:
			"Create and manage your streetwear brand, product drops, or events with Labeld Studio. One unified dashboard for brands and organizers.",
		images: ["/images/onboarding-hero.JPEG"],
	},
};

export default function Landing() {
	return <OnboardingSplit />;
}
