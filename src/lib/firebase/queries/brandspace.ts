import { getFirestore, doc, getDoc, onSnapshot, Unsubscribe, Timestamp, query, collection, where, limit, getDocs, updateDoc } from "firebase/firestore";
import { getApp } from "firebase/app";
import type { UserModel } from "@/lib/models/user";
import { BrandModel } from "@/lib/models/brand";

const db = getFirestore(getApp());

export type DropContent = {
  id: string;
  brandId: string;
  teaserImageUrl: string;
  momentName?: string | null;
  momentDescription?: string | null;
  dropProductId?: string | null;
  reactions?: Record<string, number>;
};

export type Product = {
  id: string;
  launchDate?: Date | null;
  copLink?: string | null;
};



export async function fetchUserDoc(uid: string): Promise<UserModel | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { uid: snap.id, ...data } as UserModel;
}

export async function doesBrandDocExist(uid: string): Promise<boolean> {
  const ref = doc(db, "brands", uid);
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function fetchBrandDoc(uid: string): Promise<BrandModel | null> {
  const ref = doc(db, "brands", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { uid: snap.id, ...data } as BrandModel;
}

export function watchBrandDoc(
  uid: string,
  cb: (brand: BrandModel | null) => void
): Unsubscribe {
  const ref = doc(db, "brands", uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ uid: snap.id, ...(snap.data()) } as BrandModel);
  });
}

export function watchUserDoc(
  uid: string,
  cb: (user: UserModel | null) => void
): Unsubscribe {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ uid: snap.id, ...(snap.data()) } as UserModel);
  });
}


function ts(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function fetchDropContentById(id: string): Promise<DropContent | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "dropContents", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    brandId: d.brandId,
    teaserImageUrl: d.teaserImageUrl,
    momentName: d.momentName ?? null,
    momentDescription: d.momentDescription ?? null,
    dropProductId: d.dropProductId ?? null,
    reactions: d.reactions ?? {},
  };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "dropProducts", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    launchDate: ts(d.launchDate),
    copLink: d.copLink ?? null,
  };
}

export async function fetchBrandById(id: string): Promise<BrandModel | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "brands", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return d as BrandModel;
}


export async function isBrandUsernameTaken(usernameLower: string, excludeUid?: string) {
  const db = getFirestore();
  const q = query(
    collection(db, "brands"),
    where("username", "==", usernameLower),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  const hit = snap.docs[0];
  if (excludeUid && hit.id === excludeUid) return false;
  return true;
}

export async function isBrandSlugTaken(slug: string, excludeUid?: string) {
  const db = getFirestore();
  const q = query(
    collection(db, "brands"),
    where("brandSlug", "==", slug),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  const hit = snap.docs[0];
  // If the same user owns this slug, it's "not taken" in the sense that they can keep it.
  // BUT: if we are checking "is it taken by SOMEONE ELSE", we exclude ID.
  if (excludeUid && hit.id === excludeUid) return false;
  return true;
}

export async function updateBrandProfile(uid: string, data: Partial<BrandModel>) {
  const db = getFirestore();
  const ref = doc(db, "brands", uid);
  const payload = { ...data, updatedAt: new Date() };
  Object.keys(payload).forEach((k) => (payload as any)[k] === undefined && delete (payload as any)[k]);
  await updateDoc(ref, payload);
}