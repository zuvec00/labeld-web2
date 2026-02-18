import { Timestamp } from "firebase/firestore";
import type { ReviewSummary } from "./review";

export interface BrandModel {
  uid: string;                 // same as user uid
  brandName: string;
  username: string;
  brandSlug?: string;          // NEW: for SEO friendly URLs, defaults to username
  phoneNumber?: string | null; // NEW: Contact phone number
  subscriptionTier?: "free" | "pro"; // Feature gating
  
  // Subscription / Payments
  subscriptionId?: string | null;
  subscriptionStatus?: "active" | "expired" | "past_due" | "cancelled";
  subscriptionStartedAt?: Timestamp | null;
  subscriptionEndsAt?: Timestamp | null;
  billingCycle?: "monthly" | "quarterly" | "biannual" | "annual" | null;

  bio?: string | null;
  category: string;
  brandTags?: string[] | null;

  logoUrl: string;
  coverImageUrl?: string | null;

  state?: string | null;
  country?: string | null;

  heat: number;

  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;

  isOpen?: boolean;            // store open/closed status

  storefrontConfig?: import("./site-customization").BrandStorefrontConfig; // Persisted storefront config

  // Reviews
  reviewSummary?: ReviewSummary | null; // Aggregated rating summary for fast rendering

  // Acquisition Survey
  acquisitionSurvey?: {
    source: string;
    subSource?: string; // e.g. "image_ads", "video_ads"
    otherDetail?: string; // e.g. "Friend's name"
    skipped?: boolean;
    respondedAt: Timestamp | Date;
  } | null;

  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// (Optional) converter same pattern as user.ts if you want
