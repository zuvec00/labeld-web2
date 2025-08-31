/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc, updateDoc, deleteDoc, getDocs, orderBy, query,
  doc, collection, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import type { TicketTypeDoc } from "@/lib/models/ticketType";

export async function listTicketTypes(eventId: string): Promise<TicketTypeDoc[]> {
  const col = collection(db, "events", eventId, "ticketTypes");
  const snap = await getDocs(query(col, orderBy("sortOrder", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
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

export async function deleteTicketType(eventId: string, id: string) {
  await deleteDoc(doc(db, "events", eventId, "ticketTypes", id));
}
