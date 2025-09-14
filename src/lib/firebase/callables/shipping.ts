import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

// Types for shipping
export type ShippingMethod = "delivery" | "pickup";
export type FulfillmentStatus = "unfulfilled" | "fulfilled" | "shipped" | "delivered" | "cancelled";

export interface ShippingQuoteRequest {
  vendorId: string;
  state: string;
  city?: string;
}

export interface ShippingQuoteResponse {
  feeMinor: number;
}

export interface FulfillmentLineRequest {
  orderId: string;
  lineKey: string; // "merch:{merchItemId}"
  vendorId: string;
  qtyOrdered: number;
  shipping: {
    method: ShippingMethod;
    address?: any;
    feeMinor: number;
  };
}

export interface FulfillmentLineResponse {
  success: boolean;
}

export interface SetFulfillmentStatusRequest {
  orderId: string;
  lineKey: string;
  status: FulfillmentStatus;
  qtyFulfilled?: number;
  trackingNumber?: string;
  carrier?: string;
  note?: string;
}

export interface AddTimelineNoteRequest {
  orderId: string;
  lineKey?: string;
  note: string;
}

// Callable functions
export const quoteShipping = httpsCallable<ShippingQuoteRequest, ShippingQuoteResponse>(
  functions,
  'quoteShipping'
);

export const upsertFulfillmentLine = httpsCallable<FulfillmentLineRequest, FulfillmentLineResponse>(
  functions,
  'upsertFulfillmentLine'
);

export const setFulfillmentStatus = httpsCallable<SetFulfillmentStatusRequest, { success: boolean }>(
  functions,
  'setFulfillmentStatus'
);

export const addTimelineNote = httpsCallable<AddTimelineNoteRequest, { success: boolean }>(
  functions,
  'addTimelineNote'
);
