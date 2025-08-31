/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  orderBy,
  deleteDoc,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";
  
export type ProductLite = {
  id: string;
  dropName: string;
  launchDate?: Date | null;
};

export type Product = {
  id: string;
  brandId: string;
  userId?: string;
  dropId?: string | null;
  dropName: string;
  price: number;
  currency?: Record<string, string> | string | null; // matches Flutter's flexible map
  launchDate: Date | null;
  isAvailableNow?: boolean;
  mainVisualUrl: string;
  galleryImages?: string[] | null;
  description?: string | null;
  styleTags?: string[] | null;
  sizeOptions?: string[] | null;
  copLink?: string | null;

  // denormalized brand fields (optional)
  brandName?: string | null;
  brandUsername?: string | null;
  brandLogoUrl?: string | null;
};


const toDate = (v: any): Date | null =>
  v?.toDate?.() ?? (typeof v === "string" ? new Date(v) : null);

function toProduct(id: string, d: DocumentData): Product {
  const toDate = (v: any): Date | null =>
    v?.toDate?.() ?? (typeof v === "string" ? new Date(v) : null);

  return {
    id,
    brandId: d.brandId,
    userId: d.userId,
    dropId: d.dropId ?? null,
    dropName: d.dropName ?? "(Untitled)",
    price: Number(d.price ?? 0),
    currency: d.currency ?? null,
    launchDate: toDate(d.launchDate),
    isAvailableNow: !!d.isAvailableNow,
    mainVisualUrl: d.mainVisualUrl ?? "",
    galleryImages: Array.isArray(d.galleryImages) ? d.galleryImages.map(String) : null,
    description: d.description ?? null,
    styleTags: Array.isArray(d.styleTags) ? d.styleTags.map(String) : null,
    sizeOptions: Array.isArray(d.sizeOptions) ? d.sizeOptions.map(String) : null,
    copLink: d.copLink ?? null,
    brandName: d.brandName ?? null,
    brandUsername: d.brandUsername ?? null,
    brandLogoUrl: d.brandLogoUrl ?? null,
  };
}



export async function getProductListForBrand(brandId: string): Promise<Product[]> {
  const db = getFirestore();
  const q = query(
    collection(db, "dropProducts"),
    where("brandId", "==", brandId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => toProduct(d.id, d.data()));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "dropProducts", id));
  if (!snap.exists()) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    brandId: d.brandId,
    userId: d.userId,
    dropId: d.dropId ?? null,
    dropName: d.dropName ?? "",
    price: Number(d.price ?? 0),
    currency: d.currency ?? null,
    launchDate: toDate(d.launchDate),
    isAvailableNow: !!d.isAvailableNow,
    mainVisualUrl: d.mainVisualUrl ?? "",
    galleryImages: Array.isArray(d.galleryImages) ? d.galleryImages.map(String) : [],
    description: d.description ?? "",
    styleTags: Array.isArray(d.styleTags) ? d.styleTags.map(String) : [],
    sizeOptions: Array.isArray(d.sizeOptions) ? d.sizeOptions.map(String) : [],
    copLink: d.copLink ?? "",
    brandName: d.brandName ?? null,
    brandUsername: d.brandUsername ?? null,
    brandLogoUrl: d.brandLogoUrl ?? null,
  };
}

export async function addDropProductCF(productData: Record<string, any>): Promise<{ id?: string }> {
  const fx = getFunctions(app);
  const callable = httpsCallable(fx, "addDropProduct");
  const { data } = await callable({ productData });
  // Backend can return { success: true, id: "..." } or just { success: true }
  const ok = (data as any)?.success === true || data === true;
  if (!ok) throw new Error("Add drop product failed");
  return { id: (data as any)?.id };
}

export async function updateDropProduct(productId: string, updatedData: Record<string, any>) {
  const db = getFirestore();
  await updateDoc(doc(db, "dropProducts", productId), {
    ...updatedData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDropProduct(productId: string, _brandId?: string) {
  const db = getFirestore();
  await deleteDoc(doc(db, "dropProducts", productId));
  // If you cache by brandId, refresh here.
}

