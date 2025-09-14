// lib/orders/helpers.ts
import { Timestamp } from "firebase/firestore";
import { LineItem, VendorLineStatus, FulfillmentStatus, FulfillmentAggregateStatus, FulfillmentLine } from "@/types/orders";

// Currency formatting
export function formatNaira(minor: number): string {
  const major = minorToMajor(minor);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

export function minorToMajor(minor: number): number {
  return minor / 100;
}

// Date formatting for Africa/Lagos timezone
export function formatLagos(ts: Timestamp | number | Date): string {
  let date: Date;
  
  if (ts instanceof Timestamp) {
    date = ts.toDate();
  } else if (typeof ts === "number") {
    date = new Date(ts);
  } else {
    date = ts;
  }

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatLagosDate(ts: Timestamp | number | Date): string {
  let date: Date;
  
  if (ts instanceof Timestamp) {
    date = ts.toDate();
  } else if (typeof ts === "number") {
    date = new Date(ts);
  } else {
    date = ts;
  }

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// Line item helpers
export function getLineKey(line: LineItem): string {
  if (line._type === "merch") {
    return `merch:${line.merchItemId}`;
  } else {
    return `ticket:${line.ticketTypeId}`;
  }
}

export function getLineItemSummary(line: LineItem): string {
  const qty = line.qty;
  const name = line.name;
  
  if (line._type === "merch") {
    const size = line.size ? ` (${line.size})` : "";
    const color = line.color ? ` ${line.color}` : "";
    return `${qty}× ${name}${size}${color}`;
  } else {
    const admitType = line.admitType ? ` (${line.admitType.toUpperCase()})` : "";
    return `${qty}× ${name}${admitType}`;
  }
}

export function getOrderTypeSummary(lineItems: LineItem[]): string {
  const hasTickets = lineItems.some(item => item._type === "ticket");
  const hasMerch = lineItems.some(item => item._type === "merch");
  
  if (hasTickets && hasMerch) return "Mixed";
  if (hasTickets) return "Tickets";
  if (hasMerch) return "Merch";
  return "Unknown";
}

export function getOrderItemsSummary(lineItems: LineItem[]): string {
  const summaries = lineItems.map(getLineItemSummary);
  
  if (summaries.length <= 2) {
    return summaries.join(", ");
  } else {
    return `${summaries.slice(0, 2).join(", ")} +${summaries.length - 2} more`;
  }
}

// Date range helpers
export function getDateRange(type: "today" | "7days" | "30days" | "custom", customRange?: { start: Date; end: Date }) {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  switch (type) {
    case "today":
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return {
        start: startOfDay,
        end: now,
        label: "Today"
      };
    case "7days":
      return {
        start: new Date(now.getTime() - 7 * oneDay),
        end: now,
        label: "Last 7 days"
      };
    case "30days":
      return {
        start: new Date(now.getTime() - 30 * oneDay),
        end: now,
        label: "Last 30 days"
      };
    case "custom":
      if (customRange) {
        return {
          start: customRange.start,
          end: customRange.end,
          label: "Custom range"
        };
      }
      // Fallback to 30 days
      return {
        start: new Date(now.getTime() - 30 * oneDay),
        end: now,
        label: "Last 30 days"
      };
    default:
      return {
        start: new Date(now.getTime() - 7 * oneDay),
        end: now,
        label: "Last 7 days"
      };
  }
}

// Status helpers
export function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "text-accent bg-accent/10 border-accent/20";
    case "pending":
      return "text-edit bg-edit/10 border-edit/20";
    case "failed":
      return "text-alert bg-alert/10 border-alert/20";
    case "refunded":
      return "text-calm-2 bg-calm-2/10 border-calm-2/20";
    case "cancelled":
      return "text-text-muted bg-stroke border-stroke";
    default:
      return "text-text-muted bg-stroke border-stroke";
  }
}

export function getVendorStatusColor(status: VendorLineStatus): string {
  switch (status) {
    case "processing":
      return "text-edit bg-edit/10 border-edit/20";
    case "ready":
      return "text-calm-1 bg-calm-1/10 border-calm-1/20";
    case "completed":
      return "text-accent bg-accent/10 border-accent/20";
    case "cancelled":
      return "text-alert bg-alert/10 border-alert/20";
    default:
      return "text-text-muted bg-stroke border-stroke";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function getVendorStatusLabel(status: VendorLineStatus): string {
  switch (status) {
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

// Fulfillment status helpers
export function getFulfillmentStatusColor(status: FulfillmentStatus): string {
  switch (status) {
    case "fulfilled":
      return "text-accent bg-accent/10 border-accent/20";
    case "shipped":
      return "text-calm-1 bg-calm-1/10 border-calm-1/20";
    case "delivered":
      return "text-accent bg-accent/10 border-accent/20";
    case "unfulfilled":
      return "text-edit bg-edit/10 border-edit/20";
    case "cancelled":
      return "text-alert bg-alert/10 border-alert/20";
    default:
      return "text-text-muted bg-stroke border-stroke";
  }
}

export function getFulfillmentStatusLabel(status: FulfillmentStatus): string {
  switch (status) {
    case "fulfilled":
      return "Fulfilled";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "unfulfilled":
      return "Unfulfilled";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function getFulfillmentAggregateStatusColor(status: FulfillmentAggregateStatus): string {
  switch (status) {
    case "fulfilled":
      return "text-green-600 bg-green-100 border-green-200";
    case "shipped":
      return "text-blue-600 bg-blue-100 border-blue-200";
    case "delivered":
      return "text-green-600 bg-green-100 border-green-200";
    case "unfulfilled":
      return "text-yellow-600 bg-yellow-100 border-yellow-200";
    case "partial":
      return "text-orange-600 bg-orange-100 border-orange-200";
    default:
      return "text-text-muted bg-stroke border-stroke";
  }
}

export function getFulfillmentAggregateStatusLabel(status: FulfillmentAggregateStatus): string {
  switch (status) {
    case "fulfilled":
      return "Fulfilled";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "unfulfilled":
      return "Unfulfilled";
    case "partial":
      return "Partial";
    default:
      return status;
  }
}

export function calculateFulfillmentAggregateStatus(
  fulfillmentStatuses: Record<string, FulfillmentStatus>,
  vendorOwnedLineKeys: string[]
): FulfillmentAggregateStatus {
  if (vendorOwnedLineKeys.length === 0) {
    return "fulfilled"; // No vendor-owned lines means nothing to fulfill
  }

  const statuses = vendorOwnedLineKeys.map(lineKey => fulfillmentStatuses[lineKey] || "unfulfilled");
  
  const hasUnfulfilled = statuses.some(status => status === "unfulfilled");
  const hasFulfilled = statuses.some(status => ["fulfilled", "shipped", "delivered"].includes(status));
  
  if (hasUnfulfilled && hasFulfilled) {
    return "partial";
  } else if (hasUnfulfilled) {
    return "unfulfilled";
  } else {
    return "fulfilled";
  }
}

// Search helpers
export function matchesSearch(order: { id?: string; deliverTo?: { email?: string } }, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  
  const term = searchTerm.toLowerCase();
  const orderId = order.id?.toLowerCase() || "";
  const email = order.deliverTo?.email?.toLowerCase() || "";
  
  return orderId.includes(term) || email.includes(term);
}

// Pagination helpers
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return items.slice(startIndex, endIndex);
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}

// Fulfillment line status helper
export function getLineFulfillmentStatus(line: FulfillmentLine): FulfillmentStatus {
  return line.status ?? line.shipping?.status ?? "unfulfilled";
}
