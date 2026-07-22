import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pricing - Labeld Studio",
	description:
		"Start with a free Labeld storefront, then upgrade to Pro for unlimited products, deeper customization, analytics, reports, and 0% Labeld storefront fees.",
	openGraph: {
		title: "Pricing - Labeld Studio",
		description:
			"Start with a free Labeld storefront, then upgrade to Pro for unlimited products, deeper customization, analytics, reports, and 0% Labeld storefront fees.",
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
