import LandingPage from "@/components/landing-page/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
	metadataBase: new URL("https://studio.labeld.app"),
	title: "Labeld Studio — Culture OS for Brands, Drops & Events",
	description:
		"Build storefronts, launch drops, sell tickets, manage orders, and run your brand from one connected Studio.",
	alternates: {
		canonical: "https://studio.labeld.app/",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
	openGraph: {
		title: "Labeld Studio — Culture OS for Brands, Drops & Events",
		description:
			"Build storefronts, launch drops, sell tickets, manage orders, and run your brand from one connected Studio.",
		type: "website",
		url: "https://studio.labeld.app/",
		siteName: "Labeld Studio",
		locale: "en_NG",
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
		title: "Labeld Studio — Culture OS for Brands, Drops & Events",
		description:
			"Launch your brand site, sell drops, host events, and manage orders from one connected Studio.",
		images: ["/images/onboarding-hero.JPEG"],
	},
	keywords: [
		"Labeld Studio",
		"website builder for brands",
		"storefront for independent brands",
		"event ticketing Nigeria",
		"sell merch online",
		"product drops",
		"Paystack storefront alternative",
	],
};

export default function Landing() {
	return <LandingPage />;
}
