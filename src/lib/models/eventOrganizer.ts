import { Timestamp } from "firebase/firestore";

export interface EventOrganizerModel {
	uid: string;
	
	// Core Identity
	organizerName: string;
	username: string; // Used as handle
	slug: string; // Used for public URL (usually matches username)
	
	// Visuals
	logoUrl?: string;
	coverImageUrl?: string;
	
	// Details
	bio?: string;
	eventCategory?: string; // e.g. "Nightlife", "Corporate"
	
	// Location & Reach
	baseCity?: string;
	activeSince?: string;
	
	// Contact & Links
	email?: string;
	phone?: string;
	instagram?: string;
	tiktok?: string;
	twitter?: string;
	website?: string;
	
	// Subscription / Business Logic
	subscriptionTier: "free" | "pro";
	subscriptionStatus?: "active" | "expired" | "past_due" | "cancelled";
	pricingPlanId?: string;
	
	// Storefront Config (Nested object for the customization page)
	storefrontConfig?: {
		layout?: "grid" | "list";
		themeId?: string;
		primaryColor?: string;
		showSocialProof?: boolean;
		heroParams?: {
			height?: "full" | "half";
			overlayOpacity?: number;
		};
	};

	// Metadata
	createdAt: Timestamp;
	updatedAt: Timestamp;
}
