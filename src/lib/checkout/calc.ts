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
  
  // Calculate subtotal and track which items have transferFeesToGuest
  let itemsSubtotalMinor = 0;
  let transferableFeesMinor = 0;
  
  items.forEach(item => {
    const itemSubtotal = item.unitPriceMinor * item.qty;
    itemsSubtotalMinor += itemSubtotal;
    
    // TODO: Move fee calculation to backend/server to prevent tampering
    // If transferFeesToGuest is true, add Labeld's fee (6% + ₦100) to the item subtotal
    if (item._type === "ticket" && item.transferFeesToGuest) {
      const percentageFee = Math.round(itemSubtotal * 0.06); // 6%
      const flatFee = 10000; // ₦100 in minor units
      const totalFeeForItem = percentageFee + flatFee;
      transferableFeesMinor += totalFeeForItem;
    }
  });
  
  const totalMinor = itemsSubtotalMinor + transferableFeesMinor;

  return {
    currency,
    itemsSubtotalMinor: itemsSubtotalMinor + transferableFeesMinor, // Include transferable fees in subtotal
    feesMinor: 0, // No separate fees shown when transferFeesToGuest is true
    totalMinor,
    breakdown: {
      platformFeeMinor: 0, // Not shown separately
      paymentFeeMinor: transferableFeesMinor, // Only for internal tracking
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
