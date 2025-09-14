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
  VendorLineStatus,
  EventLite,
  VendorScope,
  OrderWithVendorStatus,
  FulfillmentLine,
  FulfillmentStatus,
  LineItem,
} from "@/types/orders";


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
      shippingMinor: data.amount?.shippingMinor || 0,
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

// Parse FulfillmentLine from Firestore
function parseFulfillmentLine(doc: QueryDocumentSnapshot): FulfillmentLine {
  const data = doc.data();

  // 1) Pick a single truthy status (server top-level OR old nested field)
  const status: FulfillmentStatus =
    data.status ?? data.shipping?.status ?? "unfulfilled";

  // 2) Mirror into shipping.status so existing UI that reads nested keeps working
  const shipping = data.shipping
    ? { ...data.shipping, status: data.shipping?.status ?? status }
    : undefined;

  return {
    lineKey: data.lineKey || doc.id,
    qtyOrdered: data.qtyOrdered ?? 0,
    qtyFulfilled: data.qtyFulfilled ?? 0,
    notes: data.notes || undefined,
    vendorId: data.vendorId || "",
    shipping,
    // keep top-level for new UI; optional in type (see types change below)
    status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
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

// Get fulfillment lines for orders
export async function getFulfillmentLines(
  orderIds: string[]
): Promise<Record<string, Record<string, FulfillmentLine>>> {
  try {
    console.log("getFulfillmentLines: Called with orderIds:", orderIds);
    const fulfillmentMap: Record<string, Record<string, FulfillmentLine>> = {};

    // Fetch fulfillment lines for each order
    const promises = orderIds.map(async (orderId) => {
      try {
        console.log(`getFulfillmentLines: Fetching for order ${orderId}`);
        const fulfillmentQuery = query(
          collection(db, "orders", orderId, "fulfillmentLines")
        );
        const fulfillmentSnapshot = await getDocs(fulfillmentQuery);
        
        console.log(`getFulfillmentLines: Found ${fulfillmentSnapshot.docs.length} docs for order ${orderId}`);
        
        const orderFulfillmentLines: Record<string, FulfillmentLine> = {};
        fulfillmentSnapshot.docs.forEach((doc) => {
          const data = parseFulfillmentLine(doc);
          console.log(`getFulfillmentLines: Parsed fulfillment line:`, data);
          orderFulfillmentLines[data.lineKey] = data;
        });
        
        fulfillmentMap[orderId] = orderFulfillmentLines;
        console.log(`getFulfillmentLines: Final fulfillment lines for order ${orderId}:`, orderFulfillmentLines);
      } catch (error) {
        console.error(`Error getting fulfillment lines for order ${orderId}:`, error);
        fulfillmentMap[orderId] = {};
      }
    });

    await Promise.all(promises);
    console.log("getFulfillmentLines: Final result:", fulfillmentMap);
    return fulfillmentMap;
  } catch (error) {
    console.error("Error getting fulfillment lines:", error);
    return {};
  }
}

// Get vendor line statuses for orders
export async function getVendorLineStatuses(
  orderIds: string[]
): Promise<Record<string, Record<string, VendorLineStatus>>> {
  try {
    const statusMap: Record<string, Record<string, VendorLineStatus>> = {};

    // Fetch vendor line statuses for each order
    const promises = orderIds.map(async (orderId) => {
      try {
        const statusQuery = query(
          collection(db, "orders", orderId, "vendorLineStatuses")
        );
        const statusSnapshot = await getDocs(statusQuery);
        
        const orderStatuses: Record<string, VendorLineStatus> = {};
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
      let visibleLineItems: LineItem[] = [];
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

    // Get fulfillment lines
    const fulfillmentLines = await getFulfillmentLines([orderId]);
    orderWithStatus.fulfillmentLines = fulfillmentLines[orderId] || {};

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
