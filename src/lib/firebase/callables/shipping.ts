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

// Store Order Types
export interface CreateStoreFulfillmentLinesRequest {
  orderId: string;
  lineItems: Array<{
    productId: string;
    qty: number;
    brandId: string;
  }>;
  shipping: {
    method: ShippingMethod;
    address?: any;
    feeMinor: number;
  };
}

export interface CreateStoreFulfillmentLinesResponse {
  success: boolean;
  linesCreated: number;
}

export interface GetStoreFulfillmentLinesRequest {
  orderId: string;
}

export interface GetStoreFulfillmentLinesResponse {
  success: boolean;
  lines: any[];
}

export interface UpdateStoreFulfillmentStatusRequest {
  orderId: string;
  lineKey: string;
  status: FulfillmentStatus;
  qtyFulfilled?: number;
  trackingNumber?: string;
  carrier?: string;
  note?: string;
}

export interface UpdateStoreFulfillmentStatusResponse {
  success: boolean;
  emailSent: boolean;
}

export interface GetStoreOrderTimelineRequest {
  orderId: string;
}

export interface GetStoreOrderTimelineResponse {
  success: boolean;
  timeline: any[];
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

// Store Order Callable Functions
export const createStoreFulfillmentLines = httpsCallable<CreateStoreFulfillmentLinesRequest, CreateStoreFulfillmentLinesResponse>(
  functions,
  'createStoreFulfillmentLines'
);

export const getStoreFulfillmentLines = httpsCallable<GetStoreFulfillmentLinesRequest, GetStoreFulfillmentLinesResponse>(
  functions,
  'getStoreFulfillmentLines'
);

export const updateStoreFulfillmentStatus = httpsCallable<UpdateStoreFulfillmentStatusRequest, UpdateStoreFulfillmentStatusResponse>(
  functions,
  'updateStoreFulfillmentStatus'
);

export const getStoreOrderTimeline = httpsCallable<GetStoreOrderTimelineRequest, GetStoreOrderTimelineResponse>(
  functions,
  'getStoreOrderTimeline'
);
