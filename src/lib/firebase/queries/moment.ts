// src/lib/firebase/queries/moments.ts
import { addDoc, deleteDoc, getDocs, query, where, orderBy, collection, doc, serverTimestamp, limit } from "firebase/firestore";
import type { MomentDoc } from "@/lib/models/moment";
import { db } from "../firebaseConfig";

const col = collection(db, "eventMoments");

export async function listMomentsForEvent(eventId: string): Promise<MomentDoc[]> {
  const snap = await getDocs(query(col, where("eventId", "==", eventId), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function fetchPublicMoments(): Promise<MomentDoc[]> {
  const snap = await getDocs(query(
    col, 
    where("visibility", "==", "public"),
    orderBy("createdAt", "desc"),
    limit(50)
  ));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function createMoment(data: Omit<MomentDoc, "id" | "createdAt">) {
  const ref = await addDoc(col, {
    ...data,
    createdAt: serverTimestamp(),
  } as any);
  return ref.id;
}

export async function deleteMoment(id: string) {
  await deleteDoc(doc(db, "eventMoments", id));
}
