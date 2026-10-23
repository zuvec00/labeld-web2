/**
 * Brand categories offered at signup. Mirrors the Studio mobile app's
 * `brandCategories` list so a brand sees the same options on web and mobile.
 */
export const BRAND_CATEGORIES = {
	core: [
		"Streetwear",
		"Minimal Street",
		"Luxury / Designer-Inspired",
		"Techwear / Futuristic",
		"Retro / Y2K",
		"Skatewear",
		"Alt / Grunge",
		"Athleisure",
		"Genderless / Androgynous",
		"Sustainable / Eco-Conscious",
		"Custom / Made-to-Order",
		"Thrift / Vintage",
		"Afrofusion",
	],
	extended: [
		"Beauty / Skincare",
		"Makeup",
		"Haircare",
		"Fragrance",
		"Accessories",
		"Footwear",
		"Jewelry",
		"Bags & Leather Goods",
		"Wellness",
		"Home & Living",
		"Lifestyle Goods",
		"Art & Design",
		"Creative Studio",
		"Dropshipping",
		"Print-on-Demand",
		"Other",
	],
} as const;
