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
  
import { Product, ProductLite } from "@/lib/models/product";

export type { Product, ProductLite };


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
    sizeGuideUrl: d.sizeGuideUrl ?? null,
    description: d.description ?? null,
    styleTags: Array.isArray(d.styleTags) ? d.styleTags.map(String) : null,
    sizeOptions: Array.isArray(d.sizeOptions) ? d.sizeOptions.map(String) : null,
    colors: Array.isArray(d.colors) ? d.colors : null,
    copLink: d.copLink ?? null,
    stockRemaining: d.stockRemaining !== undefined && d.stockRemaining !== null ? Number(d.stockRemaining) : null,
    stockMode: d.stockMode ?? "global",
    variantStock: d.variantStock ?? null,
    discountPercent: d.discountPercent !== undefined && d.discountPercent !== null ? Number(d.discountPercent) : null,
    feeSettings: d.feeSettings ? {
      absorbTransactionFee: !!d.feeSettings.absorbTransactionFee
    } : null,
    costPrice: d.costPrice !== undefined && d.costPrice !== null ? Number(d.costPrice) : null,
    brandName: d.brandName ?? null,
    brandUsername: d.brandUsername ?? null,
    brandLogoUrl: d.brandLogoUrl ?? null,
    reviewSummary: d.reviewSummary ?? null,
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
    sizeGuideUrl: d.sizeGuideUrl ?? null,
    description: d.description ?? "",
    styleTags: Array.isArray(d.styleTags) ? d.styleTags.map(String) : [],
    sizeOptions: Array.isArray(d.sizeOptions) ? d.sizeOptions.map(String) : [],
    colors: Array.isArray(d.colors) ? d.colors : [],
    copLink: d.copLink ?? "",
    stockRemaining: d.stockRemaining !== undefined && d.stockRemaining !== null ? Number(d.stockRemaining) : null,
    stockMode: d.stockMode ?? "global",
    variantStock: d.variantStock ?? null,
    discountPercent: d.discountPercent !== undefined && d.discountPercent !== null ? Number(d.discountPercent) : null,
    feeSettings: d.feeSettings ? {
      absorbTransactionFee: !!d.feeSettings.absorbTransactionFee
    } : null,
    brandName: d.brandName ?? null,
    brandUsername: d.brandUsername ?? null,
    brandLogoUrl: d.brandLogoUrl ?? null,
    reviewSummary: d.reviewSummary ?? null,
  };
}

export async function addDropProductCF(productData: Record<string, any>): Promise<{ id?: string }> {
  const fx = getFunctions(app);
  const callable = httpsCallable(fx, "addDropProduct");
  const { data } = await callable({ productData });
  
  // Debug: Log the full response from backend
  console.log("addDropProductCF backend response:", data);
  
  // Backend returns { success: true, productId: "..." }
  const ok = (data as any)?.success === true;
  if (!ok) throw new Error("Add drop product failed");
  
  const id = (data as any)?.productId; // Updated to use productId from backend
  console.log("Extracted productId from backend response:", id);
  
  return { id };
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

