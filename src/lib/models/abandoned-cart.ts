import { Timestamp } from "firebase/firestore";

export type CartStatus =
  | "pending"
  | "contacted"
  | "recovered"
  | "expired"
  | "uncontactable";

export interface AbandonedCart {
  id: string; // Firestore doc id
  reference: string;
  brandId: string;
  brandName: string;
  customerName: string | null;
  customerEmail: string;
  phone: string;
  amount: number; // kobo
  channel: string;
  itemCount: number;
  status: CartStatus;
  emailsSentCount: number;
  nextEmailAt: Timestamp | null;
  detectedAt: Timestamp;
  source: "webhook" | "backfill";
  recoveredAt: Timestamp | null;
  recoveryReference: string | null;
}

export interface RecoverySettings {
  brandId: string;
  enabled: boolean;
  emailEnabled: boolean;
  reminderFrequency: number; // 1–3
  delayBetweenMessages: number; // hours: 1 | 2 | 6 | 24
  emailSubject: string;
  emailTitle: string;
  emailBody: string;
  ctaText: string;
  ctaLink: string;
  heroImage: string | null;
}

export const DEFAULT_RECOVERY_SETTINGS: Omit<RecoverySettings, "brandId"> = {
  enabled: false,
  emailEnabled: true,
  reminderFrequency: 2,
  delayBetweenMessages: 6,
  emailSubject: "You left something behind 👀",
  emailTitle: "Complete your purchase",
  emailBody: "You left some items in your cart. Come back and complete your order before it sells out.",
  ctaText: "Return to Cart",
  ctaLink: "",
  heroImage: null,
};
