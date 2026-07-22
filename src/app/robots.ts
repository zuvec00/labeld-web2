import type { MetadataRoute } from "next";

const baseUrl = "https://studio.labeld.app";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: ["/", "/pricing", "/marketing", "/integrations"],
				disallow: [
					"/api/",
					"/admin/",
					"/dashboard/",
					"/analytics/",
					"/auth/",
					"/login",
					"/onboarding",
					"/brand-space/",
					"/organizer-space/",
					"/collections/",
					"/pieces/",
					"/orders/",
					"/customers/",
					"/settings/",
					"/tickets",
					"/wallet",
					"/bookings/",
					"/scan",
					"/scan-booking",
					"/events/create",
				],
			},
		],
		host: baseUrl,
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
