// lib/firebase/admin/cleanup.ts
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

export interface AttendeeTicketSummary {
  id: string;
  ticketCode: string;
  buyerEmail: string;
  buyerPhone?: string;
  ticketTypeName: string;
  eventId: string;
  status: string;
  ownerUserId: string;
}

export interface OrderSummary {
  id: string;
  eventId: string;
  deliverToEmail?: string;
  deliverToName?: string;
  status: string;
  totalMinor: number;
  hasTickets: boolean;
  createdAt: any;
}

export interface WalletLedgerSummary {
  id: string;
  amountMinor: number;
  type: string;
  source: string;
  eventId?: string;
  createdAt: number;
}

export interface StoreOrderSummary {
  id: string;
  brandId: string;
  status: string;
  totalMinor: number;
  createdAt: any;
}

export interface CleanupSummary {
  events: Array<{ id: string; title: string; createdAt: any }>;
  attendeeTickets: AttendeeTicketSummary[];
  orders: OrderSummary[];
  storeOrders: StoreOrderSummary[];
  walletLedger: WalletLedgerSummary[];
  currentWalletBalanceMinor: number;
}

/**
 * Fetch all events created by a specific user
 */
export async function fetchUserEvents(userId: string) {
  const db = getFirestore();
  const eventsRef = collection(db, "events");
  const q = query(eventsRef, where("createdBy", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title || "Untitled Event",
    createdAt: doc.data().createdAt,
  }));
}

/**
 * Fetch attendee tickets for given event IDs with details
 */
export async function fetchAttendeeTickets(eventIds: string[]): Promise<AttendeeTicketSummary[]> {
  if (eventIds.length === 0) return [];

  const db = getFirestore();
  const ticketsRef = collection(db, "attendeeTickets");

  const tickets: AttendeeTicketSummary[] = [];

  // Firestore 'in' queries are limited to 30 items, so we batch
  for (let i = 0; i < eventIds.length; i += 30) {
    const batch = eventIds.slice(i, i + 30);
    const q = query(ticketsRef, where("eventId", "in", batch));
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        ticketCode: data.ticketCode || "",
        buyerEmail: data.buyerEmail || "",
        buyerPhone: data.buyerPhone,
        ticketTypeName: data.ticketTypeName || "",
        eventId: data.eventId || "",
        status: data.status || "",
        ownerUserId: data.ownerUserId || "",
      });
    });
  }

  return tickets;
}

/**
 * Fetch orders for given event IDs with details
 */
export async function fetchOrders(eventIds: string[]): Promise<OrderSummary[]> {
  if (eventIds.length === 0) return [];

  const db = getFirestore();
  const ordersRef = collection(db, "orders");

  const orders: OrderSummary[] = [];

  // Batch queries for Firestore 'in' limit
  for (let i = 0; i < eventIds.length; i += 30) {
    const batch = eventIds.slice(i, i + 30);
    const q = query(ordersRef, where("eventId", "in", batch));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        eventId: data.eventId || "",
        deliverToEmail: data.deliverTo?.email,
        deliverToName: data.deliverTo?.name,
        status: data.status || "",
        totalMinor: data.amount?.totalMinor || 0,
        hasTickets: data.hasTickets || false,
        createdAt: data.createdAt,
      });
    });
  }

  return orders;
}

/**
 * Fetch wallet ledger entries for a vendor with details
 */
export async function fetchWalletLedger(vendorId: string): Promise<WalletLedgerSummary[]> {
  const db = getFirestore();
  const ledgerRef = collection(db, "walletLedger");
  const q = query(ledgerRef, where("vendorId", "==", vendorId));
  const snapshot = await getDocs(q);

  const ledger: WalletLedgerSummary[] = [];
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    ledger.push({
      id: doc.id,
      amountMinor: data.amountMinor || 0,
      type: data.type || "",
      source: data.source || "",
      eventId: data.eventId,
      createdAt: data.createdAt || 0,
    });
  });

  return ledger;
}

/**
 * Fetch store orders for a user (brand)
 */
export async function fetchStoreOrders(userId: string): Promise<StoreOrderSummary[]> {
  const db = getFirestore();
  
  // First get brandId from user
  const userDoc = await getDoc(doc(db, "users", userId));
  const brandId = userDoc.exists() ? (userDoc.data().brandId || userId) : userId;

  const ordersRef = collection(db, "storeOrders");
  const q = query(ordersRef, where("brandId", "==", brandId));
  const snapshot = await getDocs(q);

  const orders: StoreOrderSummary[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    orders.push({
      id: doc.id,
      brandId: data.brandId || "",
      status: data.status || "",
      totalMinor: data.amount?.totalMinor || 0,
      createdAt: data.createdAt,
    });
  });

  return orders;
}

/**
 * Get current wallet balance for a user
 */
export async function getCurrentWalletBalance(userId: string) {
  const db = getFirestore();
  const userRef = doc(db, "users", userId);
  const userSnapshot = await getDoc(userRef);
  
  if (!userSnapshot.exists()) return 0;
  
  const userData = userSnapshot.data();
  return userData?.wallet?.eligibleBalanceMinor || 0;
}

/**
 * Fetch complete cleanup summary with detailed records
 */
export async function fetchCleanupSummary(userId: string): Promise<CleanupSummary> {
  const events = await fetchUserEvents(userId);
  const eventIds = events.map((e) => e.id);

  const [attendeeTickets, orders, storeOrders, walletLedger, currentWalletBalanceMinor] =
    await Promise.all([
      fetchAttendeeTickets(eventIds),
      fetchOrders(eventIds),
      fetchStoreOrders(userId),
      fetchWalletLedger(userId),
      getCurrentWalletBalance(userId),
    ]);

  return {
    events,
    attendeeTickets,
    orders,
    storeOrders,
    walletLedger,
    currentWalletBalanceMinor,
  };
}

/**
 * Delete attendee tickets for given event IDs
 */
export async function deleteAttendeeTickets(eventIds: string[]) {
  if (eventIds.length === 0) return 0;

  const db = getFirestore();
  const ticketsRef = collection(db, "attendeeTickets");

  let deletedCount = 0;

  // Process in batches of 30 for 'in' query limit
  for (let i = 0; i < eventIds.length; i += 30) {
    const eventBatch = eventIds.slice(i, i + 30);
    const q = query(ticketsRef, where("eventId", "in", eventBatch));
    const snapshot = await getDocs(q);

    // Delete in batches of 500 (Firestore batch limit)
    const docs = snapshot.docs;
    for (let j = 0; j < docs.length; j += 500) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(j, j + 500);

      batchDocs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
    }
  }

  return deletedCount;
}

/**
 * Delete orders for given event IDs
 */
export async function deleteOrders(eventIds: string[]) {
  if (eventIds.length === 0) return 0;

  const db = getFirestore();
  const ordersRef = collection(db, "orders");

  let deletedCount = 0;

  // Process in batches of 30 for 'in' query limit
  for (let i = 0; i < eventIds.length; i += 30) {
    const eventBatch = eventIds.slice(i, i + 30);
    const q = query(ordersRef, where("eventId", "in", eventBatch));
    const snapshot = await getDocs(q);

    // Delete in batches of 500 (Firestore batch limit)
    const docs = snapshot.docs;
    for (let j = 0; j < docs.length; j += 500) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(j, j + 500);

      batchDocs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
    }
  }

  return deletedCount;
}

/**
 * Delete wallet ledger entries for a vendor
 */
export async function deleteWalletLedger(vendorId: string) {
  const db = getFirestore();
  const ledgerRef = collection(db, "walletLedger");
  const q = query(ledgerRef, where("vendorId", "==", vendorId));
  const snapshot = await getDocs(q);

  let deletedCount = 0;

  // Delete in batches of 500 (Firestore batch limit)
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    const batchDocs = docs.slice(i, i + 500);

    batchDocs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    deletedCount += batchDocs.length;
  }

  return deletedCount;
}

/**
 * Delete store orders for a user (brand)
 */
export async function deleteStoreOrders(userId: string) {
  const db = getFirestore();
  
  // First get brandId from user
  const userDoc = await getDoc(doc(db, "users", userId));
  const brandId = userDoc.exists() ? (userDoc.data().brandId || userId) : userId;

  const ordersRef = collection(db, "storeOrders");
  const q = query(ordersRef, where("brandId", "==", brandId));
  const snapshot = await getDocs(q);

  let deletedCount = 0;

  // Delete in batches of 500 (Firestore batch limit)
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = writeBatch(db);
    const batchDocs = docs.slice(i, i + 500);

    batchDocs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    deletedCount += batchDocs.length;
  }

  return deletedCount;
}

/**
 * Reset wallet balance to 0 for a user
 */
export async function resetWalletBalance(userId: string) {
  const db = getFirestore();
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    "wallet.eligibleBalanceMinor": 0,
    "wallet.lastUpdatedAt": Date.now(),
  });
}

/**
 * Execute cleanup based on selected options
 */
export async function executeCleanup(
  userId: string,
  options: {
    deleteAttendeeTickets: boolean;
    deleteOrders: boolean;
    deleteStoreOrders: boolean;
    deleteWalletLedger: boolean;
    resetWallet: boolean;
  }
) {
  const events = await fetchUserEvents(userId);
  const eventIds = events.map((e) => e.id);

  const results = {
    attendeeTicketsDeleted: 0,
    ordersDeleted: 0,
    storeOrdersDeleted: 0,
    walletLedgerDeleted: 0,
    walletReset: false,
  };

  if (options.deleteAttendeeTickets) {
    results.attendeeTicketsDeleted = await deleteAttendeeTickets(eventIds);
  }

  if (options.deleteOrders) {
    results.ordersDeleted = await deleteOrders(eventIds);
  }

  if (options.deleteStoreOrders) {
    results.storeOrdersDeleted = await deleteStoreOrders(userId);
  }

  if (options.deleteWalletLedger) {
    results.walletLedgerDeleted = await deleteWalletLedger(userId);
  }

  if (options.resetWallet) {
    await resetWalletBalance(userId);
    results.walletReset = true;
  }

  return results;
}

