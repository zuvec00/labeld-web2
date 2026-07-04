/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc, updateDoc, deleteDoc, getDocs, orderBy, query, where,
  doc, collection, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import type { TicketTypeDoc } from "@/lib/models/ticketType";

export async function listTicketTypes(eventId: string): Promise<TicketTypeDoc[]> {
  const col = collection(db, "events", eventId, "ticketTypes");
  const snap = await getDocs(query(col, orderBy("sortOrder", "asc")));
  return snap.docs.map(d => {
    const data = d.data() as any;
    const quantityTotal = data.quantityTotal == null || Number(data.quantityTotal) < 0 ? null : data.quantityTotal;
    const quantityRemaining = quantityTotal == null || data.quantityRemaining == null || Number(data.quantityRemaining) < 0
      ? null
      : data.quantityRemaining;
    return {
      id: d.id,
      ...data,
      quantityTotal,
      quantityRemaining,
    };
  });
}

export async function createTicketType(eventId: string, data: Omit<TicketTypeDoc, "id">) {
  const col = collection(db, "events", eventId, "ticketTypes");
  const ref = await addDoc(col, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);
  return ref.id;
}

export async function updateTicketType(eventId: string, id: string, patch: Partial<TicketTypeDoc>) {
  await updateDoc(doc(db, "events", eventId, "ticketTypes", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  } as any);
}

export async function reorderTicketTypes(eventId: string, ticketIds: string[]) {
  const batch = writeBatch(db);
  ticketIds.forEach((id, index) => {
    batch.update(doc(db, "events", eventId, "ticketTypes", id), {
      sortOrder: (index + 1) * 10,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function deleteTicketType(eventId: string, id: string) {
  const blockersSnap = await getDocs(query(
    collection(db, "events", eventId, "ticketTypes"),
    where("requiresTicketTypeIds", "array-contains", id)
  ));
  const blockers = blockersSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((ticket) => ticket.isActive !== false);
  if (blockers.length > 0) {
    throw new Error(`Remove this dependency from ${blockers.map((ticket) => ticket.name || "another ticket").join(", ")} before deleting.`);
  }
  await deleteDoc(doc(db, "events", eventId, "ticketTypes", id));
}
