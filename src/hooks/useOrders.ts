// hooks/useOrders.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "@/lib/firebase/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  getVendorScope,
  getOrdersInDateRange,
  getVendorLineStatuses,
  getFulfillmentLines,
  getEventDetailsBatch,
  filterOrdersByVendorScope,
} from "@/lib/firebase/queries/orders";
import {
  OrderWithVendorStatus,
  VendorScope,
  OrderFilters,
  OrderTab,
  FulfillmentStatus,
} from "@/types/orders";
import { getDateRange, calculateFulfillmentAggregateStatus, getLineFulfillmentStatus } from "@/lib/orders/helpers";
import { QueryDocumentSnapshot } from "firebase/firestore";

interface UseOrdersResult {
  orders: OrderWithVendorStatus[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  vendorScope: VendorScope | null;
  loadMore: () => void;
  refresh: () => void;
  applyFilters: (filters: OrderFilters) => void;
}

export function useOrders(activeTab: OrderTab): UseOrdersResult {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderWithVendorStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [vendorScope, setVendorScope] = useState<VendorScope | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>();
  const [filters, setFilters] = useState<OrderFilters>({
    dateRange: "7days",
    statuses: [],
    types: [],
    sources: [],
    fulfillmentStatuses: [],
    search: "",
  });
  const [initialized, setInitialized] = useState(false);
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

  // Load vendor scope
  const loadVendorScope = useCallback(async () => {
    if (!user) return null;
    
    try {
      return await getVendorScope(user.uid);
    } catch (err) {
      console.error("Error loading vendor scope:", err);
      setError("Failed to load vendor information");
      return null;
    }
  }, [user]);

  // Load orders function
  const loadOrders = useCallback(async (
    reset: boolean = false,
    newFilters?: OrderFilters,
    cursor?: QueryDocumentSnapshot
  ) => {
    if (!user || !vendorScope || activeTab === "store") {
      setOrders([]);
      return;
    }

    const activeFilters = newFilters || filtersRef.current;

    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange(activeFilters.dateRange, activeFilters.customDateRange);
      const { orders: newOrders, lastDoc: newLastDoc } = await getOrdersInDateRange(
        dateRange.start,
        dateRange.end,
        10, // Reduced from 25 to 10 for better performance
        reset ? undefined : (cursor ?? lastDocRef.current)
      );

      // Filter orders by vendor scope
      let filteredOrders = filterOrdersByVendorScope(newOrders, vendorScope);

      // Apply additional filters
      if (activeFilters.statuses.length > 0) {
        filteredOrders = filteredOrders.filter(order => 
          activeFilters.statuses.includes(order.status)
        );
      }

      if (activeFilters.types.length > 0) {
        filteredOrders = filteredOrders.filter(order => {
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

      if (activeFilters.fulfillmentStatuses.length > 0) {
        filteredOrders = filteredOrders.filter(order => {
          const vendorOwnedLineKeys = order.lineItems
            .filter(item => item._type === "merch")
            .map(item => `merch:${item.merchItemId}`);
          
          const fulfillmentStatus = order.fulfillmentAggregateStatus || 
            calculateFulfillmentAggregateStatus(
              order.fulfillmentStatuses || {},
              vendorOwnedLineKeys
            );
          
          return activeFilters.fulfillmentStatuses.includes(fulfillmentStatus);
        });
      }

      if (activeFilters.search.trim()) {
        const searchTerm = activeFilters.search.toLowerCase();
        filteredOrders = filteredOrders.filter(order => {
          const orderId = order.id.toLowerCase();
          const email = order.deliverTo?.email?.toLowerCase() || "";
          return orderId.includes(searchTerm) || email.includes(searchTerm);
        });
      }

      // Get vendor line statuses, fulfillment lines, and event details
      if (filteredOrders.length > 0) {
        const orderIds = filteredOrders.map(order => order.id);
        
        const [vendorLineStatuses, fulfillmentLines, eventDetails] = await Promise.all([
          getVendorLineStatuses(orderIds),
          getFulfillmentLines(orderIds),
          getEventDetailsBatch([...new Set(filteredOrders.map(order => order.eventId))])
        ]);

        console.log("🔍 useOrders: Raw fulfillment data", {
          orderIds,
          fulfillmentLines: Object.keys(fulfillmentLines).reduce((acc, orderId) => {
            acc[orderId] = Object.keys(fulfillmentLines[orderId]).map(key => ({
              key,
              ...fulfillmentLines[orderId][key]
            }));
            return acc;
          }, {} as Record<string, unknown[]>)
        });

        // Debug specific order that we know has fulfillment data
        const debugOrderId = "vdXvKU8XlyO8rJ3oLFPq";
        if (fulfillmentLines[debugOrderId]) {
          console.log("🔍 useOrders: Debug specific order", {
            orderId: debugOrderId,
            rawFulfillmentData: fulfillmentLines[debugOrderId],
            firstLineKey: Object.keys(fulfillmentLines[debugOrderId])[0],
            firstLineData: fulfillmentLines[debugOrderId][Object.keys(fulfillmentLines[debugOrderId])[0]]
          });
        }


        filteredOrders = filteredOrders.map(order => {
          const orderFulfillmentLines = fulfillmentLines[order.id] || {};
          const lines = Object.values(orderFulfillmentLines);
          
          // Compute normalized fulfillment statuses
          const fulfillmentStatuses: Record<string, FulfillmentStatus> = {};
          lines.forEach(line => { 
            fulfillmentStatuses[line.lineKey] = getLineFulfillmentStatus(line); 
          });

          // Compute aggregate status for vendor-owned lines
          const vendorOwnedLineKeys = order.lineItems
            .filter(item => item._type === "merch")
            .map(item => `merch:${item.merchItemId}`);

          const fulfillmentAggregateStatus = calculateFulfillmentAggregateStatus(
            fulfillmentStatuses,
            vendorOwnedLineKeys
          );

          return {
          ...order,
          vendorLineStatuses: vendorLineStatuses[order.id] || {},
            fulfillmentLines: orderFulfillmentLines,
            fulfillmentStatuses,
            fulfillmentAggregateStatus,
          eventTitle: eventDetails[order.eventId]?.title,
          eventDate: eventDetails[order.eventId]?.startAt,
          };
        }) as OrderWithVendorStatus[];
      }

      if (reset) {
        setOrders(filteredOrders);
      } else {
        setOrders(prev => [...prev, ...filteredOrders]);
      }

      setLastDoc(newLastDoc);
      setHasMore(newOrders.length === 10); // Updated to match new page size
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [user, vendorScope, activeTab]);

  // Initialize data
  useEffect(() => {
    if (!user || initialized) return;

    const initialize = async () => {
      const scope = await loadVendorScope();
      if (scope) {
        setVendorScope(scope);
        setInitialized(true);
      }
    };

    initialize();
  }, [user, initialized, loadVendorScope]);

  // Load orders when vendor scope is available (first load only)
  useEffect(() => {
    if (!vendorScope || !initialized) return;
    if (firstLoadDoneRef.current) return;
    firstLoadDoneRef.current = true;
    // do not await; let it set loading itself
    loadOrders(true);
    // deliberately DO NOT include loadOrders in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorScope, initialized]);

  // Load more orders
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadOrders(false, undefined, lastDoc);
    }
  }, [loading, hasMore, lastDoc, loadOrders]);

  // Refresh orders
  const refresh = useCallback(() => {
    setLastDoc(undefined);
    setOrders([]);
    firstLoadDoneRef.current = true; // prevent the init effect from firing; we're driving the fetch
    loadOrders(true);
  }, [loadOrders]);

  // Apply filters
  const applyFilters = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    setLastDoc(undefined);
    setOrders([]);
    firstLoadDoneRef.current = true; // same idea
    loadOrders(true, newFilters);
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    hasMore,
    vendorScope,
    loadMore,
    refresh,
    applyFilters,
  };
}