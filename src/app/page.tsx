import LandingPage from "@/components/landing-page/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
	metadataBase: new URL("https://studio.labeld.app"),
	title:
		"Labeld Studio — Unified Platform for Independent Brands & Event Organizers",
	description:
		"Build your brand site, sell products, host ticketed events, and manage everything from one dashboard.",
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
		title:
			"Labeld Studio — Unified Platform for Independent Brands & Event Organizers",
		description:
			"Build your brand site, sell drops/merch, host ticketed events, and manage everything from one dashboard.",
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
		title:
			"Labeld Studio — Unified Platform for Independent Brands & Event Organizers",
		description:
			"Launch your brand site, sell drops, host events, and manage orders — all in one dashboard.",
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
