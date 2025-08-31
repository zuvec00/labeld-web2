/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";

/** ---- types ---- */
export type CollectionDoc = {
  id: string;
  brandId: string;
  name: string;
  description?: string | null;
  mainImageUrl: string;
  galleryImageUrls?: string[];
  styleTags?: string[];
  launchDate?: Date | null;
  isPublished?: boolean;
  heatScore?: number;
};

/** ---- helpers ---- */
function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(+d) ? null : d;
  }
  return null;
}

/** Normalize one doc (works for both getDoc and getDocs) */
function parseCollection(snap: QueryDocumentSnapshot | any): CollectionDoc {
  const d = snap.data ? snap.data() : snap; // support passing raw data for safety
  return {
    id: snap.id,
    brandId: d.brandId,
    name: d.name ?? "",
    description: d.description ?? null,
    mainImageUrl: d.mainImageUrl ?? "",              // must be a string URL
    galleryImageUrls: Array.isArray(d.galleryImageUrls) ? d.galleryImageUrls : [],
    styleTags: Array.isArray(d.styleTags) ? d.styleTags : [],
    launchDate: toDate(d.launchDate),
    isPublished: !!d.isPublished,
    heatScore: typeof d.heatScore === "number" ? d.heatScore : 0,
  };
}

/** ------------------------------------------------------------------------
 * getCollectionListForBrand  ✅ returns full objects
 * --------------------------------------------------------------------- */
export async function getCollectionListForBrand(
  brandId: string
): Promise<CollectionDoc[]> {
  const db = getFirestore();
  const q = query(
    collection(db, "drops"),
    where("brandId", "==", brandId),
    orderBy("launchDate", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(parseCollection);
}

/** ------------------------------------------------------------------------
 * fetchCollectionById
 * --------------------------------------------------------------------- */
export async function fetchCollectionById(id: string): Promise<CollectionDoc | null> {
  const db = getFirestore();
  const ref = doc(db, "drops", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return parseCollection(snap);
}

export async function addCollectionCF(collectionData: Record<string, any>): Promise<{ id?: string }> {
  const fx = getFunctions(app);
  const callable = httpsCallable(fx, "addCollection");
  const { data } = await callable({ collectionData });
  const ok = (data as any)?.success === true || data === true;
  if (!ok) throw new Error("Add collection failed");
  return { id: (data as any)?.id };
}

/** ------------------------------------------------------------------------
 * updateCollectionCF (callable)
 * --------------------------------------------------------------------- */
export async function updateCollectionCF(args: {
  collectionId: string;
  updatedData: Record<string, any>;
}): Promise<void> {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "updateCollection");
  const res: any = await callable({
    collectionId: args.collectionId,
    updatedData: args.updatedData,
  });
  if (!res?.data || res.data.success !== true) {
    throw new Error("Update collection failed");
  }
}

/** ------------------------------------------------------------------------
 * deleteCollection
 * --------------------------------------------------------------------- */
export async function deleteCollection(id: string, _brandId?: string): Promise<void> {
  const db = getFirestore();
  await deleteDoc(doc(db, "drops", id));
}
