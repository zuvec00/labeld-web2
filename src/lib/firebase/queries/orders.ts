// lib/firebase/queries/orders.ts
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import {
  OrderDoc,
  VendorLineStatusDoc,
  EventLite,
  VendorScope,
  OrderWithVendorStatus,
} from "@/types/orders";

// Parse Firestore timestamp to number
function toMillis(ts: any): number {
  if (ts && ts.toMillis) {
    return ts.toMillis();
  }
  if (typeof ts === "number") {
    return ts;
  }
  return Date.now();
}

// Parse OrderDoc from Firestore
function parseOrderDoc(doc: QueryDocumentSnapshot): OrderDoc {
  const data = doc.data();
  return {
    id: doc.id,
    eventId: data.eventId || "",
    buyerUserId: data.buyerUserId || null,
    status: data.status || "pending",
    lineItems: data.lineItems || [],
    amount: {
      currency: data.amount?.currency || "NGN",
      itemsSubtotalMinor: data.amount?.itemsSubtotalMinor || 0,
      feesMinor: data.amount?.feesMinor || 0,
      totalMinor: data.amount?.totalMinor || 0,
    },
    fees: data.fees || undefined,
    provider: data.provider || null,
    providerRef: data.providerRef || undefined,
    deliverTo: data.deliverTo || undefined,
    hasTickets: data.hasTickets || false,
    ticketQtyByType: data.ticketQtyByType || undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    paidAt: data.paidAt,
    cancelledAt: data.cancelledAt,
  };
}

// Parse VendorLineStatusDoc from Firestore
function parseVendorLineStatusDoc(doc: QueryDocumentSnapshot): VendorLineStatusDoc {
  const data = doc.data();
  return {
    lineKey: data.lineKey || "",
    vendorId: data.vendorId || "",
    status: data.status || "processing",
    updatedAt: data.updatedAt,
  };
}

// Parse EventLite from Firestore
function parseEventLite(doc: DocumentSnapshot): EventLite | null {
  if (!doc.exists()) return null;
  const data = doc.data();
  return {
    id: doc.id,
    title: data?.title || undefined,
    createdBy: data?.createdBy || undefined,
  };
}

// Get vendor scope (events and merch items they own)
export async function getVendorScope(vendorId: string): Promise<VendorScope> {
  try {
    // Get events where user is organizer
    const eventsQuery = query(
      collection(db, "events"),
      where("createdBy", "==", vendorId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    const eventIds = new Set(eventsSnapshot.docs.map(doc => doc.id));

    // Get merch items where user is brand
    const merchQuery = query(
      collection(db, "merchItems"),
      where("brandId", "==", vendorId)
    );
    const merchSnapshot = await getDocs(merchQuery);
    const merchItemIds = new Set(merchSnapshot.docs.map(doc => doc.id));

    return {
      eventIds,
      merchItemIds,
      isOrganizer: eventIds.size > 0,
      isBrand: merchItemIds.size > 0,
    };
  } catch (error) {
    console.error("Error getting vendor scope:", error);
    return {
      eventIds: new Set(),
      merchItemIds: new Set(),
      isOrganizer: false,
      isBrand: false,
    };
  }
}

// Get orders within date range
export async function getOrdersInDateRange(
  startDate: Date,
  endDate: Date,
  pageSize: number = 25,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ orders: OrderDoc[]; lastDoc?: QueryDocumentSnapshot }> {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    let ordersQuery = query(
      collection(db, "orders"),
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(ordersQuery);
    const orders = snapshot.docs.map(parseOrderDoc);
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1];

    return {
      orders,
      lastDoc: newLastDoc,
    };
  } catch (error) {
    console.error("Error getting orders in date range:", error);
    return { orders: [] };
  }
}

// Get vendor line statuses for orders
export async function getVendorLineStatuses(
  orderIds: string[]
): Promise<Record<string, Record<string, string>>> {
  try {
    const statusMap: Record<string, Record<string, string>> = {};

    // Fetch vendor line statuses for each order
    const promises = orderIds.map(async (orderId) => {
      try {
        const statusQuery = query(
          collection(db, "orders", orderId, "vendorLineStatuses")
        );
        const statusSnapshot = await getDocs(statusQuery);
        
        const orderStatuses: Record<string, string> = {};
        statusSnapshot.docs.forEach((doc) => {
          const data = parseVendorLineStatusDoc(doc);
          orderStatuses[data.lineKey] = data.status;
        });
        
        statusMap[orderId] = orderStatuses;
      } catch (error) {
        console.error(`Error getting vendor line statuses for order ${orderId}:`, error);
        statusMap[orderId] = {};
      }
    });

    await Promise.all(promises);
    return statusMap;
  } catch (error) {
    console.error("Error getting vendor line statuses:", error);
    return {};
  }
}

// Get event details
export async function getEventDetails(eventId: string): Promise<EventLite | null> {
  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    return parseEventLite(eventDoc);
  } catch (error) {
    console.error("Error getting event details:", error);
    return null;
  }
}

// Get event details for multiple events
export async function getEventDetailsBatch(eventIds: string[]): Promise<Record<string, EventLite>> {
  try {
    const eventMap: Record<string, EventLite> = {};
    
    const promises = eventIds.map(async (eventId) => {
      const event = await getEventDetails(eventId);
      if (event) {
        eventMap[eventId] = event;
      }
    });

    await Promise.all(promises);
    return eventMap;
  } catch (error) {
    console.error("Error getting event details batch:", error);
    return {};
  }
}

// Filter orders by vendor scope
export function filterOrdersByVendorScope(
  orders: OrderDoc[],
  vendorScope: VendorScope
): OrderWithVendorStatus[] {
  return orders
    .map((order) => {
      const isOrganizerOrder = vendorScope.eventIds.has(order.eventId);
      
      // Filter line items for brand orders
      let visibleLineItems: any[] = [];
      let visibilityReason: "organizer" | "brand" | "both" | undefined;

      if (isOrganizerOrder) {
        // Organizer sees all line items
        visibleLineItems = order.lineItems;
        visibilityReason = vendorScope.isBrand ? "both" : "organizer";
      } else {
        // Brand sees only their merch items
        visibleLineItems = order.lineItems.filter(
          (item) => item._type === "merch" && vendorScope.merchItemIds.has(item.merchItemId)
        );
        if (visibleLineItems.length > 0) {
          visibilityReason = "brand";
        }
      }

      // Only include order if vendor has visibility
      if (visibleLineItems.length > 0) {
        return {
          ...order,
          visibleLineItems,
          visibilityReason,
        } as OrderWithVendorStatus;
      }

      return null;
    })
    .filter((order): order is OrderWithVendorStatus => order !== null);
}

// Get single order with vendor line statuses
export async function getOrderWithVendorStatus(
  orderId: string,
  vendorScope: VendorScope
): Promise<OrderWithVendorStatus | null> {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) return null;

    const order = parseOrderDoc(orderDoc as QueryDocumentSnapshot);
    const filteredOrders = filterOrdersByVendorScope([order], vendorScope);
    
    if (filteredOrders.length === 0) return null;

    const orderWithStatus = filteredOrders[0];
    
    // Get vendor line statuses
    const vendorLineStatuses = await getVendorLineStatuses([orderId]);
    orderWithStatus.vendorLineStatuses = vendorLineStatuses[orderId] || {};

    // Get event details
    const event = await getEventDetails(order.eventId);
    if (event) {
      orderWithStatus.eventTitle = event.title;
    }

    return orderWithStatus;
  } catch (error) {
    console.error("Error getting order with vendor status:", error);
    return null;
  }
}
