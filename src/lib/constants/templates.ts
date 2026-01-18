import { Template } from "@/lib/models/site-customization";

export const AVAILABLE_TEMPLATES: Template[] = [
	{
		id: "essential",
		name: "Essential",
		description:
			"A clean, familiar storefront layout focused on simplicity and ease of shopping.",
		isProOnly: true,
		tags: ["Minimal", "Standard"],
		templateRole: "essential",
		defaultSections: [
			{
				id: "hero-3",
				type: "hero",
				enabled: false,
				variant: "minimal",
				headline: "Welcome to our store",
			},
			{
				id: "product-listing-3",
				type: "productListing",
				enabled: true,
				isRequired: true,
				layout: "grid",
				columns: 4,
			},
			{
				id: "footer-3",
				type: "footer",
				enabled: true,
				isRequired: true,
				showSocialLinks: true,
				showContactInfo: true,
			},
		],
	},
	{
		id: "editorial",
		name: "Editorial",
		description:
			"Large hero sections and story-driven layout. Ideal for narrative-heavy brands.",
		isProOnly: true,
		tags: ["Story-first", "Visual"],
		templateRole: "editorial",
		defaultSections: [
			{
				id: "hero-1",
				type: "hero",
				enabled: true,
				variant: "editorial",
				headline: "Our Story, Our Brand",
				subheadline: "Crafted with passion in every stitch.",
			},
			{
				id: "brand-story-1",
				type: "brandStory",
				enabled: true,
				title: "About Us",
				content:
					"We are a brand dedicated to timeless style and sustainable practices.",
			},
			{
				id: "product-listing-1",
				type: "productListing",
				enabled: true,
				isRequired: true,
				layout: "grid",
				columns: 3,
			},
			{
				id: "footer-1",
				type: "footer",
				enabled: true,
				isRequired: true,
				showSocialLinks: true,
				showContactInfo: true,
			},
		],
	},
	{
		id: "commerce-forward",
		name: "Commerce Forward",
		description:
			"Product-first layout with minimal distractions. Optimized for high conversion.",
		isProOnly: true,
		tags: ["Conversion", "Drops"],
		templateRole: "commerce",
		defaultSections: [
			{
				id: "hero-2",
				type: "hero",
				enabled: true,
				variant: "minimal",
				headline: "New Arrivals",
				primaryCta: { label: "Shop Now", action: "viewDrops" },
			},
			{
				id: "featured-drops-1",
				type: "featuredDrops",
				enabled: true,
				layout: "carousel",
				maxItems: 5,
			},
			{
				id: "product-listing-2",
				type: "productListing",
				enabled: true,
				isRequired: true,
				layout: "grid",
				columns: 4,
			},
			{
				id: "social-proof-1",
				type: "socialProof",
				enabled: true,
				sources: ["instagram"],
			},
			{
				id: "footer-2",
				type: "footer",
				enabled: true,
				isRequired: true,
				showSocialLinks: true,
				showContactInfo: false,
			},
		],
	},
];
