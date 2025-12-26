// hooks/useEventOrders.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "@/lib/firebase/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  getOrdersForEvent,
  getVendorLineStatuses,
  getFulfillmentLines,
} from "@/lib/firebase/queries/orders";
import {
  OrderWithVendorStatus,
  OrderFilters,
  FulfillmentStatus,
} from "@/types/orders";
import { getDateRange, calculateFulfillmentAggregateStatus, getLineFulfillmentStatus } from "@/lib/orders/helpers";
import { QueryDocumentSnapshot } from "firebase/firestore";

interface UseEventOrdersResult {
  orders: OrderWithVendorStatus[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  applyFilters: (filters: OrderFilters) => void;
}

export function useEventOrders(eventId: string): UseEventOrdersResult {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderWithVendorStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>();
  const [filters, setFilters] = useState<OrderFilters>({
    dateRange: "7days",
    statuses: [],
    types: [],
    sources: [],
    fulfillmentStatuses: [],
    search: "",
  });
  const filtersRef = useRef(filters);
  const lastDocRef = useRef(lastDoc);
  const firstLoadDoneRef = useRef(false);
  
  // Keep refs in sync
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  useEffect(() => {
    lastDocRef.current = lastDoc;
  }, [lastDoc]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load orders function
  const loadOrders = useCallback(async (
    reset: boolean = false,
    newFilters?: OrderFilters,
    cursor?: QueryDocumentSnapshot
  ) => {
    if (!user || !eventId) {
      if (reset) setOrders([]);
      return;
    }

    const activeFilters = newFilters || filtersRef.current;

    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange(activeFilters.dateRange, activeFilters.customDateRange);
      
      const { orders: newOrders, lastDoc: newLastDoc } = await getOrdersForEvent(
        eventId,
        25,
        reset ? undefined : (cursor ?? lastDocRef.current),
        dateRange.start,
        dateRange.end
      );

      // Process orders to add vendor status and fulfillment status (even though for an event owner, they see everything)
      // We reuse the OrderWithVendorStatus type for consistency with UI components
      let processedOrders: OrderWithVendorStatus[] = newOrders.map(order => ({
        ...order,
        visibleLineItems: order.lineItems, // Event owner sees all items
        visibilityReason: "organizer",
        vendorLineStatuses: {},
        fulfillmentLines: {},
        fulfillmentStatuses: {},
        fulfillmentAggregateStatus: "unfulfilled", // default
      }));

      // Apply client-side filters (statuses, types, search)
      if (activeFilters.statuses.length > 0) {
        processedOrders = processedOrders.filter(order => 
          activeFilters.statuses.includes(order.status)
        );
      }

      if (activeFilters.types.length > 0) {
        processedOrders = processedOrders.filter(order => {
          const hasTickets = order.lineItems.some(item => item._type === "ticket");
          const hasMerch = order.lineItems.some(item => item._type === "merch");
          
          if (activeFilters.types.includes("ticket") && activeFilters.types.includes("merch")) {
            return hasTickets && hasMerch;
          } else if (activeFilters.types.includes("ticket")) {
            return hasTickets;
          } else if (activeFilters.types.includes("merch")) {
            return hasMerch;
          }
          return false;
        });
      }

      // Fulfillment status filtering requires fetching fulfillment lines first
      // But we fetch enrichment data only for the paginated batch.
      // Filtering *after* fetching means we might return fewer than page size. 
      // Ideally filtering should happen on backend or we fetch more. 
      // For now, consistent with useOrders, we filter what we have.

      if (activeFilters.search.trim()) {
        const searchTerm = activeFilters.search.toLowerCase();
        processedOrders = processedOrders.filter(order => {
          const orderId = order.id.toLowerCase();
          const email = order.deliverTo?.email?.toLowerCase() || "";
          return orderId.includes(searchTerm) || email.includes(searchTerm);
        });
      }

      // Encode extra data
      if (processedOrders.length > 0) {
        const orderIds = processedOrders.map(order => order.id);
        
        const [vendorLineStatuses, fulfillmentLines] = await Promise.all([
          getVendorLineStatuses(orderIds),
          getFulfillmentLines(orderIds),
        ]);

        processedOrders = processedOrders.map(order => {
          const orderFulfillmentLines = fulfillmentLines[order.id] || {};
          const lines = Object.values(orderFulfillmentLines);
          
          // Compute normalized fulfillment statuses
          const fulfillmentStatuses: Record<string, FulfillmentStatus> = {};
          lines.forEach(line => { 
            fulfillmentStatuses[line.lineKey] = getLineFulfillmentStatus(line); 
          });

          // Compute aggregate status for merch items only (tickets are auto-fulfilled)
          const merchLineKeys = order.lineItems
            .filter((item): item is import("@/types/orders").MerchLineItem => item._type === "merch")
            .map(item => `merch:${item.merchItemId}`);

          const fulfillmentAggregateStatus = calculateFulfillmentAggregateStatus(
            fulfillmentStatuses,
            merchLineKeys.length > 0 ? merchLineKeys : [] 
          );

          return {
            ...order,
            vendorLineStatuses: vendorLineStatuses[order.id] || {},
            fulfillmentLines: orderFulfillmentLines,
            fulfillmentStatuses,
            fulfillmentAggregateStatus,
          };
        });

        // Filter by fulfillment status if needed
        if (activeFilters.fulfillmentStatuses.length > 0) {
            processedOrders = processedOrders.filter(order => 
              activeFilters.fulfillmentStatuses.includes(order.fulfillmentAggregateStatus || "unfulfilled")
            );
        }
      }

      if (reset) {
        setOrders(processedOrders);
      } else {
        setOrders(prev => [...prev, ...processedOrders]);
      }

      setLastDoc(newLastDoc);
      // Logic for hasMore might be slightly off if client-side filtering reduced the batch size significantly
      // but it's a reasonable approximation without complex cursor management
      setHasMore(newOrders.length === 25); 

    } catch (err) {
      console.error("Error loading event orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [user, eventId]);

  // Initial load
  useEffect(() => {
    if (!user || !eventId) return;
    if (firstLoadDoneRef.current) return;
    firstLoadDoneRef.current = true;
    loadOrders(true);
  }, [user, eventId, loadOrders]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadOrders(false, undefined, lastDoc);
    }
  }, [loading, hasMore, lastDoc, loadOrders]);

  // Refresh
  const refresh = useCallback(() => {
    setLastDoc(undefined);
    setOrders([]);
    firstLoadDoneRef.current = true;
    loadOrders(true);
  }, [loadOrders]);

  // Apply filters
  const applyFilters = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    setLastDoc(undefined);
    setOrders([]);
    firstLoadDoneRef.current = true;
    loadOrders(true, newFilters);
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    applyFilters,
  };
}
