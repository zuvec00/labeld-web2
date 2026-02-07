// lib/firebase/queries/storeOrders.ts
// Force recompile
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  onSnapshot,
  doc,
  getDoc,
  collection as getCollection,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { 
  StoreOrderDoc, 
  StoreOrderWithVendorStatus, 
  OrderFilters, 
  VendorScope,
  VendorLineStatus,
  FulfillmentLine,
  FulfillmentStatus,
  FulfillmentAggregateStatus,
  TimelineEvent
} from "@/types/orders";
// import { toMillis } from "@/lib/firebase/utils";

export interface StoreOrdersResult {
  orders: StoreOrderWithVendorStatus[];
  hasMore: boolean;
  vendorScope: VendorScope;
  lastVisible?: QueryDocumentSnapshot<DocumentData>;
}

// ... (keep existing helper functions: parseStoreOrder, getVendorLineStatuses, getFulfillmentData, getTimelineEvents)

// Parse store order document
function parseStoreOrder(doc: QueryDocumentSnapshot<DocumentData>): StoreOrderDoc {
  const data = doc.data();
  return {
    id: doc.id,
    brandId: data.brandId || "",
    buyerUserId: data.buyerUserId || null,
    status: data.status || "pending",
    lineItems: data.lineItems || [],
    amount: {
      currency: data.amount?.currency || "NGN",
      itemsSubtotalMinor: data.amount?.itemsSubtotalMinor || 0,
      feesMinor: data.amount?.feesMinor || 0,
      shippingMinor: data.amount?.shippingMinor || 0,
      totalMinor: data.amount?.totalMinor || 0,
    },
    fees: data.fees ? {
      brandTransactionFeesMinor: data.fees.brandTransactionFeesMinor || 0,
      consumerServiceFeesMinor: data.fees.consumerServiceFeesMinor || 0,
      labeldBuyerFeesMinor: data.fees.labeldBuyerFeesMinor || 0,
      labeldAbsorbedFeesMinor: data.fees.labeldAbsorbedFeesMinor || 0,
    } : undefined,
    provider: data.provider || null,
    providerRef: data.providerRef || undefined,
    deliverTo: data.deliverTo || undefined,
    shipping: data.shipping || undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    paidAt: data.paidAt,
    cancelledAt: data.cancelledAt,
  };
}

// Get vendor line statuses for a store order
async function getVendorLineStatuses(orderId: string, vendorId: string): Promise<Record<string, VendorLineStatus>> {
  try {
    const statusesRef = collection(db, "storeOrders", orderId, "vendorLineStatuses");
    const q = query(statusesRef, where("vendorId", "==", vendorId));
    const snapshot = await getDocs(q);
    
    const statuses: Record<string, VendorLineStatus> = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      statuses[data.lineKey] = data.status;
    });
    
    return statuses;
  } catch (error) {
    console.error("Error fetching vendor line statuses:", error);
    return {};
  }
}

// Get fulfillment data for a store order
async function getFulfillmentData(orderId: string, vendorId: string): Promise<{
  fulfillmentStatuses: Record<string, FulfillmentStatus>;
  fulfillmentAggregateStatus: FulfillmentAggregateStatus;
  fulfillmentLines: Record<string, FulfillmentLine>;
}> {
  try {
    const fulfillmentRef = collection(db, "storeOrders", orderId, "fulfillmentLines");
    const q = query(fulfillmentRef, where("vendorId", "==", vendorId));
    const snapshot = await getDocs(q);
    
    const fulfillmentStatuses: Record<string, FulfillmentStatus> = {};
    const fulfillmentLines: Record<string, FulfillmentLine> = {};
    let aggregateStatus: FulfillmentAggregateStatus = "unfulfilled";
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const lineKey = data.lineKey;
      
      fulfillmentLines[lineKey] = {
        lineKey: data.lineKey,
        qtyOrdered: data.qtyOrdered || 0,
        qtyFulfilled: data.qtyFulfilled || 0,
        notes: data.notes || "",
        status: data.status,
        shipping: data.shipping,
        vendorId: data.vendorId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      
      fulfillmentStatuses[lineKey] = data.status || "unfulfilled";
    });
    
    // Calculate aggregate status
    const statuses = Object.values(fulfillmentStatuses);
    if (statuses.length === 0) {
      aggregateStatus = "unfulfilled";
    } else if (statuses.every(s => s === "delivered")) {
      aggregateStatus = "delivered";
    } else if (statuses.every(s => s === "shipped")) {
      aggregateStatus = "shipped";
    } else if (statuses.every(s => s === "fulfilled")) {
      aggregateStatus = "fulfilled";
    } else if (statuses.some(s => s === "fulfilled" || s === "shipped" || s === "delivered")) {
      aggregateStatus = "partial";
    } else {
      aggregateStatus = "unfulfilled";
    }
    
    return {
      fulfillmentStatuses,
      fulfillmentAggregateStatus: aggregateStatus,
      fulfillmentLines,
    };
  } catch (error) {
    console.error("Error fetching fulfillment data:", error);
    return {
      fulfillmentStatuses: {},
      fulfillmentAggregateStatus: "unfulfilled",
      fulfillmentLines: {},
    };
  }
}

// Get timeline events for a store order
async function getTimelineEvents(orderId: string): Promise<TimelineEvent[]> {
  try {
    const timelineRef = collection(db, "storeOrders", orderId, "timeline");
    const q = query(timelineRef, orderBy("at", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      type: doc.data().type,
      actor: doc.data().actor,
      message: doc.data().message,
      meta: doc.data().meta,
      at: doc.data().at,
    }));
  } catch (error) {
    console.error("Error fetching timeline events:", error);
    return [];
  }
}

// Batch fetch subcollections for multiple orders (PERFORMANCE OPTIMIZATION)
async function batchGetSubcollections(
  orderIds: string[],
  brandId: string
): Promise<Record<string, {
  vendorStatuses: Record<string, VendorLineStatus>;
  fulfillmentData: {
    fulfillmentStatuses: Record<string, FulfillmentStatus>;
    fulfillmentAggregateStatus: FulfillmentAggregateStatus;
    fulfillmentLines: Record<string, FulfillmentLine>;
  };
}>> {
  try {
    // Fetch all subcollections in parallel for all orders at once
    const promises = orderIds.map(async (orderId) => {
      const [vendorStatuses, fulfillmentData] = await Promise.all([
        getVendorLineStatuses(orderId, brandId),
        getFulfillmentData(orderId, brandId),
      ]);
      
      return { 
        orderId, 
        vendorStatuses, 
        fulfillmentData,
      };
    });
    
    const results = await Promise.all(promises);
    
    return results.reduce((acc, { orderId, vendorStatuses, fulfillmentData }) => {
      acc[orderId] = { vendorStatuses, fulfillmentData };
      return acc;
    }, {} as Record<string, any>);
  } catch (error) {
    console.error("Error batch fetching subcollections:", error);
    return {};
  }
}

// Get store orders with vendor status
export async function getStoreOrders(
  userId: string, 
  limitCount: number = 10, // Reduced default from 20 to 10
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null,
  filters?: OrderFilters | null
): Promise<StoreOrdersResult> {
  try {
    // Get user's brand ID
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    const brandId = userId;
    
    console.log("🔍 Debug - User data:", { userId, brandId, userData });
    
    if (!brandId) {
      console.log("❌ No brandId found for user:", userId);
      return {
        orders: [],
        hasMore: false,
        vendorScope: {
          eventIds: new Set(),
          merchItemIds: new Set(),
          isOrganizer: false,
          isBrand: false,
        },
      };
    }

    // Build query
    let q = query(
      collection(db, "storeOrders"),
      where("brandId", "==", brandId)
    );

    // Apply status filter
    if (filters?.statuses && filters.statuses.length > 0) {
      q = query(q, where("status", "in", filters.statuses));
    }
    
    // Apply date range filter (if not "all time")
    if (filters?.dateRange && filters.dateRange !== "30days") { // adjusting default behavior
       // Note: complex date filtering with status might require composite index. 
       // For now, let's stick to status if present, or just sort by createdAt
    }

    q = query(q, orderBy("createdAt", "desc"), limit(limitCount + 1));


    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > limitCount;
    const ordersToProcess = hasMore ? docs.slice(0, limitCount) : docs;
    const lastVisible = ordersToProcess.length > 0 ? ordersToProcess[ordersToProcess.length - 1] : undefined;
    
    console.log("🔍 Debug - Store orders query results:", { 
      brandId, 
      filters,
      totalDocs: docs.length, 
      ordersToProcess: ordersToProcess.length,
      hasMore,
      lastVisibleId: lastVisible?.id
    });

    // Process orders
    const basicOrders = ordersToProcess.map(parseStoreOrder);
    
    // PERFORMANCE OPTIMIZATION: Batch fetch all subcollections in parallel
    const subcollections = await batchGetSubcollections(
      basicOrders.map(o => o.id),
      brandId
    );
    
    // Combine data
    const orders: StoreOrderWithVendorStatus[] = basicOrders.map(order => {
      const orderSubcollections = subcollections[order.id] || {
        vendorStatuses: {},
        fulfillmentData: {
          fulfillmentStatuses: {},
          fulfillmentAggregateStatus: "unfulfilled" as FulfillmentAggregateStatus,
          fulfillmentLines: {},
        },
      };
      
      return {
        ...order,
        vendorLineStatuses: orderSubcollections.vendorStatuses,
        ...orderSubcollections.fulfillmentData,
        visibleLineItems: order.lineItems.filter(item => item._type === "product"),
        visibilityReason: "brand" as const,
      };
    });

    return {
      orders,
      hasMore,
      vendorScope: {
        eventIds: new Set(),
        merchItemIds: new Set(),
        isOrganizer: false,
        isBrand: true,
      },
      lastVisible,
    };
  } catch (error) {
    console.error("Error fetching store orders:", error);
    throw error;
  }
}

// Watch store orders for real-time updates
export function watchStoreOrders(
  userId: string,
  onUpdate: (orders: StoreOrderWithVendorStatus[]) => void,
  onError: (error: Error) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  const setupWatcher = async () => {
    try {
      // Get user's brand ID
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        onError(new Error("User not found"));
        return;
      }
      
      const userData = userDoc.data();
      const brandId = userData.brandId;
      
      if (!brandId) {
        onUpdate([]);
        return;
      }

      // Watch store orders
      const q = query(
        collection(db, "storeOrders"),
        where("brandId", "==", brandId),
        orderBy("createdAt", "desc"),
        limit(20) // Reduced from 50 to 20 for better performance
      );

      unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const basicOrders = snapshot.docs.map(parseStoreOrder);
          
          // PERFORMANCE OPTIMIZATION: Batch fetch subcollections
          const subcollections = await batchGetSubcollections(
            basicOrders.map(o => o.id),
            brandId
          );
          
          // Combine data
          const orders: StoreOrderWithVendorStatus[] = basicOrders.map(order => {
            const orderSubcollections = subcollections[order.id] || {
              vendorStatuses: {},
              fulfillmentData: {
                fulfillmentStatuses: {},
                fulfillmentAggregateStatus: "unfulfilled" as FulfillmentAggregateStatus,
                fulfillmentLines: {},
              },
            };
            
            return {
              ...order,
              vendorLineStatuses: orderSubcollections.vendorStatuses,
              ...orderSubcollections.fulfillmentData,
              visibleLineItems: order.lineItems.filter(item => item._type === "product"),
              visibilityReason: "brand" as const,
            };
          });
          
          onUpdate(orders);
        } catch (error) {
          console.error("Error processing store orders update:", error);
          onError(error instanceof Error ? error : new Error("Unknown error"));
        }
      }, (error) => {
        console.error("Error watching store orders:", error);
        onError(error);
      });
    } catch (error) {
      console.error("Error setting up store orders watcher:", error);
      onError(error instanceof Error ? error : new Error("Unknown error"));
    }
  };

  setupWatcher();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

// Apply filters to store orders
export async function applyStoreOrderFilters(
  userId: string,
  filters: OrderFilters
): Promise<StoreOrdersResult> {
  return getStoreOrders(userId, 10, undefined, filters); // Reduced from 20 to 10
}

// Get single store order with full details
export async function getStoreOrderById(orderId: string, userId: string): Promise<StoreOrderWithVendorStatus | null> {
  try {
    // Get user's brand ID
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    const brandId = userData.brandId;
    
    if (!brandId) {
      return null;
    }

    // Get order
    const orderDoc = await getDoc(doc(db, "storeOrders", orderId));
    if (!orderDoc.exists()) {
      return null;
    }

    const order = parseStoreOrder(orderDoc as QueryDocumentSnapshot<DocumentData>);
    
    // Verify this order belongs to the user's brand
    if (order.brandId !== brandId) {
      return null;
    }
    
    // Get vendor line statuses
    const vendorLineStatuses = await getVendorLineStatuses(order.id, brandId);
    
    // Get fulfillment data
    const fulfillmentData = await getFulfillmentData(order.id, brandId);
    
    // Get timeline events
    const timelineEvents = await getTimelineEvents(order.id);
    
    // Determine visible line items
    const visibleLineItems = order.lineItems.filter(item => item._type === "product");
    
    return {
      ...order,
      vendorLineStatuses,
      ...fulfillmentData,
      visibleLineItems,
      visibilityReason: "brand",
    };
  } catch (error) {
    console.error("Error fetching store order by ID:", error);
    throw error;
  }
}

// Get store order counts for a user
export async function getStoreOrderCounts(userId: string): Promise<{
    awaiting_fulfillment: number;
    unpaid: number;
    completed: number;
    total: number;
}> {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) throw new Error("User not found");

        const userData = userDoc.data();
        let brandId = userData.brandId;
        
        console.log("🔍 getStoreOrderCounts: Resolving brandId", { 
            userId, 
            docBrandId: userData.brandId 
        });

        // Fallback: If no brandId in doc, assume userId is brandId (legacy/fallback behavior matching getStoreOrders)
        if (!brandId) {
            console.log("⚠️ getStoreOrderCounts: No brandId found in user doc, using userId as brandId");
            brandId = userId;
        }

        const ordersRef = collection(db, "storeOrders");
        
        // Use count() aggregation queries
        const qBase = query(ordersRef, where("brandId", "==", brandId));
        
        // Run queries in parallel
        const [totalSnap, pendingSnap, paidSnap, completedSnap] = await Promise.all([
            getCountFromServer(qBase),
            getCountFromServer(query(qBase, where("status", "==", "pending"))),
            getCountFromServer(query(qBase, where("status", "==", "paid"))),
            getCountFromServer(query(qBase, where("status", "==", "completed")))
        ]);

        const counts = {
            total: totalSnap.data().count,
            unpaid: pendingSnap.data().count,
            awaiting_fulfillment: paidSnap.data().count, // Note: This counts ALL paid orders. UI logic might refine this further if needed.
            completed: completedSnap.data().count
        };

        console.log("🔍 getStoreOrderCounts: Results", { brandId, counts });

        return counts;

    } catch (error) {
        console.error("Error fetching store order counts:", error);
        return { awaiting_fulfillment: 0, unpaid: 0, completed: 0, total: 0 };
    }
}

// Get ALL store orders for a brand within a date range (for export)
export async function getAllStoreOrders(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<StoreOrderDoc[]> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) throw new Error("User not found");
    const brandId = userDoc.data().brandId || userId;

    let q = query(
      collection(db, "storeOrders"),
      where("brandId", "==", brandId),
      orderBy("createdAt", "desc")
    );

    // Safety limit for exports
    q = query(q, limit(2000)); 

    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(parseStoreOrder);

    if (startDate && endDate) {
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();
      orders = orders.filter(o => {
        const t = o.createdAt.toDate().getTime();
        return t >= startMs && t <= endMs;
      });
    }

    return orders;
  } catch (error) {
    console.error("Error fetching all store orders for export:", error);
    return [];
  }
}

