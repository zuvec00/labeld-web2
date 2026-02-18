import { Timestamp } from "firebase/firestore";

/**
 * A single review/testimonial for a brand storefront.
 * Stored in: brands/{brandId}/reviews/{reviewId}
 */
export interface BrandReview {
  id: string;                  // document id

  brandId: string;             // which storefront/brand this belongs to

  // Reviewer info
  userId: string;              // reviewer (auth uid)
  userDisplayName: string;     // snapshot for display (e.g., "Amara O.")
  userPhotoURL?: string | null; // optional avatar

  // Review content
  rating: number;              // 1..5 (required)
  title?: string | null;       // optional short headline
  text?: string | null;        // optional body (testimonial content)

  // Verification & source
  isVerified: boolean;         // true if purchased via Labeld
  source: "labeld" | "manual"; // "manual" only if you explicitly allow non-purchase reviews

  // Moderation
  status: "published" | "pending" | "hidden";
  hiddenReason?: string | null;

  // Featured / Testimonial
  isFeatured: boolean;         // used for "Testimonials" cards on the storefront
  featuredOrder?: number | null; // optional ordering for featured section

  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Summary object stored on the brand doc for fast top-of-page rendering.
 * Embedded in: brands/{brandId}.reviewSummary
 */
export interface ReviewSummary {
  avgRating: number;
  totalCount: number;
  breakdown: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  featuredCount: number;
  updatedAt: Timestamp | Date;
}

/**
 * A product-specific review.
 * Stored in: products/{productId}/reviews/{reviewId}
 * (Or top-level reviews collection with productId query)
 */
export interface ProductReview {
  id: string;

  // Target
  productId: string;
  brandId: string;              // so you can filter by brand/storefront quickly

  // Reviewer
  // Reviewer
  userId?: string | null;       // nullable for guest reviews
  email: string;                // required for verification/communication
  reviewerName: string;         // display name (input by user for guests)
  userPhotoURL?: string | null;

  // Content
  rating: number;               // 1..5 (required)
  title?: string | null;
  text?: string | null;

  // Optional media (phase 2)
  media?: {
    type: "image";
    url: string;
  }[] | null;

  // Trust signals
  isVerified: boolean;          // purchased through Labeld
  orderId?: string | null;      // if verified
  source: "labeld" | "manual";  // I’d recommend you keep "manual" off for product reviews, unless you really need it

  // Moderation
  status: "published" | "pending" | "hidden";
  hiddenReason?: string | null;

  // Metadata
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Summary object stored on the product doc for fast rendering.
 * Embedded in: products/{productId}.reviewSummary
 */
export interface ProductReviewSummary {
  avgRating: number;
  totalCount: number;
  breakdown: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  updatedAt: Timestamp | Date;
}

