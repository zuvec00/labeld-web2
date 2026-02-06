import {Timestamp} from "firebase-admin/firestore";

// --- Subscription Models ---

export type SubscriptionPlan = "pro";
export type BillingCycle = "monthly" | "quarterly" | "biannual" | "annual";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "past_due";

/**
 * subscriptions/{subscriptionId}
 * Source of truth for brand subscriptions.
 */
export interface SubscriptionDoc {
  brandId?: string;
  organizerId?: string; // NEW: For event organizer subscriptions

  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  amount: number; // Amount in minor units (e.g. kobo) recommended
  currency: string; // e.g. "NGN"

  paystack: {
    customerCode: string;
    subscriptionCode: string;
    planCode: string;
  };

  status: SubscriptionStatus;
  isPromo?: boolean;
  source?: "promo_launch" | "paystack";
  startedAt: Timestamp;
  endsAt: Timestamp;
  graceEndsAt: Timestamp;
  nextBillingAt: Timestamp | null;
  cancelledAt: Timestamp | null;
}

// --- Payment Ledger Models ---

export type SubPaymentStatus = "success" | "failed";

/**
 * sub_payments/{paymentId}
 * Ledger / support for subscription payments.
 */
export interface SubPaymentDoc {
  brandId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paystackReference: string;
  status: SubPaymentStatus;
  createdAt: Timestamp;
}
