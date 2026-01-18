import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pricing - Labeld Studio",
	description:
		"Choose the right plan for your brand. Start for free or upgrade to Pro for custom storefronts, advanced analytics, and full brand ownership.",
	openGraph: {
		title: "Pricing - Labeld Studio",
		description:
			"Choose the right plan for your brand. Start for free or upgrade to Pro for custom storefronts, advanced analytics, and full brand ownership.",
		url: "https://studio.labeld.app/pricing",
		siteName: "Labeld Studio",
		locale: "en_US",
		type: "website",
	},
};

export default function PricingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
