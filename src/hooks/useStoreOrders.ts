// hooks/useStoreOrders.ts
import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

import { 
  getStoreOrders, 
  watchStoreOrders,
  // getStoreOrderFulfillmentData,
  applyStoreOrderFilters 
} from "@/lib/firebase/queries/storeOrders";
import { StoreOrderWithVendorStatus, OrderFilters, VendorScope } from "@/types/orders";

export interface UseStoreOrdersReturn {
  orders: StoreOrderWithVendorStatus[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  vendorScope: VendorScope | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  applyFilters: (filters: OrderFilters) => Promise<void>;
}

export function useStoreOrders(): UseStoreOrdersReturn {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<StoreOrderWithVendorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [vendorScope, setVendorScope] = useState<VendorScope | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [currentFilters, setCurrentFilters] = useState<OrderFilters | null>(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setOrders([]);
        setLoading(false);
        setError(null);
        setVendorScope(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load initial orders when user changes
  useEffect(() => {
    if (!user?.uid) return;

    const loadInitialOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { orders: initialOrders, hasMore: hasMoreOrders, vendorScope: scope, lastVisible } = await getStoreOrders(user.uid, 10); // Reduced from 20 to 10
        
        console.log("🔍 Debug - Store orders loaded:", { 
          userId: user.uid, 
          ordersCount: initialOrders.length, 
          hasMore: hasMoreOrders,
          vendorScope: scope 
        });
        
        setOrders(initialOrders);
        setHasMore(hasMoreOrders);
        setVendorScope(scope);
        setLastDoc(lastVisible || null);

      } catch (err) {
        console.error("Error loading store orders:", err);
        setError(err instanceof Error ? err.message : "Failed to load store orders");
      } finally {
        setLoading(false);
      }
    };

    loadInitialOrders();
  }, [user?.uid]);

  // Watch for real-time updates
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = watchStoreOrders(user.uid, (newOrders) => {
      setOrders(newOrders);
    }, (err) => {
      console.error("Error watching store orders:", err);
      setError(err.message || "Failed to watch store orders");
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const loadMore = useCallback(async () => {
    if (!user?.uid || !hasMore || loading) return;

    try {
      setLoading(true);
      
      const { orders: moreOrders, hasMore: hasMoreOrders, lastVisible } = await getStoreOrders(
        user.uid, 
        10, // Reduced from 20 to 10
        lastDoc,
        currentFilters
      );
      
      setOrders(prev => [...prev, ...moreOrders]);
      setHasMore(hasMoreOrders);
      setLastDoc(lastVisible || null);
    } catch (err) {
      console.error("Error loading more store orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load more orders");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, hasMore, loading, lastDoc, currentFilters]);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      const { orders: refreshedOrders, hasMore: hasMoreOrders, vendorScope: scope, lastVisible } = await getStoreOrders(
        user.uid,
        10, // Reduced from 20 to 10
        null,
        currentFilters
      );
      
      setOrders(refreshedOrders);
      setHasMore(hasMoreOrders);
      setVendorScope(scope);
      setLastDoc(lastVisible || null);
    } catch (err) {
      console.error("Error refreshing store orders:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh orders");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentFilters]);

  const applyFilters = useCallback(async (filters: OrderFilters) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);
      
      const { orders: filteredOrders, hasMore: hasMoreOrders, vendorScope: scope, lastVisible } = await applyStoreOrderFilters(user.uid, filters);
      
      setOrders(filteredOrders);
      setHasMore(hasMoreOrders);
      setVendorScope(scope);
      setLastDoc(lastVisible || null);
    } catch (err) {
      console.error("Error applying store order filters:", err);
      setError(err instanceof Error ? err.message : "Failed to apply filters");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

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
