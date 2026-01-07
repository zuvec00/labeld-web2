// hooks/useDashboard.ts
import { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import { useOrders } from "./useOrders";
import { useStoreOrders } from "./useStoreOrders";
import { useWallet } from "./useWallet";
import { getVendorScope } from "@/lib/firebase/queries/orders";
import { listMyEventsLite } from "@/lib/firebase/queries/event";
import { fetchBrandDoc } from "@/lib/firebase/queries/brandspace";
import { getDateRange } from "@/lib/orders/helpers";
import { OrderWithVendorStatus, StoreOrderWithVendorStatus, FulfillmentStatus, FulfillmentAggregateStatus } from "@/types/orders";
import { WalletSummary } from "@/types/wallet";
import { EventModel } from "@/lib/models/event";
import { BrandModel } from "@/lib/stores/brandOnboard";

export type DashboardScope = "all" | "events" | "merch";
export type DashboardRange = "today" | "7days" | "30days" | "custom";

export interface DashboardFilters {
  range: DashboardRange;
  scope: DashboardScope;
  eventId?: string;
  customDateRange?: { start: Date; end: Date };
}

export interface DashboardKPIs {
  gmv: number; // Gross Merchandise Value
  orders: number;
  aov: number; // Average Order Value
  payoutEligible: number;
  nextPayoutAt?: number;
  pendingFulfillment: number;
  refunds: number;
  followers: number;
  followersChange?: number;
}

export interface RevenueDataPoint {
  date: string;
  tickets: number;
  merch: number;
  total: number;
  ticketsCount: number;
  merchCount: number;
  totalCount: number;
}

export interface TopSKU {
  merchItemId: string;
  name: string;
  qtySold: number;
  revenue: number;
}

export interface TopTicketType {
  ticketTypeId: string;
  name: string;
  qtySold: number;
  capacity?: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  startAt: Date;
  ticketsSold: number;
  gmv: number;
  capacity?: number;
}

export interface FulfillmentCounts {
  unfulfilled: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  revenueData: RevenueDataPoint[];
  fulfillmentCounts: FulfillmentCounts;
  topSKUs: TopSKU[];
  topTicketTypes: TopTicketType[];
  upcomingEvents: UpcomingEvent[];
  recentOrders: OrderWithVendorStatus[];
  walletSummary?: WalletSummary;
  brandData?: BrandModel;
  hasAnyOrders: boolean;
}

export interface UseDashboardReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  data: DashboardData | null;
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  refresh: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    range: "7days",
    scope: "all",
  });

  // Use existing hooks - event orders for event data
  const { orders: eventOrders, loading: eventOrdersLoading, error: eventOrdersError, refresh: refreshEventOrders } = useOrders("event");
  // Store orders for brand commerce data
  const { orders: storeOrders, loading: storeOrdersLoading, error: storeOrdersError, refresh: refreshStoreOrders } = useStoreOrders();
  const { walletData, loading: walletLoading, error: walletError, refetch: refreshWallet } = useWallet();

  // Additional data state
  const [events, setEvents] = useState<EventModel[]>([]);
  const [brandData, setBrandData] = useState<BrandModel | null>(null);
  const [vendorScope, setVendorScope] = useState<{
    eventIds: Set<string>;
    merchItemIds: Set<string>;
    isOrganizer: boolean;
    isBrand: boolean;
  } | null>(null);

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load vendor scope and additional data
  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [scope, eventsData, brand] = await Promise.all([
          getVendorScope(user.uid),
          listMyEventsLite(user.uid),
          fetchBrandDoc(user.uid).catch(() => null), // Brand might not exist yet
        ]);

        setVendorScope(scope);
        setEvents(eventsData);
        setBrandData(brand);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  // Computed dashboard data
  const data = useMemo((): DashboardData | null => {
    if (!user?.uid || !vendorScope || eventOrdersLoading || storeOrdersLoading || walletLoading) {
      return null;
    }

    const dateRange = getDateRange(filters.range, filters.customDateRange);
    
    // Check if brand has ANY store orders at all
    const hasAnyOrders = storeOrders.length > 0;

    // Filter store orders for brand commerce (GMV, fulfillment)
    const filteredStoreOrders = storeOrders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      if (orderDate < dateRange.start || orderDate > dateRange.end) return false;
      if (order.status !== "paid") return false;
      return true;
    });
    
    // Filter event orders for ticket/event data
    const filteredEventOrders = eventOrders.filter(order => {
      // Date filter
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      if (orderDate < dateRange.start || orderDate > dateRange.end) {
        return false;
      }

      // Status filter (only paid orders)
      if (order.status !== "paid") {
        return false;
      }

      // Scope filter
      if (filters.scope === "events") {
        return order.lineItems.some(item => item._type === "ticket");
      } else if (filters.scope === "merch") {
        return order.lineItems.some(item => item._type === "merch");
      }

      return true;
    });

    // Calculate KPIs from store orders (brand commerce)
    const gmv = filteredStoreOrders.reduce((sum, order) => sum + (order.amount?.itemsSubtotalMinor || 0), 0);
    const ordersCount = filteredStoreOrders.length;
    const aov = ordersCount > 0 ? gmv / ordersCount : 0;

    // Calculate fulfillment counts from store orders
    const fulfillmentCounts = { unfulfilled: 0, shipped: 0, delivered: 0, cancelled: 0 };
    
    filteredStoreOrders.forEach(order => {
      if (!order.fulfillmentLines) return;
      
      Object.values(order.fulfillmentLines).forEach(line => {
        if (line.vendorId === user.uid) {
          const status = line.status ?? line.shipping?.status ?? "unfulfilled";
          if (status in fulfillmentCounts) {
            fulfillmentCounts[status as keyof FulfillmentCounts]++;
          }
        }
      });
    });

    // Calculate revenue data by day from store orders
    const revenueMap = new Map<string, { tickets: number; merch: number; total: number; ticketsCount: number; merchCount: number; totalCount: number }>();
    
    // Add store order revenue (products)
    filteredStoreOrders.forEach(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      if (!revenueMap.has(dateKey)) {
        revenueMap.set(dateKey, { tickets: 0, merch: 0, total: 0, ticketsCount: 0, merchCount: 0, totalCount: 0 });
      }
      
      const dayData = revenueMap.get(dateKey)!;
      dayData.merch += order.amount?.itemsSubtotalMinor || 0;
      dayData.total += order.amount?.itemsSubtotalMinor || 0;
      dayData.merchCount += 1;
      dayData.totalCount += 1;
    });
    
    // Add event order revenue (tickets)
    filteredEventOrders.forEach(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      if (!revenueMap.has(dateKey)) {
        revenueMap.set(dateKey, { tickets: 0, merch: 0, total: 0, ticketsCount: 0, merchCount: 0, totalCount: 0 });
      }
      
      const dayData = revenueMap.get(dateKey)!;
      let orderTicketRevenue = 0;
      let orderTicketCount = 0;
      
      order.lineItems.forEach(line => {
        if (line._type === "ticket") {
          orderTicketRevenue += line.subtotalMinor;
          orderTicketCount += line.qty;
        }
      });
      
      dayData.tickets += orderTicketRevenue;
      dayData.total += orderTicketRevenue;
      dayData.ticketsCount += orderTicketCount;
      dayData.totalCount += 1;
    });

    // Convert to array and fill missing dates
    const revenueData: RevenueDataPoint[] = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayData = revenueMap.get(dateKey) || { tickets: 0, merch: 0, total: 0, ticketsCount: 0, merchCount: 0, totalCount: 0 };
      
      revenueData.push({
        date: dateKey,
        ...dayData,
      });
    }

    // Calculate top SKUs (products from store orders)
    const skuMap = new Map<string, TopSKU>();
    
    filteredStoreOrders.forEach(order => {
      order.lineItems.forEach(line => {
        if (line._type === "product") {
          const existing = skuMap.get(line.productId);
          if (existing) {
            existing.qtySold += line.qty;
            existing.revenue += line.subtotalMinor;
          } else {
            skuMap.set(line.productId, {
              merchItemId: line.productId,
              name: line.name,
              qtySold: line.qty,
              revenue: line.subtotalMinor,
            });
          }
        }
      });
    });

    const topSKUs = Array.from(skuMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate top ticket types from event orders
    const ticketMap = new Map<string, TopTicketType>();
    
    filteredEventOrders.forEach(order => {
      order.lineItems.forEach(line => {
        if (line._type === "ticket") {
          const existing = ticketMap.get(line.ticketTypeId);
          if (existing) {
            existing.qtySold += line.qty;
          } else {
            ticketMap.set(line.ticketTypeId, {
              ticketTypeId: line.ticketTypeId,
              name: line.name,
              qtySold: line.qty,
            });
          }
        }
      });
    });

    const topTicketTypes = Array.from(ticketMap.values())
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 5);

    // Get upcoming events (next 3)
    const now = new Date();
    const upcomingEvents: UpcomingEvent[] = events
      .filter(event => {
        // Filter out events without IDs
        if (!event.id) return false;
        
        const startAt = event.startAt instanceof Date ? event.startAt : new Date(event.startAt);
        return startAt > now && event.status === "published";
      })
      .sort((a, b) => {
        const aStart = a.startAt instanceof Date ? a.startAt : new Date(a.startAt);
        const bStart = b.startAt instanceof Date ? b.startAt : new Date(b.startAt);
        return aStart.getTime() - bStart.getTime();
      })
      .slice(0, 3)
      .map(event => {
        // Calculate tickets sold and GMV for this event from event orders
        const thisEventOrders = filteredEventOrders.filter(order => order.eventId === event.id);
        const ticketsSold = thisEventOrders.reduce((sum, order) => {
          return sum + order.lineItems
            .filter(line => line._type === "ticket")
            .reduce((lineSum, line) => lineSum + line.qty, 0);
        }, 0);
        
        const eventGMV = thisEventOrders.reduce((sum, order) => sum + order.amount.totalMinor, 0);
        
        return {
          id: event.id!,
          title: event.title,
          startAt: event.startAt instanceof Date ? event.startAt : new Date(event.startAt),
          ticketsSold,
          gmv: eventGMV,
          capacity: event.capacityMode === "limited" ? event.capacityTotal ?? undefined : undefined,
        };
      });

    // Get recent orders (last 10 from store orders)
    const recentOrders = filteredStoreOrders
      .sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 10) as unknown as OrderWithVendorStatus[];

    // Calculate refunds (placeholder)
    const refunds = 0;

    return {
      kpis: {
        gmv,
        orders: ordersCount,
        aov,
        payoutEligible: walletData.summary?.eligibleBalanceMinor || 0,
        nextPayoutAt: walletData.summary?.payout.nextPayoutAt,
        pendingFulfillment: fulfillmentCounts.unfulfilled,
        refunds,
        followers: 0,
      },
      revenueData,
      fulfillmentCounts,
      topSKUs,
      topTicketTypes,
      upcomingEvents,
      recentOrders,
      walletSummary: walletData.summary || undefined,
      brandData: brandData || undefined,
      hasAnyOrders,
    };
  }, [user?.uid, vendorScope, storeOrders, eventOrders, storeOrdersLoading, eventOrdersLoading, walletData, walletLoading, filters, events, brandData]);

  const refresh = () => {
    refreshEventOrders();
    refreshStoreOrders();
    refreshWallet();
  };

  return {
    user,
    loading: loading || eventOrdersLoading || storeOrdersLoading || walletLoading,
    error: error || eventOrdersError || storeOrdersError || walletError,
    data,
    filters,
    setFilters,
    refresh,
  };
}
