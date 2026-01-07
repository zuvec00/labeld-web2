import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  OrderByDirection, 
  orderBy,
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { AnalyticsEvent, AnalyticsSummary } from "@/types/analytics";

export async function getBrandAnalytics(
  brandId: string, 
  startDate: Date
): Promise<{ events: AnalyticsEvent[], summary: AnalyticsSummary }> {
  try {
    const analyticsRef = collection(db, "analyticsEvents");
    
    // We want events where this brand is involved either as source or target
    // Note: Firestore OR queries can be tricky. For now, let's focus on 
    // where the brand is the TARGET (interactions with their stuff) 
    // or SOURCE (traffic from their content).
    // A composite query might require an index. 
    // Let's start by querying where target.brandId == brandId, as that covers 
    // "someone clicked MY product" or "viewed MY store".
    
    // Check if we can do this without complex indexes first.
    // If not, we might need to split into two queries.
    
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
    // Return empty if collection doesn't exist or query fails
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
