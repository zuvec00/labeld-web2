// lib/firebase/events.ts
import { db } from "@/lib/firebase/firebaseConfig";
import { EventModel } from "@/lib/models/event";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

/**
 * Create a new event draft in Firestore.
 */
export async function createEventDraft(input: EventModel): Promise<string> {
  const payload = {
    ...input,
    status: "draft" as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // Firestore SDK will handle Date → Timestamp conversion
  };
  const ref = await addDoc(collection(db, "events"), payload);
  return ref.id;
}

/**
 * List up to 60 events created by the given user, newest first.
 */
export async function listMyEventsLite(uid: string): Promise<any[]> {
  const q = query(
    collection(db, "events"),
    where("createdBy", "==", uid),
    orderBy("createdAt", "desc"),
    limit(60)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch all published events for discover page.
 */
export async function fetchPublishedEvents(): Promise<any[]> {
  const q = query(
    collection(db, "events"),
    where("status", "==", "published"),
    where("visibility", "==", "public"),
    orderBy("startAt", "asc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch a single event by its ID.
 */
export async function fetchEventById(eventId: string): Promise<any | null> {
  const snap = await getDoc(doc(db, "events", eventId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Update an event by its ID.
 */
export async function updateEvent(eventId: string, data: Partial<EventModel>): Promise<void> {
  await updateDoc(doc(db, "events", eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Count the number of ticket types for a given event.
 */
export async function countTicketTypes(eventId: string): Promise<number> {
  const snap = await getDocs(collection(db, "events", eventId, "ticketTypes"));
  return snap.size;
}

// publishEvent.ts (example)
export async function publishEvent(eventId: string) {
  await updateDoc(doc(db, "events", eventId), {
    status: "published",
    isPublished: true,
    publishedAt: serverTimestamp(),
  });
}
