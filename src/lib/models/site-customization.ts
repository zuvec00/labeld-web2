export type StorefrontSectionType =
  | "hero"
  | "featuredDrops"
  | "productListing"
  | "brandStory"
  | "socialProof"
  | "footer";

export interface BaseSection {
  id: string; // Unique ID for the section instance (e.g. "hero-1")
  type: StorefrontSectionType;
  enabled: boolean;
  isRequired?: boolean; // For required sections like ProductListing and Footer
  isLocked?: boolean; // If true, cannot be moved or disabled (often same as required, but can differ)
}

export interface HeroSection extends BaseSection {
  type: "hero";
  variant: "minimal" | "editorial";
  headline: string;
  subheadline?: string;
  imageUrl?: string; // Content Override
  primaryCta?: {
    label: string;
    action: "viewDrops" | "scroll";
  };
}

export interface FeaturedDropsSection extends BaseSection {
  type: "featuredDrops";
  layout: "grid" | "carousel";
  maxItems: number;
  title?: string; // Content Override
  subtitle?: string; // Content Override
  collectionIds?: string[]; // Content Override: Replaces productIds
  dropStatusMode?: "date" | "relative"; // Content Override
  cardSubtext?: string; // Content Override
}

export interface ProductListingSection extends BaseSection {
  type: "productListing";
  enabled: true; // Always true
  isRequired: true;
  layout: "grid";
  columns: 2 | 3 | 4;
  title?: string; // Content Override
  order?: "latest" | "price_asc" | "price_desc" | "random"; // Content Override
  manualSelection?: boolean; // Content Override
  productIds?: string[]; // Content Override
}

export interface BrandStorySection extends BaseSection {
  type: "brandStory";
  title?: string;
  content: string;
}

export interface SocialProofSection extends BaseSection {
  type: "socialProof";
  sources?: ("instagram" | "twitter" | "labeld")[]; // Deprecated in favor of platform
  platform?: "instagram" | "tiktok"; // New field
  handle?: string; // New field
  followerCount?: number; // New field
  showCta?: boolean; // New field, default true
  tagline?: string; // Content Override (Deprecated but kept for backward compat)
  images?: string[]; // Content Override
}

export interface FooterSection extends BaseSection {
  type: "footer";
  enabled: true; // Always true
  isRequired: true;
  showSocialLinks: boolean;
  showContactInfo: boolean;
}

export type StorefrontSection =
  | HeroSection
  | FeaturedDropsSection
  | ProductListingSection
  | BrandStorySection
  | SocialProofSection
  | FooterSection;

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  previewImage?: string;
  isProOnly: boolean;
  defaultSections: StorefrontSection[]; // The default configuration for this template
  tags?: string[]; // e.g. "Story-first", "Minimal"
  templateRole?: "essential" | "editorial" | "commerce"; // For recommendations/categorization
}

export interface BrandIdentity {
	primaryColor: string;
	secondaryColor?: string;
	logoUrl?: string; // If undefined, use Brand Name text
	faviconUrl?: string;
	useLogoInFooter?: boolean;
	themeMode?: "light" | "dark"; // Default: 'light'
}

export interface BrandStorefrontConfig {
    templateId: string;
    enabledSections: string[]; // List of section IDs that are enabled
    sectionOrder: string[]; // List of section IDs in order
    sectionSettings?: Record<string, Partial<StorefrontSection>>; // Overrides per section ID
    identity?: BrandIdentity;
    contentOverrides?: Record<string, Record<string, any>>; 
    activatedAt?: Date; // When this template was last activated
}
