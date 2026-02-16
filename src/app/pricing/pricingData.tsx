import React from "react";
import { Check } from "lucide-react";

export type PricingMode = "brand" | "organizer";

export const PRICING_CONTENT = {
	brand: {
		hero: {
			title: (
				<>
					From listing on a platform
					<br />
					to <span className="text-cta">owning your presence.</span>
				</>
			),
			subtext: (
				<>
					Free lets you participate in the marketplace.
					<br className="hidden sm:block" />
					Pro gives you the tools to build a destination.
				</>
			),
			ctaPro: "Upgrade to Pro",
			ctaFree: "Start Free",
		},
		plans: {
			free: {
				title: "Free",
				price: "₦0",
				description: "Sell inside the Labeld marketplace.",
				features: [
					"List products & drops",
					"Accept orders & payouts",
					"Appear in the Labeld marketplace",
					"Basic brand profile (logo, bio)",
					"Standard analytics (sales & revenue)",
				],
				domainPrefix: "shop",
				domainSuffix: "yourbrand",
			},
			pro: {
				title: "Pro",
				badge: "Growing Brands",
				description: "Your own Labeld-powered store.",
				ownershipFeatures: [
					"Your own branded storefront",
					"0% fees on your personal storefront sales",
					"Custom store profile URL (subdomain)",
					"Reduced / white-label Labeld branding",
				],
				customizationFeatures: [
					"Custom templates & layouts",
					"Section ordering & visibility",
					"Dark / light mode toggle",
				],
				analyticsFeatures: [
					"Performance trends over time",
					"Traffic source breakdown",
					"Actionable brand insights",
				],
			},
		},
		comparison: {
			selling: [
				{ label: "Marketplace listing", free: true, pro: true },
				{ label: "Secure checkout & payouts", free: true, pro: true },
				{
					label: "0% Labeld fees on storefront sales",
					free: "Standard fees",
					pro: true,
				},
			],
			branding: [
				{ label: "Basic Brand Profile", free: true, pro: true },
				{ label: "Custom Store URL (Subdomain)", free: false, pro: true },
			],
			customization: [
				{ label: 'Default "Clean" Theme', free: true, pro: true },
				{ label: "Multiple Theme Layouts", free: false, pro: true },
				{ label: "Section Ordering & Visibility", free: false, pro: true },
				{ label: "Dark / Light Mode Toggle", free: false, pro: true },
				{ label: "Custom Hero & Banner Content", free: false, pro: true },
			],
			analytics: [
				{ label: "Total Sales & Revenue", free: true, pro: true },
				{ label: "Basic Order History", free: true, pro: true },
				{ label: "Conversion Rate & Trends", free: false, pro: true },
				{ label: "Traffic Source Breakdown", free: false, pro: true },
				{ label: '"Plain English" Business Insights', free: false, pro: true },
			],
		},
		closing: {
			title: "Ready to own your presence?",
			subtext:
				"Join the brands who are actively building their future, not just posting products.",
			cta: "Upgrade to Pro",
		},
	},
	organizer: {
		hero: {
			title: (
				<>
					From listing events
					<br />
					to <span className="text-cta">owning your presence.</span>
				</>
			),
			subtext: (
				<>
					Free lets you sell tickets on Labeld Events.
					<br className="hidden sm:block" />
					Event Pro gives you your own event site, checkout, and analytics.
				</>
			),
			ctaPro: "Upgrade to Event Pro",
			ctaFree: "Start Free",
		},
		plans: {
			free: {
				title: "Free",
				price: "₦0",
				description: "Sell tickets inside the Labeld events.",
				features: [
					"Appear on Labeld Events",
					"Basic event details",
					"Standard checkout",
					"Manage attendees",
				],
				domainPrefix: "events",
				domainSuffix: "yourevent",
			},
			pro: {
				title: "Event Pro",
				badge: "Best for Venues",
				description: "Your own branded event site.",
				ownershipFeatures: [
					"Your own branded event site",
					"Custom event pages & themes",
					"Sell tickets, tables, and packages",
					"QR-based entry confirmations",
				],
				customizationFeatures: [
					"Custom event URL",
					"Brand-first presentation",
					"Reduced Labeld branding",
				],
				analyticsFeatures: [
					"Ticket sales over time",
					"Event performance",
					"Conversion tracking",
				],
			},
		},
		comparison: {
			selling: [
				{ label: "List on Labeld Events", free: true, pro: true },
				{ label: "Standard Checkout", free: true, pro: true },
				{ label: "Ticket Sales", free: true, pro: true },
			],
			branding: [
				{ label: "Basic Event Details", free: true, pro: true },
				{ label: "Branding Control", free: false, pro: true },
				{ label: "Custom Event Site", free: false, pro: true },
			],
			customization: [
				{ label: "Standard Layout", free: true, pro: true },
				{ label: "Custom Themes", free: false, pro: true },
				{ label: "Reduced Branding", free: false, pro: true },
			],
			analytics: [
				{ label: "Basic Sales Data", free: true, pro: true },
				{ label: "Event Analytics", free: false, pro: true },
				{ label: "Conversion Tracking", free: false, pro: true },
			],
		},
		closing: {
			title: "Ready to run events like a brand?",
			subtext:
				"Join organizers who are building destinations, not just posting flyers.",
			cta: "Upgrade to Event Pro",
		},
	},
};
