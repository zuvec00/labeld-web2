import { CartItem } from "@/hooks/useCheckoutCart";

export interface Totals {
  currency: "NGN" | "USD";
  itemsSubtotalMinor: number;
  feesMinor: number;
  totalMinor: number;
  breakdown: {
    platformFeeMinor: number;
    paymentFeeMinor: number;
  };
}

export function calcTotals(items: CartItem[]): Totals {
  if (items.length === 0) {
    return {
      currency: "NGN",
      itemsSubtotalMinor: 0,
      feesMinor: 0,
      totalMinor: 0,
      breakdown: {
        platformFeeMinor: 0,
        paymentFeeMinor: 0,
      },
    };
  }

  const currency = items[0]?.currency ?? "NGN";
  const itemsSubtotalMinor = items.reduce((sum, item) => sum + (item.unitPriceMinor * item.qty), 0);
  
  // Platform fee: 5%
  const platformFeeMinor = Math.round(itemsSubtotalMinor * 0.05);
  
  // Payment fee: 1.5%
  const paymentFeeMinor = Math.round(itemsSubtotalMinor * 0.015);
  
  const feesMinor = platformFeeMinor + paymentFeeMinor;
  const totalMinor = itemsSubtotalMinor + feesMinor;

  return {
    currency,
    itemsSubtotalMinor,
    feesMinor,
    totalMinor,
    breakdown: {
      platformFeeMinor,
      paymentFeeMinor,
    },
  };
}

// Helper function to format currency
export function formatCurrency(amountMinor: number, currency: "NGN" | "USD" = "NGN"): string {
  const amount = amountMinor / 100; // Convert from minor units (kobo/cents)
  
  if (currency === "NGN") {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
