"use client";

import React from "react";
import Button from "@/components/ui/button";
import { Template } from "@/lib/models/site-customization";

interface DevTemplateSeederProps {
	onSeed: (templates: Template[]) => void;
}

export default function DevTemplateSeeder({ onSeed }: DevTemplateSeederProps) {
	// Only show in development
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	const handleSeed = () => {
		const mockTemplates: Template[] = [
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
						enabled: false, // Banner is disabled by default per requirements
						variant: "minimal",
						headline: "Welcome to our store",
					},
					{
						id: "product-listing-3",
						type: "productListing", // REQUIRED
						enabled: true,
						isRequired: true,
						layout: "grid",
						columns: 4,
					},
					{
						id: "footer-3",
						type: "footer", // REQUIRED
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
						type: "productListing", // REQUIRED
						enabled: true,
						isRequired: true,
						layout: "grid",
						columns: 3,
					},
					{
						id: "footer-1",
						type: "footer", // REQUIRED
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
						type: "productListing", // REQUIRED
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
						type: "footer", // REQUIRED
						enabled: true,
						isRequired: true,
						showSocialLinks: true,
						showContactInfo: false,
					},
				],
			},
		];

		onSeed(mockTemplates);
	};

	return (
		<div className="fixed bottom-4 right-4 z-50 p-4 bg-black/80 backdrop-blur rounded-xl border border-white/10 text-white shadow-2xl">
			<h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-white/50">
				Dev Tools
			</h4>
			<Button
				text="Seed Mock Templates"
				variant="outline"
				className="bg-transparent border-white/20 text-white hover:bg-white/10 py-1 px-3 text-sm h-8"
				onClick={handleSeed}
			/>
		</div>
	);
}
