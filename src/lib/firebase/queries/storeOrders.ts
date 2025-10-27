// lib/firebase/queries/storeOrders.ts
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
  DocumentData
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
}

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

// Get store orders with vendor status
export async function getStoreOrders(
  userId: string, 
  limitCount: number = 20, 
  startAfterDoc?: any,
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
      where("brandId", "==", brandId),
      orderBy("createdAt", "desc"),
      limit(limitCount + 1)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > limitCount;
    const ordersToProcess = hasMore ? docs.slice(0, limitCount) : docs;
    
    console.log("🔍 Debug - Store orders query results:", { 
      brandId, 
      totalDocs: docs.length, 
      ordersToProcess: ordersToProcess.length,
      hasMore 
    });

    // Process orders
    const orders: StoreOrderWithVendorStatus[] = [];
    
    for (const orderDoc of ordersToProcess) {
      const order = parseStoreOrder(orderDoc);
      
      // Get vendor line statuses
      const vendorLineStatuses = await getVendorLineStatuses(order.id, brandId);
      
      // Get fulfillment data
      const fulfillmentData = await getFulfillmentData(order.id, brandId);
      
      // Get timeline events
      const timelineEvents = await getTimelineEvents(order.id);
      
      // Determine visible line items (all products for brand)
      const visibleLineItems = order.lineItems.filter(item => item._type === "product");
      
      orders.push({
        ...order,
        vendorLineStatuses,
        ...fulfillmentData,
        visibleLineItems,
        visibilityReason: "brand",
      });
    }

    return {
      orders,
      hasMore,
      vendorScope: {
        eventIds: new Set(),
        merchItemIds: new Set(),
        isOrganizer: false,
        isBrand: true,
      },
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
        limit(50)
      );

      unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const orders: StoreOrderWithVendorStatus[] = [];
          
          for (const orderDoc of snapshot.docs) {
            const order = parseStoreOrder(orderDoc);
            
            // Get vendor line statuses
            const vendorLineStatuses = await getVendorLineStatuses(order.id, brandId);
            
            // Get fulfillment data
            const fulfillmentData = await getFulfillmentData(order.id, brandId);
            
            // Determine visible line items
            const visibleLineItems = order.lineItems.filter(item => item._type === "product");
            
            orders.push({
              ...order,
              vendorLineStatuses,
              ...fulfillmentData,
              visibleLineItems,
              visibilityReason: "brand",
            });
          }
          
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
  // For now, just return all orders - filtering can be implemented later
  return getStoreOrders(userId, 20);
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
