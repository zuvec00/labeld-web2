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
					Start with a real storefront, not a placeholder.
					<br className="hidden sm:block" />
					Upgrade when you need more products, more control, and fewer fees.
				</>
			),
			ctaPro: "Upgrade to Pro",
			ctaFree: "Start Free",
		},
		plans: {
			free: {
				title: "Free",
				price: "₦0",
				description: "Launch your storefront and start taking orders.",
				features: [
					"Your own yourbrand.labeld.app storefront",
					"Show up to 12 storefront products",
					"Essential storefront template",
					"Studio typography, colors, and theme mode",
					"Accept orders & payouts",
					"Standard 5% Labeld fee on storefront sales",
				],
				domainPrefix: "yourbrand",
				domainSuffix: "yourbrand",
			},
			pro: {
				title: "Pro",
				badge: "Growing Brands",
				description: "The growth layer for brands ready to scale.",
				ownershipFeatures: [
					"Unlimited storefront products",
					"0% Labeld fees on your personal storefront sales",
					"Connect your own domain (e.g. yourbrand.com)",
					"Reduced / white-label Labeld branding",
					"Optionally featured on Labeld socials",
				],
				customizationFeatures: [
					"All storefront templates",
					"Full typography library",
					"Advanced sections, policies, and store access",
					"Newsletter, waitlist, discounts, and campaigns",
				],
				analyticsFeatures: [
					"Storefront analytics",
					"Expenses, profit visibility, and monthly reports",
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
					free: "5% standard fee",
					pro: true,
				},
			],
			branding: [
				{ label: "Basic Brand Profile", free: true, pro: true },
				{ label: "Labeld Subdomain", free: true, pro: true },
				{ label: "Custom Domain Mapping", free: false, pro: true },
			],
			customization: [
				{ label: "Essential Storefront Template", free: true, pro: true },
				{ label: "12 Public Storefront Products", free: true, pro: "Unlimited" },
				{ label: "Basic Section Editing", free: true, pro: true },
				{ label: "Brand Colors & Theme Mode", free: true, pro: true },
				{ label: "Full Typography Library", free: false, pro: true },
				{ label: "Advanced Store Sections & Policies", free: false, pro: true },
			],
			analytics: [
				{ label: "Total Sales & Revenue", free: true, pro: true },
				{ label: "Basic Order History", free: true, pro: true },
				{ label: "Expenses & Profit Visibility", free: false, pro: true },
				{ label: "Monthly Reports", free: false, pro: true },
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
					"Sell tickets, tables & packages",
					"Standard checkout & payouts",
					"Manage attendees",
					"QR-based entry confirmations",
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
					"Manage bookings & reservations",
					"Optionally featured on Labeld socials",
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
				{ label: "Sell Tickets, Tables & Packages", free: true, pro: true },
				{ label: "Standard Checkout & Payouts", free: true, pro: true },
				{ label: "QR-Based Entry Confirmations", free: true, pro: true },
			],
			branding: [
				{ label: "Basic Event Details", free: true, pro: true },
				{ label: "Branding Control", free: false, pro: true },
				{ label: "Custom Event Site", free: false, pro: true },
				{
					label: "Optionally Featured on Labeld Socials",
					free: false,
					pro: true,
				},
			],
			customization: [
				{ label: "Standard Layout", free: true, pro: true },
				{ label: "Custom Themes", free: false, pro: true },
				{ label: "Reduced Branding", free: false, pro: true },
			],
			management: [
				{ label: "Manage Attendees", free: true, pro: true },
				{ label: "Manage Bookings & Reservations", free: false, pro: true },
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
