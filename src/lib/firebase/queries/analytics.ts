import { db } from "@/lib/firebase/firebaseConfig";
import { OrganizerDailyMetrics, EventAnalyticsSummary } from "@/types/event-analytics";
import { AnalyticsEvent, AnalyticsSummary } from "@/types/analytics";
import { collection, documentId, getDocs, limit, orderBy, query, Timestamp, where } from "@firebase/firestore";

/**
 * ==========================================
 * NEW: Event Site Analytics (Aggregated)
 * ==========================================
 */

/**
 * Fetches daily analytics summaries for a given date range.
 */
export async function getEventAnalytics(
  organizerId: string, 
  startDate: Date, 
  endDate: Date
): Promise<OrganizerDailyMetrics[]> {
  if (!organizerId) return [];

  const ref = collection(db, "eventOrganizers", organizerId, "analytics_daily");
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Since the document ID is the YYYY-MM-DD date string, we can query by documentId()
  const q = query(
    ref,
    where(documentId(), ">=", startStr),
    where(documentId(), "<=", endStr),
    orderBy(documentId(), "asc")
  );

  const snapshot = await getDocs(q);
  // Inject the ID as the date if it's missing in the data
  return snapshot.docs.map(doc => ({
    date: doc.id,
    ...doc.data()
  })) as OrganizerDailyMetrics[];
}

/**
 * Aggregates an array of daily metrics into a single summary for the period.
 */
/**
 * Aggregates an array of daily metrics into a single summary for the period.
 */
export function summarizeEventMetrics(dailies: OrganizerDailyMetrics[]): EventAnalyticsSummary {
  const summary: EventAnalyticsSummary = {
    totalRevenue: 0,
    revenueTrend: 0,
    totalTicketsSold: 0,
    ticketsTrend: 0,
    totalPageViews: 0,
    viewsTrend: 0,
    avgConversionRate: 0,
    dailyTrend: dailies,
    topEvents: [], // Filtered later by performance metrics
    trafficSourceBreakdown: []
  };

  if (dailies.length === 0) return summary;

  const trafficMap: Record<string, number> = {};

  dailies.forEach(day => {
    const d = day as any; // Cast to allow robust property access

    // 1. Revenue
    summary.totalRevenue += Number(day.revenue?.gross || 0);
    
    // 2. Tickets Sold
    // Check nested funnel first, then flat key potential, then root ticketsSold
    const tickets = Number(day.funnel?.ticketsSold || d["funnel.ticketsSold"] || day.funnel?.ticketsSold || 0);
    summary.totalTicketsSold += tickets;
    
    // 3. Page Views
    if (typeof day.pageViews === 'number') {
       summary.totalPageViews += day.pageViews;
    } else if (typeof day.pageViews === 'object') {
       summary.totalPageViews += Object.values(day.pageViews).reduce((a, b) => a + (Number(b) || 0), 0);
    } else if (d['pageViews']) {
       summary.totalPageViews += Number(d['pageViews']);
    }

    // 4. Traffic Sources
    if (day.trafficSources) {
      Object.entries(day.trafficSources).forEach(([source, count]) => {
        trafficMap[source] = (trafficMap[source] || 0) + count;
      });
    }
  });

  // Calculate Traffic Breakdown
  summary.trafficSourceBreakdown = Object.entries(trafficMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Conversion Rate & Funnel Totals
  const totalEventViews = dailies.reduce((sum, day) => {
    const d = day as any;
    return sum + Number(day.funnel?.eventDetailViews || d["funnel.eventDetailViews"] || 0);
  }, 0);
  
  const totalOrders = dailies.reduce((sum, day) => {
    const d = day as any;
    return sum + Number(day.funnel?.ordersPlaced || d["funnel.ordersPlaced"] || 0);
  }, 0);
  
  if (totalEventViews > 0) {
    summary.avgConversionRate = (totalOrders / totalEventViews) * 100;
  }

  return summary;
}

/**
 * Fetches the performance metrics for all events belonging to an organizer.
 */
export async function getEventPerformanceMetrics(organizerId: string) {
  if (!organizerId) return [];
  
  const ref = collection(db, "eventOrganizers", organizerId, "event_performance");
  // const q = query(ref, orderBy("revenue.gross", "desc")); // Default sort by revenue
  const q = query(ref);
  
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    eventId: doc.id,
    ...doc.data()
  }));
}

/**
 * ==========================================
 * LEGACY / CORE: Brand Analytics (Raw Events)
 * Used by main Dashboard & Reports
 * ==========================================
 */

export async function getBrandAnalytics(
  brandId: string, 
  startDate: Date
): Promise<{ events: AnalyticsEvent[], summary: AnalyticsSummary }> {
  try {
    const analyticsRef = collection(db, "analyticsEvents");
    
    // We want events where this brand is involved either as source or target
    const q = query(
      analyticsRef,
      where("target.brandId", "==", brandId),
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      orderBy("createdAt", "desc"),
      limit(1000) // Safety limit
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as AnalyticsEvent[];

    // Aggregate Summary
    const summary: AnalyticsSummary = {
      radarToStoreClicks: 0,
      momentToProductClicks: 0,
      eventToStoreSpillover: 0,
      radarConversions: 0,
      momentConversions: 0
    };

    events.forEach(event => {
      // Radar -> Store/Product Clicks
      if (event.source.type === 'radar' && event.eventType === 'click') {
        summary.radarToStoreClicks++;
      }

      // Moment -> Product Clicks
      if (event.source.type === 'moment' && event.eventType === 'click') {
        summary.momentToProductClicks++;
      }

      // Event -> Store Spillover (Traffic coming from an event source)
      if (event.source.type === 'event' && 
          (event.target.type === 'store' || event.target.type === 'product')) {
        summary.eventToStoreSpillover++;
      }

      // Conversions
      if (event.eventType === 'purchase') {
        if (event.source.type === 'radar') summary.radarConversions++;
        if (event.source.type === 'moment') summary.momentConversions++;
      }
    });

    return { events, summary };

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { 
      events: [], 
      summary: {
        radarToStoreClicks: 0,
        momentToProductClicks: 0,
        eventToStoreSpillover: 0,
        radarConversions: 0,
        momentConversions: 0
      } 
    };
  }
}
