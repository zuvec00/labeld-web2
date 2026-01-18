import { useState, useEffect } from "react";
import { StorefrontAnalyticsSummary, StorefrontDailyMetrics, ProductPerformanceMetric, SectionPerformanceMetric } from "@/types/storefront-analytics";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { db } from "@/lib/firebase/firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { getDateRange } from "@/lib/orders/helpers";

interface UseStorefrontAnalyticsReturn {
  data: StorefrontAnalyticsSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useStorefrontAnalytics(range: string = "30days"): UseStorefrontAnalyticsReturn {
  const { user } = useDashboardContext();
  const brandId = user?.uid;
  const [data, setData] = useState<StorefrontAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!brandId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dateRange = getDateRange(range as any);
      const startDateStr = dateRange.start.toISOString().split('T')[0];
      const endDateStr = dateRange.end.toISOString().split('T')[0];

      // 1. Fetch Daily Metrics
      const dailyRef = collection(db, `brands/${brandId}/storefront_daily`);
      const dailyQuery = query(
        dailyRef,
        where("date", ">=", startDateStr),
        where("date", "<=", endDateStr)
      );

      // 1b. Fetch Previous Period Daily Metrics (for trends)
      const duration = dateRange.end.getTime() - dateRange.start.getTime();
      const prevEndTime = dateRange.start.getTime() - 86400000; // 1 day before start
      const prevStartTime = prevEndTime - duration;
      const prevStartDateStr = new Date(prevStartTime).toISOString().split('T')[0];
      const prevEndDateStr = new Date(prevEndTime).toISOString().split('T')[0];

      const prevDailyRef = collection(db, `brands/${brandId}/storefront_daily`);
      const prevDailyQuery = query(
        prevDailyRef,
        where("date", ">=", prevStartDateStr),
        where("date", "<=", prevEndDateStr)
      );

      // 2. Fetch Product Performance
      const productsRef = collection(db, `brands/${brandId}/product_performance_daily`);
      const productsQuery = query(
        productsRef,
        where("date", ">=", startDateStr),
        where("date", "<=", endDateStr)
      );

      // 3. Fetch Section Performance
      const sectionsRef = collection(db, `brands/${brandId}/section_performance_daily`);
      const sectionsQuery = query(
        sectionsRef,
        where("date", ">=", startDateStr),
        where("date", "<=", endDateStr)
      );

      // Run parallel
      const [dailySnap, prevDailySnap, productsSnap, sectionsSnap] = await Promise.all([
        getDocs(dailyQuery),
        getDocs(prevDailyQuery),
        getDocs(productsQuery),
        getDocs(sectionsQuery)
      ]);

      // --- Aggregation Logic ---

      // A. Process Daily Trends
      const dailyTrend: StorefrontDailyMetrics[] = dailySnap.docs.map(doc => doc.data() as StorefrontDailyMetrics)
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const prevDailyTrend: StorefrontDailyMetrics[] = prevDailySnap.docs.map(doc => doc.data() as StorefrontDailyMetrics);

      // B. Process Products (Group by productId)
      const productMap = new Map<string, ProductPerformanceMetric>();
      
      productsSnap.docs.forEach(doc => {
        const p = doc.data() as any;
        // Strip the date prefix if present in the ID (unlikely if strictly following schema but good safety)
        const pid = p.productId; // The schema says productId is stored directly
        
        const current = productMap.get(pid) || {
          productId: pid,
          productName: p.productName || "Unknown Product",
          views: 0,
          addToCarts: 0,
          purchases: 0,
          revenue: 0,
          conversionRate: 0,
          imageUrl: p.imageUrl
        };

        current.views += (p.views || 0);
        current.addToCarts += (p.addToCarts || 0);
        current.purchases += (p.purchases || 0);
        current.revenue += ((p.revenue || 0) * 100); // Convert to minor units;
        
        // Update name/image if available on the analytics doc (last one wins)
        if (p.productName) current.productName = p.productName;
        if (p.imageUrl) current.imageUrl = p.imageUrl;

        productMap.set(pid, current);
      });

      // B.1 Hydrate Missing Product Details (Name/Image)
      // If we rely purely on analytics docs, they might miss name/image if not stored excessively.
      // Let's fetch from 'dropProducts' for any products found.
      const productIdsToHydrate = Array.from(productMap.keys());
      
      // Batch fetch product details (chunk by 10 for 'in' query)
      if (productIdsToHydrate.length > 0) {
        const chunkSize = 10;
        const productFetchPromises = [];
        for (let i = 0; i < productIdsToHydrate.length; i += chunkSize) {
          const chunk = productIdsToHydrate.slice(i, i + chunkSize);
          const q = query(
             collection(db, "dropProducts"), 
             where("__name__", "in", chunk)
          );
          productFetchPromises.push(getDocs(q));
        }
        
        const productDetailsSnaps = await Promise.all(productFetchPromises);
        productDetailsSnaps.forEach(snap => {
            snap.docs.forEach(doc => {
                const pData = doc.data();
                const pid = doc.id;
                const entry = productMap.get(pid);
                if (entry) {
                    entry.productName = pData.dropName || entry.productName;
                    // Try different image fields common in schemas
                    entry.imageUrl = pData.mainVisualUrl || pData.images?.[0] || pData.imageUrl || pData.image || entry.imageUrl;
                }
            });
        });
      }

      // B.2 Finalize Product Metrics
      const topProducts: ProductPerformanceMetric[] = Array.from(productMap.values()).map(p => ({
        ...p,
        conversionRate: p.views > 0 ? (p.purchases / p.views) * 100 : 0
      })).sort((a, b) => b.views - a.views); // Default sort by views

      // C. Process Sections (Group by sectionId)
      const sectionMap = new Map<string, SectionPerformanceMetric>();
      sectionsSnap.docs.forEach(doc => {
        const s = doc.data() as any;
        const current = sectionMap.get(s.sectionId) || {
          sectionId: s.sectionId,
          sectionType: s.sectionType,
          sectionName: s.sectionName,
          impressions: 0,
          ctaClicks: 0,
          ctr: 0
        };

        current.impressions += (s.impressions || 0);
        current.ctaClicks += (s.ctaClicks || 0);
        if (s.sectionName) current.sectionName = s.sectionName;

        sectionMap.set(s.sectionId, current);
      });

      // C.1 Finalize Section Metrics
      const sectionPerformance: SectionPerformanceMetric[] = Array.from(sectionMap.values()).map(s => ({
        ...s,
        ctr: s.impressions > 0 ? (s.ctaClicks / s.impressions) * 100 : 0
      })).sort((a, b) => b.impressions - a.impressions);

      // D. Global Summaries (Current)
      const totalVisits = dailyTrend.reduce((acc, day) => acc + (day.sessions || 0), 0);
      const uniqueVisitors = dailyTrend.reduce((acc, day) => acc + (day.uniqueVisitors || 0), 0);
      const totalPurchases = dailyTrend.reduce((acc, day) => acc + (day.totalPurchases || 0), 0);
      // Revenue in DB is Major Units (e.g. 22850). formatCurrency expects Minor (divides by 100).
      // So we multiply by 100 here to align with the formatter.
      const revenue = dailyTrend.reduce((acc, day) => acc + (day.grossRevenue || 0), 0) * 100;
      const conversionRate = totalVisits > 0 ? (totalPurchases / totalVisits) * 100 : 0;

      // D.2 Global Summaries (Previous)
      const prevVisits = prevDailyTrend.reduce((acc, day) => acc + (day.sessions || 0), 0);
      const prevUnique = prevDailyTrend.reduce((acc, day) => acc + (day.uniqueVisitors || 0), 0);
      const prevPurchases = prevDailyTrend.reduce((acc, day) => acc + (day.totalPurchases || 0), 0);
      const prevRevenue = prevDailyTrend.reduce((acc, day) => acc + (day.grossRevenue || 0), 0) * 100;
      const prevConversion = prevVisits > 0 ? (prevPurchases / prevVisits) * 100 : 0;

      // Helper for trend calculation
      const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      const visitsTrend = calcTrend(totalVisits, prevVisits);
      const uniqueVisitorsTrend = calcTrend(uniqueVisitors, prevUnique);
      const conversionRateTrend = calcTrend(conversionRate, prevConversion);
      const revenueTrend = calcTrend(revenue, prevRevenue);

      // E. Traffic Sources
      const sourceAgg = { direct: 0, social: 0, discovery: 0, referral: 0, unknown: 0 };
      
      dailyTrend.forEach(day => {
        const d = day as any; // Cast to any to access potential flattened keys safely

        // 1. Try standard nested object
        if (day.trafficSources) {
          sourceAgg.direct += (day.trafficSources.direct || 0);
          sourceAgg.social += (day.trafficSources.social || 0);
          sourceAgg.discovery += (day.trafficSources.discovery || 0);
          sourceAgg.referral += (day.trafficSources.referral || 0);
          sourceAgg.unknown += (day.trafficSources.unknown || 0);
        }

        // 2. Try flattened dot-notation keys (Fallback for flat storage)
        if (d["trafficSources.direct"]) sourceAgg.direct += (d["trafficSources.direct"] || 0);
        if (d["trafficSources.social"]) sourceAgg.social += (d["trafficSources.social"] || 0);
        if (d["trafficSources.discovery"]) sourceAgg.discovery += (d["trafficSources.discovery"] || 0);
        if (d["trafficSources.referral"]) sourceAgg.referral += (d["trafficSources.referral"] || 0);
        if (d["trafficSources.unknown"]) sourceAgg.unknown += (d["trafficSources.unknown"] || 0);
      });

      const trafficSourceBreakdown = [
        { name: "Social", value: sourceAgg.social },
        { name: "Direct", value: sourceAgg.direct },
        { name: "Discovery", value: sourceAgg.discovery },
        { name: "Referral", value: sourceAgg.referral },
      ].filter(s => s.value > 0);

      setData({
        totalVisits,
        visitsTrend,
        uniqueVisitors,
        uniqueVisitorsTrend,
        conversionRate,
        conversionRateTrend,
        revenue,
        revenueTrend,
        dailyTrend,
        topProducts,
        sectionPerformance,
        trafficSourceBreakdown
      });

    } catch (err: any) {
      console.error("Error fetching storefront analytics:", err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [brandId, range]);

  return { data, loading, error, refresh: fetchData };
}

