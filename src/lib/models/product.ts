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

export type ProductFulfillmentMethod =
  | "ready_to_ship"
  | "made_to_order"
  | "custom_production";

export type ProductFulfillmentUnit = "business_days";

export type ProductFulfillment = {
  method: ProductFulfillmentMethod;
  productionMinDays?: number | null;
  productionMaxDays?: number | null;
  note?: string | null;
  unit?: ProductFulfillmentUnit;
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
  variantPriceAdjustmentsMinor?: Record<string, number> | null;
  discountPercent?: number | null;
  feeSettings?: {
    absorbTransactionFee: boolean;
  } | null;
  costPrice?: number | null;

  // Fulfillment promise
  fulfillment?: ProductFulfillment | null;

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

export function buildProductVariantKey(
  size?: string | null,
  color?: string | null,
): string {
  return [size ?? "", color ?? ""].filter(Boolean).join("-");
}

export function getVariantPriceAdjustmentMinor(
  product: Pick<Product, "variantPriceAdjustmentsMinor">,
  key?: string | null,
  size?: string | null,
  color?: string | null,
): number {
  const adjustments = product.variantPriceAdjustmentsMinor ?? {};
  const candidates = [
    key,
    buildProductVariantKey(size, color),
    size && color ? `${size}-${color}` : null,
    size ? `${size}-` : null,
    color ? `-${color}` : null,
    size,
    color,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const value = adjustments[candidate];
    if (Number.isFinite(value) && value > 0) return Number(value);
  }
  return 0;
}

export function resolveVariantUnitPriceMinor(
  product: Pick<Product, "price" | "variantPriceAdjustmentsMinor">,
  key?: string | null,
  size?: string | null,
  color?: string | null,
): number {
  return (
    Math.round(Number(product.price ?? 0) * 100) +
    getVariantPriceAdjustmentMinor(product, key, size, color)
  );
}

export function getVariantPriceRangeMinor(
  product: Pick<
    Product,
    "price" | "variantPriceAdjustmentsMinor" | "sizeOptions" | "colors"
  >,
): { min: number; max: number } {
  const base = Math.round(Number(product.price ?? 0) * 100);
  const rows: Array<{ key: string; size?: string | null; color?: string | null }> = [];
  const sizes = product.sizeOptions?.length ? product.sizeOptions : [null];
  const colors = product.colors?.length ? product.colors : [null];

  sizes.forEach((size) => {
    colors.forEach((color) => {
      rows.push({
        key: buildProductVariantKey(size, color?.label),
        size,
        color: color?.label ?? null,
      });
    });
  });

  const prices = rows.length
    ? rows.map((row) =>
        resolveVariantUnitPriceMinor(product, row.key, row.size, row.color),
      )
    : [base];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getProductFulfillment(
  product: Pick<Product, "fulfillment">,
): ProductFulfillment {
  return {
    method: product.fulfillment?.method ?? "ready_to_ship",
    productionMinDays: product.fulfillment?.productionMinDays ?? null,
    productionMaxDays: product.fulfillment?.productionMaxDays ?? null,
    note: product.fulfillment?.note ?? null,
    unit: product.fulfillment?.unit ?? "business_days",
  };
}

export function formatFulfillmentSummary(
  fulfillment?: ProductFulfillment | null,
): string | null {
  const data = fulfillment?.method
    ? fulfillment
    : ({ method: "ready_to_ship" } as ProductFulfillment);
  if (data.method === "ready_to_ship") return null;

  const label =
    data.method === "custom_production" ? "Custom production" : "Made to order";
  const min = data.productionMinDays;
  const max = data.productionMaxDays;
  const range =
    Number.isFinite(min) && Number.isFinite(max)
      ? min === max
        ? `${min} business days`
        : `${min}-${max} business days`
      : null;

  return range ? `${label} · ${range}` : label;
}
