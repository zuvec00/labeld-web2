import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://studio.labeld.app";
const DEFAULT_OG_IMAGE = "/images/labeld_logo.png";

interface SEOParams {
	title: string;
	description: string;
	image?: string;
	url?: string;
	type?: "website" | "article" | "profile";
	noIndex?: boolean;
}

/**
 * Generate SEO metadata for pages
 */
export function generateSEO({
	title,
	description,
	image = DEFAULT_OG_IMAGE,
	url,
	type = "website",
	noIndex = false,
}: SEOParams): Metadata {
	const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
	const fullImageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type,
			url: fullUrl,
			siteName: "Labeld Studio",
			images: [
				{
					url: fullImageUrl,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [fullImageUrl],
			creator: "@labeld",
		},
		...(noIndex && {
			robots: {
				index: false,
				follow: false,
			},
		}),
	};
}

/**
 * Generate metadata for brand pages
 */
export function generateBrandMetadata({
	brandName,
	bio,
	logoUrl,
	username,
}: {
	brandName: string;
	bio?: string;
	logoUrl?: string;
	username: string;
}): Metadata {
	const title = `${brandName} | Labeld`;
	const description =
		bio || `Discover ${brandName} on Labeld - For the Culture, Not the Clout.`;

	return generateSEO({
		title,
		description,
		image: logoUrl || DEFAULT_OG_IMAGE,
		url: `/brandspace/${username}`,
		type: "profile",
	});
}

/**
 * Generate metadata for event pages
 */
export function generateEventMetadata({
	eventTitle,
	description,
	coverImageUrl,
	eventId,
	startDate,
	venue,
}: {
	eventTitle: string;
	description?: string;
	coverImageUrl?: string;
	eventId: string;
	startDate?: Date;
	venue?: string;
}): Metadata {
	const title = `${eventTitle} | Labeld Events`;
	let desc = description || `Join ${eventTitle} on Labeld.`;

	if (startDate) {
		desc += ` • ${startDate.toLocaleDateString()}`;
	}
	if (venue) {
		desc += ` • ${venue}`;
	}

	return generateSEO({
		title,
		description: desc,
		image: coverImageUrl || DEFAULT_OG_IMAGE,
		url: `/events/${eventId}`,
		type: "article",
	});
}

/**
 * Generate metadata for product/merch pages
 */
export function generateProductMetadata({
	productName,
	description,
	imageUrl,
	price,
	brandName,
}: {
	productName: string;
	description?: string;
	imageUrl?: string;
	price?: number;
	brandName?: string;
}): Metadata {
	const title = brandName
		? `${productName} by ${brandName} | Labeld`
		: `${productName} | Labeld`;

	let desc = description || `Shop ${productName} on Labeld.`;
	if (price) {
		desc += ` • ₦${price.toLocaleString()}`;
	}

	return generateSEO({
		title,
		description: desc,
		image: imageUrl || DEFAULT_OG_IMAGE,
		type: "article",
	});
}

