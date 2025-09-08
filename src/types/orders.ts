// types/orders.ts
export type Currency = "NGN";
export type AdmitType = "general" | "vip" | "backstage";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";
export type PaymentProvider = "paystack" | "flutterwave";
export type VendorLineStatus = "processing" | "ready" | "completed" | "cancelled";

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
    totalMinor: number;
  };
  fees?: {
    labeldBuyerFeesMinor?: number;
    labeldAbsorbedFeesMinor?: number;
  };
  provider: PaymentProvider | null;
  providerRef?: { initRef?: string; verifyRef?: string };
  deliverTo?: { email?: string; phone?: string };
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
  search: string;
}

export interface VendorScope {
  eventIds: Set<string>;
  merchItemIds: Set<string>;
  isOrganizer: boolean;
  isBrand: boolean;
}

export interface OrderWithVendorStatus extends OrderDoc {
  vendorLineStatuses?: Record<string, VendorLineStatus>;
  eventTitle?: string;
  visibleLineItems?: LineItem[];
  visibilityReason?: "organizer" | "brand" | "both";
}
