// src/lib/firebase/queries/merch.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where,
  collection, doc, serverTimestamp, orderBy, limit
} from "firebase/firestore";
import type { MerchItemDoc } from "@/lib/models/merch";
import { db } from "../firebaseConfig";

const COL = "merchItems";

export async function listMerchForEvent(eventId: string): Promise<MerchItemDoc[]> {
  const snap = await getDocs(query(
    collection(db, COL),
    where("eventId", "==", eventId),
    orderBy("createdAt","desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function listMerchForBrand(brandId: string): Promise<MerchItemDoc[]> {
  const snap = await getDocs(query(
    collection(db, COL),
    where("brandId", "==", brandId),
    orderBy("createdAt","desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function fetchPublicMerch(): Promise<MerchItemDoc[]> {
  const snap = await getDocs(query(
    collection(db, COL),
    where("isActive", "==", true),
    where("visibility", "==", "public"),
    orderBy("createdAt", "desc"),
    limit(50)
  ));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function getMerchItemById(id: string): Promise<MerchItemDoc | null> {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

export async function createMerchItem(data: Omit<MerchItemDoc, "id" | "createdAt" | "updatedAt">) {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);
  return ref.id;
}

export async function updateMerchItem(id: string, patch: Partial<MerchItemDoc>) {
  await updateDoc(doc(db, COL, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  } as any);
}

export async function deleteMerchItem(id: string) {
  await deleteDoc(doc(db, COL, id));
}
