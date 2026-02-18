import { Timestamp } from "firebase/firestore";
import { ProductReviewSummary } from "./review";

export type ProductLite = {
  id: string;
  dropName: string;
  launchDate?: Date | null;
  mainVisualUrl?: string | null;
};

export type ProductColor = {
  label: string;
  hex: string;
};

export type Product = {
  id: string;
  brandId: string;
  userId?: string;

  // Basics
  dropName: string;
  description?: string | null;
  price: number;
  currency?: Record<string, string> | string | null; // matches Flutter's flexible map
  
  // Visuals
  mainVisualUrl: string;
  galleryImages?: string[] | null;
  
  // Variants
  sizeOptions?: string[] | null;
  colors?: ProductColor[] | null;
  sizeGuideUrl?: string | null;

  // Launch & Availability
  launchDate: Date | null;
  isAvailableNow?: boolean;
  dropId?: string | null;

  // External Links
  copLink?: string | null;

  // Inventory
  stockRemaining?: number | null;
  stockMode?: "global" | "variants" | null;
  variantStock?: Record<string, number> | null;

  // Pricing & Fees
  discountPercent?: number | null;
  feeSettings?: {
    absorbTransactionFee: boolean;
  } | null;
  costPrice?: number | null;

  // Metadata
  styleTags?: string[] | null;

  // Denormalized Brand Fields
  brandName?: string | null;
  brandUsername?: string | null;
  brandLogoUrl?: string | null;

  // Rating Summary (New)
  reviewSummary?: ProductReviewSummary | null;

  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};
