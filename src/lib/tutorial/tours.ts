/**
 * Tour configurations for different features
 */
import type { TourConfig } from "./types";

export const TOURS: Record<string, TourConfig> = {
	"brand-setup": {
		id: "brand-setup",
		title: "Brand Setup Tour",
		description: "Learn how to set up your brand space",
		steps: [
			{
				target: '[data-tour="brand-space-nav"]',
				title: "Brand Space",
				description:
					"Access your brand space from the sidebar to manage your profile and storefront.",
				placement: "right",
				action: {
					type: "navigate",
					href: "/brand-space",
				},
			},
            // Highlighting content on Brand Space page
            {
				target: '[data-tour="brand-header"]',
				title: "Your Brand Profile",
				description:
					"Here is where you can edit your brand details, bio, and see you stats.",
				placement: "bottom",
                // Already navigated
			},
			{
				target: '[data-tour="products-nav"]',
				title: "Products",
				description: "Navigate to Products to manage your inventory.",
				placement: "right",
				action: {
					type: "navigate",
					href: "/pieces",
				},
			},
            // Highlighting "Add Product" button
             {
				target: '[data-tour="create-product"]',
				title: "Drop a Product",
				description: "Click here to add new products to your store.",
				placement: "left",
			},
			{
				target: '[data-tour="wallet-nav"]',
				title: "Wallet",
				description:
					"Navigate to Wallet to view earnings.",
				placement: "right",
				action: {
					type: "navigate",
					href: "/wallet",
				},
			},
             {
				target: '[data-tour="balance-cards"]',
				title: "Your Balance",
				description:
					"View your eligible balance and payouts here.",
				placement: "bottom",
			},
		],
	},
	"event-setup": {
		id: "event-setup",
		title: "Event Setup Tour",
		description: "Learn how to create and manage events",
		steps: [
			{
				target: '[data-tour="events-nav"]',
				title: "Events",
				description:
					"Access your events from the sidebar.",
				placement: "right",
				action: {
					type: "navigate",
					href: "/events",
				},
			},
			{
				target: '[data-tour="create-event"]',
				title: "Create a new event",
				description: "Start here to add event details like date, venue, and description.",
				placement: "bottom",
				action: {
					type: "navigate",
					href: "/events", // Ensure we are on events page
				},
			},
			{
				target: '[data-tour="wallet-nav"]',
				title: "Get paid",
				description:
					"Navigate to Wallet for payouts.",
				placement: "right",
				action: {
					type: "navigate",
					href: "/wallet",
				},
			},
             {
				target: '[data-tour="balance-cards"]',
				title: "Track Earnings",
				description:
					"Monitor your event ticket sales and payouts here.",
				placement: "bottom",
			},
		],
	},
	"orders": {
		id: "orders",
		title: "Orders Tour",
		description: "Learn how to manage orders and fulfillments",
		steps: [
			{
				target: '[data-tour="orders-nav"]',
				title: "Orders Dashboard",
				description:
					"Navigate to the Orders page.",
				placement: "right",
				action: {
					type: "navigate",
					href: "/orders",
				},
			},
             {
				target: '[data-tour="orders-snapshot"]',
				title: "Quick Stats",
				description:
					"See a quick overview of your store and event orders here.",
				placement: "bottom",
			},
		],
	},
	"wallet": {
		id: "wallet",
		title: "Wallet & Payouts Tour",
		description: "Learn about your earnings and payouts",
		steps: [
			{
				target: '[data-tour="wallet-nav"]',
				title: "Wallet",
				description:
					"Navigate to the Wallet page.",
				placement: "right",
				action: {
					type: "navigate",
					href: "/wallet",
				},
			},
             {
				target: '[data-tour="balance-cards"]',
				title: "Your Earnings",
				description:
					"Track your total earnings, on-hold balance, and upcoming payouts.",
				placement: "bottom",
			},
		],
	},
};

/**
 * Get a tour configuration by ID
 */
export function getTour(tourId: string): TourConfig | undefined {
	return TOURS[tourId];
}

/**
 * Get all available tours
 */
export function getAllTours(): TourConfig[] {
	return Object.values(TOURS);
}

