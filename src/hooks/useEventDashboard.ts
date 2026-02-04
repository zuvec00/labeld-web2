// hooks/useEventDashboard.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebaseConfig";
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore";
import { getMultipleEventTicketStats, TicketStats } from "@/lib/firebase/queries/attendeeTickets";
import { EventTimelineRange, getDateRangeFromTimeline } from "@/components/dashboard/EventTimelineControls";
import { EventModel } from "@/lib/models/event";
import { TopTicketType } from "@/hooks/useDashboard";
import { getEventAnalytics, summarizeEventMetrics, getEventPerformanceMetrics } from "@/lib/firebase/queries/analytics";
import { EventAnalyticsSummary } from "@/types/event-analytics";

export interface EventDashboardKPIs {
  totalTicketsSold: number;
  totalCheckedIn: number;
  checkInRate: number; // percentage 0-100
  totalRevenue: number; // in minor units
  totalOrders: number;
  ordersPerDay: number;
  upcomingEventsCount: number;
  pastEventsCount: number;
}

export interface EventDashboardData {
  kpis: EventDashboardKPIs;
  events: EventModel[];
  ticketStatsByEvent: Record<string, TicketStats>;
  recentOrders: any[];
  salesOverTime: Array<{ date: string; count: number }>;
  topTicketTypes: TopTicketType[];
  trend: "up" | "down" | "flat";
  // New Analytics Fields
  analyticsSummary?: EventAnalyticsSummary | null;
  eventsPerformance?: any[];
}

interface UseEventDashboardReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  data: EventDashboardData | null;
  timelineRange: EventTimelineRange;
  customDateRange: { start: Date; end: Date } | null;
  setTimelineRange: (range: EventTimelineRange, customRange?: { start: Date; end: Date }) => void;
  refresh: () => void;
}

export function useEventDashboard(): UseEventDashboardReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventDashboardData | null>(null);
  const [timelineRange, setTimelineRangeState] = useState<EventTimelineRange>("3months");
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  
  const fetchingRef = useRef(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    if (!user?.uid || fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRangeFromTimeline(timelineRange, customDateRange ?? undefined);

      // Fetch events created by user
      const eventsQuery = query(
        collection(db, "events"),
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events: EventModel[] = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startAt: doc.data().startAt?.toDate?.() || new Date(doc.data().startAt),
        endAt: doc.data().endAt?.toDate?.() || undefined,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as EventModel[];

      // Split into upcoming and past events
      const now = new Date();
      const upcomingEvents = events.filter(e => e.startAt > now);
      const pastEvents = events.filter(e => e.startAt <= now);

      // Get event IDs for filtering
      const eventIds = events.map(e => e.id!).filter(Boolean);

      // Fetch ticket stats for all events
      let ticketStatsByEvent: Record<string, TicketStats> = {};
      let totalTicketsSold = 0;
      let totalCheckedIn = 0;

      if (eventIds.length > 0) {
        ticketStatsByEvent = await getMultipleEventTicketStats(eventIds);
        
        // Calculate totals
        Object.values(ticketStatsByEvent).forEach(stats => {
          totalTicketsSold += stats.totalTickets;
          totalCheckedIn += stats.checkedInTickets;
        });
      }

      // Calculate check-in rate
      const checkInRate = totalTicketsSold > 0 
        ? (totalCheckedIn / totalTicketsSold) * 100 
        : 0;

      // Fetch orders for events within the timeline
      let recentOrders: any[] = [];
      let totalRevenue = 0;
      let totalOrders = 0;
      const salesOverTime: Array<{ date: string; count: number }> = [];

      if (eventIds.length > 0) {
        // Query orders for user's events
        const ordersQuery = query(
          collection(db, "orders"),
          where("eventId", "in", eventIds.slice(0, 10)), // Firestore limit
          where("createdAt", ">=", Timestamp.fromDate(start)),
          where("createdAt", "<=", Timestamp.fromDate(end)),
          orderBy("createdAt", "desc")
          // Removed limit for accurate analytics
        );
        
        try {
          const ordersSnapshot = await getDocs(ordersQuery);
          recentOrders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt,
          }));

          // Process orders for totals and timeline
          const salesMap = new Map<string, number>();
          // Initialize salesMap for every day in range
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            salesMap.set(d.toISOString().split('T')[0], 0);
          }

          recentOrders.forEach(order => {
             // Calculate Totals
            if (order.status === "completed" || order.status === "paid") {
              totalRevenue += order.amount?.itemsSubtotalMinor || 0;
              totalOrders += 1;
              
              // Timeline aggregation
              const dateKey = order.createdAt?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
              const ticketCount = order.lineItems
                ?.filter((item: any) => item._type === "ticket")
                .reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;
                
              if (ticketCount > 0 && salesMap.has(dateKey)) {
                salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + ticketCount);
              }
            }
          });

          // Convert map to array
          Array.from(salesMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([date, count]) => {
              salesOverTime.push({ date, count });
            });

        } catch (err) {
          // May fail if index doesn't exist
          console.warn("Orders query failed, trying simpler query:", err);
        }
      }

      // --- NEW: Fetch Aggregated Analytics (Funnel & Performance) ---
      let analyticsSummary = null;
      let eventsPerformance: any[] = [];
      
      try {
        // 1. Daily Metrics (for Funnel)
        const dailyMetrics = await getEventAnalytics(user.uid, start, end);
        analyticsSummary = summarizeEventMetrics(dailyMetrics);
        
        // 2. Event Performance (for Table)
        if (eventIds.length > 0) {
           const rawPerformance = await getEventPerformanceMetrics(user.uid);
           
           // Enrich with Event Data (Title, Status)
           eventsPerformance = rawPerformance.map((perf: any) => {
             const eventDetails = events.find(e => e.id === perf.eventId);
             return {
               ...perf,
               title: eventDetails?.title || "Untitled Event",
               status: eventDetails?.status || "unknown"
             };
           });
        }
      } catch (analyticsErr) {
        console.warn("Failed to fetch aggregated analytics:", analyticsErr);
      }
      
      // Calculate orders per day
      const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const ordersPerDay = totalOrders / Math.max(daysInRange, 1);

      // Determine trend (simplified)
      const trend: "up" | "down" | "flat" = 
        ordersPerDay > 0.5 ? "up" : 
        ordersPerDay > 0 ? "flat" : 
        "flat";

      // Calculate Top Ticket Types aggregated from all fetched orders
      const ticketTypeMap = new Map<string, { id: string; name: string; qty: number }>();
      
      recentOrders.forEach(order => {
        if (order.status === "completed" || order.status === "paid") {
          order.lineItems?.forEach((item: any) => {
            if (item._type === "ticket") {
               const existing = ticketTypeMap.get(item.ticketTypeId);
               if (existing) {
                 existing.qty += (item.qty || 0);
               } else {
                 ticketTypeMap.set(item.ticketTypeId, {
                   id: item.ticketTypeId,
                   name: item.name,
                   qty: item.qty || 0
                 });
               }
            }
          });
        }
      });

      const topTicketTypes = Array.from(ticketTypeMap.values())
        .map(t => ({
          ticketTypeId: t.id,
          name: t.name,
          qtySold: t.qty
        }))
        .sort((a, b) => b.qtySold - a.qtySold)
        .slice(0, 5);

      setData({
        kpis: {
          totalTicketsSold,
          totalCheckedIn,
          checkInRate,
          totalRevenue,
          totalOrders,
          ordersPerDay,
          upcomingEventsCount: upcomingEvents.length,
          pastEventsCount: pastEvents.length,
        },
        events,
        ticketStatsByEvent,
        recentOrders: recentOrders.slice(0, 5), // Only keep recent 5 for display
        salesOverTime,
        topTicketTypes,
        trend,
        analyticsSummary, // Attached new data
        eventsPerformance, // Attached new data
      });

    } catch (err) {
      console.error("Error fetching event dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.uid, timelineRange, customDateRange]);

  // Fetch on mount and when range changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const setTimelineRange = useCallback((range: EventTimelineRange, customRange?: { start: Date; end: Date }) => {
    setTimelineRangeState(range);
    if (range === "custom" && customRange) {
      setCustomDateRange(customRange);
    } else {
      setCustomDateRange(null);
    }
  }, []);

  return {
    user,
    loading,
    error,
    data,
    timelineRange,
    customDateRange,
    setTimelineRange,
    refresh,
  };
}
