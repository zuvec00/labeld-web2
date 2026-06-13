"use client";

import {
  getFirestore,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebaseConfig";

export type SaleChannel =
  | "physical_store"
  | "pop_up"
  | "instagram"
  | "whatsapp"
  | "snapchat"
  | "tiktok"
  | "other";

export type PaymentMethod = "cash" | "transfer" | "pos" | "pending";

export interface ManualSaleItem {
  productId: string;
  name: string;
  mainVisualUrl?: string | null;
  unitPriceMinor: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  variantKey?: string | null;
  subtotalMinor: number;
  stockMode: "global" | "variants" | "unlimited";
}

export interface ManualSaleInput {
  brandId: string;
  recordedBy: string;
  items: ManualSaleItem[];
  saleChannel: SaleChannel;
  paymentMethod: PaymentMethod;
  note?: string;
  shippingMinor?: number;
  deliverTo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
  };
  saleDate?: Date;
}

export class ManualSaleError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "insufficient_stock"
      | "product_not_found"
      | "invalid_variant"
      | "brand_mismatch"
      | "transaction_failed"
      | "unknown"
  ) {
    super(message);
  }
}

export async function logManualSale(sale: ManualSaleInput): Promise<string> {
  const db = getFirestore(app);

  const orderId = await runTransaction(db, async (tx) => {
    // Read all products inside the transaction
    const productRefs = sale.items.map((item) =>
      doc(db, "dropProducts", item.productId)
    );
    const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

    // Validate each product
    for (let i = 0; i < sale.items.length; i++) {
      const item = sale.items[i];
      const snap = productSnaps[i];

      if (!snap.exists()) {
        throw new ManualSaleError(
          `Product "${item.name}" no longer exists`,
          "product_not_found"
        );
      }

      const d = snap.data()!;
      if (d.brandId && d.brandId !== sale.brandId) {
        throw new ManualSaleError(
          `Product "${item.name}" does not belong to this brand`,
          "brand_mismatch"
        );
      }

      const stockMode = d.stockMode ?? "unlimited";

      if (stockMode === "global") {
        const remaining = d.stockRemaining as number | null | undefined;
        if (remaining != null && item.quantity > remaining) {
          throw new ManualSaleError(
            `Only ${remaining} unit${remaining !== 1 ? "s" : ""} left for "${item.name}"`,
            "insufficient_stock"
          );
        }
      } else if (stockMode === "variants") {
        if (!item.variantKey) {
          throw new ManualSaleError(
            `"${item.name}" requires a size or colour selection`,
            "invalid_variant"
          );
        }
        const variantStock = (d.variantStock ?? {}) as Record<string, number>;
        const available = variantStock[item.variantKey];
        if (available == null) {
          throw new ManualSaleError(
            `Invalid variant (${item.variantKey}) for "${item.name}"`,
            "invalid_variant"
          );
        }
        if (item.quantity > available) {
          throw new ManualSaleError(
            `Only ${available} unit${available !== 1 ? "s" : ""} left for "${item.name}" (${item.variantKey})`,
            "insufficient_stock"
          );
        }
      }
    }

    // Write the order document
    const shipping = sale.shippingMinor ?? 0;
    const totalItems = sale.items.reduce((s, i) => s + i.subtotalMinor, 0);
    const isPaid = sale.paymentMethod !== "pending";
    const ts =
      sale.saleDate ? Timestamp.fromDate(sale.saleDate) : serverTimestamp();

    const orderRef = doc(collection(db, "storeOrders"));
    tx.set(orderRef, {
      brandId: sale.brandId,
      buyerUserId: sale.brandId,
      saleType: "manual_sale",
      saleChannel: sale.saleChannel,
      paymentMethod: sale.paymentMethod,
      status: isPaid ? "paid" : "pending",
      lineItems: sale.items.map((item) => ({
        _type: "product",
        productId: item.productId,
        name: item.name,
        unitPriceMinor: item.unitPriceMinor,
        currency: "NGN",
        qty: item.quantity,
        ...(item.size ? { size: item.size } : {}),
        ...(item.color ? { color: item.color } : {}),
        subtotalMinor: item.subtotalMinor,
        absorbTransactionFee: false,
      })),
      amount: {
        currency: "NGN",
        itemsSubtotalMinor: totalItems,
        feesMinor: 0,
        shippingMinor: shipping,
        totalMinor: totalItems + shipping,
      },
      ...(sale.note?.trim() ? { note: sale.note.trim() } : {}),
      ...(sale.deliverTo ? { deliverTo: sale.deliverTo } : {}),
      recordedBy: sale.recordedBy,
      createdAt: ts,
      updatedAt: serverTimestamp(),
      ...(isPaid ? { paidAt: ts } : {}),
    });

    // Decrement stock
    for (let i = 0; i < sale.items.length; i++) {
      const item = sale.items[i];
      const snap = productSnaps[i];
      const d = snap.data()!;
      const stockMode = d.stockMode ?? "unlimited";
      const ref = productRefs[i];

      if (stockMode === "global" && d.stockRemaining != null) {
        tx.update(ref, {
          stockRemaining: increment(-item.quantity),
          updatedAt: serverTimestamp(),
        });
      } else if (stockMode === "variants" && item.variantKey) {
        tx.update(ref, {
          [`variantStock.${item.variantKey}`]: increment(-item.quantity),
          updatedAt: serverTimestamp(),
        });
      }
    }

    return orderRef.id;
  });

  // Create fulfillment lines (non-critical — don't fail the sale if this errors)
  try {
    const fn = getFunctions(app);
    const createLines = httpsCallable(fn, "createStoreFulfillmentLines");
    const hasDelivery = !!(sale.deliverTo || (sale.shippingMinor ?? 0) > 0);
    await createLines({
      orderId,
      lineItems: sale.items.map((item) => ({
        productId: item.productId,
        qty: item.quantity,
        brandId: sale.brandId,
        ...(item.size ? { size: item.size } : {}),
        ...(item.color ? { color: item.color } : {}),
      })),
      shipping: {
        method: hasDelivery ? "delivery" : "pickup",
        feeMinor: sale.shippingMinor ?? 0,
        ...(sale.deliverTo ? { address: sale.deliverTo } : {}),
      },
    });
  } catch {
    // Fulfillment lines are best-effort
  }

  // Sync customer order history (non-critical — sale already succeeded)
  try {
    if (sale.deliverTo) {
      const fn = getFunctions(app);
      const syncCustomer = httpsCallable(fn, "syncCustomerFromManualSale");
      await syncCustomer({
        brandId: sale.brandId,
        orderId,
      });
    }
  } catch {
    // Customer history can be retried safely because the callable is idempotent
  }

  return orderId;
}
