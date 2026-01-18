import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

export type BillingCycle = "monthly" | "quarterly" | "biannual" | "annual";

interface StartProSubscriptionRequest {
  billingCycle: BillingCycle;
  claimPromo?: boolean;
  isLive?: boolean;
}

interface StartProSubscriptionResponse {
  success: boolean;
  subscriptionCode: string; // The Firestore ID of the subscription
}

/**
 * Calls the `startProSubscription` Cloud Function.
 */
export const startProSubscription = httpsCallable<
  StartProSubscriptionRequest,
  StartProSubscriptionResponse
>(functions, "startProSubscription");
