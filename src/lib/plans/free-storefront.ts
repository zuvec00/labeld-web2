import {
	BrandIdentity,
	StorefrontSection,
	StorefrontSectionType,
} from "@/lib/models/site-customization";

export const FREE_STOREFRONT_PRODUCT_LIMIT = 12;
export const DEFAULT_FREE_STOREFRONT_TEMPLATE_ID = "essential";
export const DEFAULT_FREE_TYPOGRAPHY_PRESET_ID = "studio";

const FREE_EDITABLE_SECTION_TYPES = new Set<StorefrontSectionType>([
	"hero",
	"featuredDrops",
	"productListing",
	"brandStory",
	"socialProof",
]);

export interface TypographyPreset {
	id: string;
	name: string;
	headingFontFamily: string;
	bodyFontFamily: string;
	headingCssVariable: string;
	bodyCssVariable: string;
	description: string;
}

export const STOREFRONT_TYPOGRAPHY_PRESETS: TypographyPreset[] = [
	{
		id: "studio",
		name: "Studio",
		headingFontFamily: "Unbounded",
		bodyFontFamily: "Manrope",
		headingCssVariable: "var(--font-unbounded)",
		bodyCssVariable: "var(--font-manrope)",
		description: "Bold, creative, unapologetically modern.",
	},
	{
		id: "editorial",
		name: "Editorial",
		headingFontFamily: "Instrument Serif",
		bodyFontFamily: "Outfit",
		headingCssVariable: "var(--font-instrument-serif)",
		bodyCssVariable: "var(--font-outfit)",
		description: "Contemporary luxury that does not need to announce itself.",
	},
	{
		id: "modern",
		name: "Modern",
		headingFontFamily: "Space Grotesk",
		bodyFontFamily: "Inter",
		headingCssVariable: "var(--font-space-grotesk)",
		bodyCssVariable: "var(--font-inter)",
		description: "Sharp, structured, and effortlessly clean.",
	},
	{
		id: "luxury",
		name: "Luxury",
		headingFontFamily: "Cormorant Garamond",
		bodyFontFamily: "Jost",
		headingCssVariable: "var(--font-cormorant-garamond)",
		bodyCssVariable: "var(--font-jost)",
		description: "Classical warmth with a clean modern edge.",
	},
	{
		id: "street",
		name: "Street",
		headingFontFamily: "Bebas Neue",
		bodyFontFamily: "Inter",
		headingCssVariable: "var(--font-bebas-neue)",
		bodyCssVariable: "var(--font-inter)",
		description: "Loud, raw, and built for the drop.",
	},
	{
		id: "minimal",
		name: "Minimal",
		headingFontFamily: "Plus Jakarta Sans",
		bodyFontFamily: "Plus Jakarta Sans",
		headingCssVariable: "var(--font-plus-jakarta-sans)",
		bodyCssVariable: "var(--font-plus-jakarta-sans)",
		description: "One font. Zero distractions.",
	},
	{
		id: "elegant",
		name: "Elegant",
		headingFontFamily: "DM Serif Display",
		bodyFontFamily: "DM Sans",
		headingCssVariable: "var(--font-dm-serif-display)",
		bodyCssVariable: "var(--font-dm-sans)",
		description: "Soft but intentional. Beautiful but grounded.",
	},
	{
		id: "culture",
		name: "Culture",
		headingFontFamily: "Clash Display",
		bodyFontFamily: "Satoshi",
		headingCssVariable: "var(--font-unbounded)",
		bodyCssVariable: "var(--font-manrope)",
		description: "Bold, expressive, rooted in something real.",
	},
];

export function canUseTemplateForPlan(templateId: string, isPro: boolean) {
	return isPro || templateId === DEFAULT_FREE_STOREFRONT_TEMPLATE_ID;
}

export function isSectionLockedForPlan(
	section: StorefrontSection,
	isPro: boolean,
) {
	return !isPro && !FREE_EDITABLE_SECTION_TYPES.has(section.type);
}

export function getSectionsForPlanSave(
	sections: StorefrontSection[],
	isPro: boolean,
) {
	if (isPro) return sections;
	return sections.map((section) =>
		isSectionLockedForPlan(section, false)
			? ({ ...section, enabled: section.isRequired ? true : false } as StorefrontSection)
			: section,
	);
}

export function sanitizeBrandIdentityForPlan(
	identity: BrandIdentity,
	isPro: boolean,
): BrandIdentity {
	if (isPro) return identity;

	return {
		primaryColor: identity.primaryColor,
		secondaryColor: identity.secondaryColor,
		themeMode: identity.themeMode,
		typographyPresetId: DEFAULT_FREE_TYPOGRAPHY_PRESET_ID,
		headingFontFamily: "Unbounded",
		bodyFontFamily: "Manrope",
	};
}
