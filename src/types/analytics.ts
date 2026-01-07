// types/analytics.ts
import { Timestamp } from "firebase/firestore";

export type AnalyticsEventType = "view" | "click" | "add_to_cart" | "purchase";
export type AnalyticsApp = "shopping" | "events" | "studio";
export type AnalyticsSourceType = "radar" | "moment" | "event" | "store" | "direct" | "share" | "push";
export type AnalyticsTargetType = "product" | "event" | "store" | "ticket" | "page";

export interface AnalyticsEvent {
  id?: string;
  eventType: AnalyticsEventType;
  app: AnalyticsApp;
  
  // Source = Where the user came from
  source: {
    type: AnalyticsSourceType;
    id?: string;        // Radar post ID, event ID, etc.
    brandId?: string;   // Brand that owns the source
  };
  
  // Target = What they interacted with
  target: {
    type: AnalyticsTargetType;
    id?: string;        // Product ID, event ID, etc.
    brandId?: string;   // Brand that owns the target
  };
  
  // User context
  userId?: string;      // Firebase Auth UID if logged in
  sessionId: string;    // Random UUID
  
  // Conversion data
  orderId?: string;
  orderTotalMinor?: number;
  
  createdAt: Timestamp | Date;
}

export interface AnalyticsSummary {
  radarToStoreClicks: number;
  momentToProductClicks: number;
  eventToStoreSpillover: number;
  radarConversions: number;
  momentConversions: number;
}
