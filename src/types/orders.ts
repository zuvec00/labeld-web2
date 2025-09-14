/* eslint-disable @typescript-eslint/no-explicit-any */
// types/orders.ts
export type Currency = "NGN";
export type AdmitType = "general" | "vip" | "backstage";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";
export type PaymentProvider = "paystack" | "flutterwave";
export type VendorLineStatus = "processing" | "ready" | "completed" | "cancelled";
export type FulfillmentStatus = "unfulfilled" | "fulfilled" | "shipped" | "delivered" | "cancelled";
export type FulfillmentAggregateStatus = "fulfilled" | "shipped" | "delivered" | "unfulfilled" | "partial";

export interface TicketLineItem {
  _type: "ticket";
  ticketTypeId: string;
  name: string;
  admitType: AdmitType | null;
  unitPriceMinor: number;
  currency: Currency;
  qty: number;
  groupSize: number | null;
  subtotalMinor: number;
  transferFeesToGuest: boolean;
}

export interface MerchLineItem {
  _type: "merch";
  merchItemId: string;
  name: string;
  unitPriceMinor: number;
  currency: Currency;
  qty: number;
  size: string | null;
  color: string | null;
  subtotalMinor: number;
}

export type LineItem = TicketLineItem | MerchLineItem;

export interface OrderDoc {
  id: string;
  eventId: string;
  buyerUserId?: string | null;
  status: OrderStatus;
  lineItems: LineItem[];
  amount: {
    currency: Currency;
    itemsSubtotalMinor: number;
    feesMinor: number;
    shippingMinor?: number;
    totalMinor: number;
  };
  fees?: {
    labeldBuyerFeesMinor?: number;
    labeldAbsorbedFeesMinor?: number;
  };
  provider: PaymentProvider | null;
  providerRef?: { initRef?: string; verifyRef?: string };
  deliverTo?: { name?: string; email?: string; phone?: string };
  shipping?: {
    method: "delivery" | "pickup";
    address?: {
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    pickupAddress?: string;
  };
  hasTickets: boolean;
  ticketQtyByType?: Record<string, number>;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  paidAt?: any;
  cancelledAt?: any;
}

export interface VendorLineStatusDoc {
  lineKey: string;        // "merch:{merchItemId}" or "ticket:{ticketTypeId}"
  vendorId: string;
  status: VendorLineStatus;
  updatedAt: any;         // Timestamp
}

export interface EventLite {
  id: string;
  title?: string;
  createdBy?: string;
}

// UI-specific types
export type OrderTab = "event" | "store";

export interface OrderFilters {
  dateRange: "today" | "7days" | "30days" | "custom";
  customDateRange?: {
    start: Date;
    end: Date;
  };
  statuses: OrderStatus[];
  types: ("ticket" | "merch")[];
  sources: ("event" | "store")[];
  fulfillmentStatuses: FulfillmentAggregateStatus[];
  search: string;
}

export interface VendorScope {
  eventIds: Set<string>;
  merchItemIds: Set<string>;
  isOrganizer: boolean;
  isBrand: boolean;
}

export interface FulfillmentLine {
  lineKey: string;
  qtyOrdered: number;
  qtyFulfilled: number;
  notes?: string;

  // Top-level status (server's canonical field)
  status?: FulfillmentStatus;

  // Shipping payload (UI often reads nested status)
  shipping?: {
    method: "delivery" | "pickup";
    status?: FulfillmentStatus; // optional: normalized by parser
    feeMinor?: number;
    trackingNumber?: string;
    carrier?: string;
    address?: {
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    pickupAddress?: string;
  };

  vendorId: string;
  createdAt: any;
  updatedAt: any;
}

export interface TimelineEvent {
  type: "order_created" | "payment_captured" | "fulfillment_marked" | "note" | "refund";
  actor: string; // "system" | "vendor:{vendorId}" | "user:{uid}"
  message: string;
  meta?: {
    lineKey?: string;
    status?: FulfillmentStatus;
    qtyFulfilled?: number;
    trackingNumber?: string;
    carrier?: string;
  };
  at: any; // Firestore timestamp
}

export interface OrderWithVendorStatus extends OrderDoc {
  vendorLineStatuses?: Record<string, VendorLineStatus>;
  fulfillmentStatuses?: Record<string, FulfillmentStatus>;
  fulfillmentAggregateStatus?: FulfillmentAggregateStatus;
  fulfillmentLines?: Record<string, FulfillmentLine>;
  eventTitle?: string;
  visibleLineItems?: LineItem[];
  visibilityReason?: "organizer" | "brand" | "both";
}
