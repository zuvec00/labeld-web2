import { getOrdersInDateRange, getEventDetailsBatch } from "@/lib/firebase/queries/orders";
import { OrderDoc } from "@/types/orders";

export interface EventRevenueStats {
  eventId: string;
  eventTitle: string;
  orderCount: number;
  grossRevenueMinor: number;
  platformFeesMinor: number;
  netRevenueMinor: number;
}

export interface RevenueBreakdownSummary {
  totalGrossMinor: number;
  totalFeesMinor: number;
  totalNetMinor: number;
  totalOrders: number;
  events: EventRevenueStats[];
}

/**
 * Fetches orders within a date range and aggregates revenue stats by event.
 * Note: Currently fetches up to 1000 orders. For larger datasets, pagination or a dedicated aggregation query would be needed.
 */
export async function getEventRevenueBreakdown(
  startDate: Date,
  endDate: Date
): Promise<RevenueBreakdownSummary> {
  // Fetch a large batch of orders to cover most use cases for this admin view
  // TODO: Implement recursive fetching/pagination if order volume exceeds 1000 in the selected range
  const { orders } = await getOrdersInDateRange(startDate, endDate, 1000);

  const statsMap: Record<string, EventRevenueStats> = {};
  
  let totalGrossMinor = 0;
  let totalFeesMinor = 0;
  let totalNetMinor = 0;

  // Aggregate by Event ID
  for (const order of orders) {
    if (!order.eventId) continue; // Skip store orders or anomalies without eventId
    
    // Initialize if new
    if (!statsMap[order.eventId]) {
      statsMap[order.eventId] = {
        eventId: order.eventId,
        eventTitle: "Unknown Event", // Will populate later
        orderCount: 0,
        grossRevenueMinor: 0,
        platformFeesMinor: 0,
        netRevenueMinor: 0,
      };
    }

    const stats = statsMap[order.eventId];
    const orderTotal = order.amount.totalMinor;
    const orderFees = order.amount.feesMinor;
    const orderNet = orderTotal - orderFees;

    stats.orderCount += 1;
    stats.grossRevenueMinor += orderTotal;
    stats.platformFeesMinor += orderFees;
    stats.netRevenueMinor += orderNet;

    // Update Totals
    totalGrossMinor += orderTotal;
    totalFeesMinor += orderFees;
    totalNetMinor += orderNet;
  }

  // Fetch Event Titles
  const eventIds = Object.keys(statsMap);
  if (eventIds.length > 0) {
    const eventDetailsMap = await getEventDetailsBatch(eventIds);
    
    for (const eventId of eventIds) {
      if (eventDetailsMap[eventId]) {
        statsMap[eventId].eventTitle = eventDetailsMap[eventId].title || "Untitled Event";
      }
    }
  }

  // Sort by Net Revenue DESC
  const sortedEvents = Object.values(statsMap).sort((a, b) => b.netRevenueMinor - a.netRevenueMinor);

  return {
    totalGrossMinor,
    totalFeesMinor,
    totalNetMinor,
    totalOrders: orders.length,
    events: sortedEvents,
  };
}
