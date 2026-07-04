import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/firebaseConfig";

export type ImportStatus =
  | "pending"
  | "processing"
  | "success"
  | "partial_success"
  | "failed"
  | "cancelled";

export type ImportPlatform = "bumpa" | "shopify" | "ai";
export type PublishStatus = "csv" | "publish" | "unpublish";

export interface ImportHistory {
  id: string;
  brandId: string;
  fileName: string;
  fileUrl: string;
  platform: ImportPlatform;
  publishStatus: PublishStatus;
  status: ImportStatus;
  type: "products" | "customers";
  createdAt: Date | null;
  updatedAt: Date | null;
  completedAt: Date | null;
  totalProducts: number | null;
  successCount: number | null;
  skippedCount: number | null;
  aiExhausted: boolean;
  cancelRequested: boolean;
  errorMessage: string | null;
}

function docToImportHistory(id: string, data: Record<string, unknown>): ImportHistory {
  const toDate = (v: unknown): Date | null => {
    if (!v) return null;
    if (v instanceof Timestamp) return v.toDate();
    return null;
  };
  return {
    id,
    brandId: (data.brandId as string) ?? "",
    fileName: (data.fileName as string) ?? "",
    fileUrl: (data.fileUrl as string) ?? "",
    platform: (data.platform as ImportPlatform) ?? "ai",
    publishStatus: (data.publishStatus as PublishStatus) ?? "csv",
    status: (data.status as ImportStatus) ?? "pending",
    type: (data.type as "products" | "customers") ?? "products",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    completedAt: toDate(data.completedAt),
    totalProducts: data.totalProducts != null ? Number(data.totalProducts) : null,
    successCount: data.successCount != null ? Number(data.successCount) : null,
    skippedCount: data.skippedCount != null ? Number(data.skippedCount) : null,
    aiExhausted: Boolean(data.aiExhausted),
    cancelRequested: Boolean(data.cancelRequested),
    errorMessage: (data.errorMessage as string) ?? null,
  };
}

/** Real-time listener for customer imports — returns unsubscribe fn */
export function subscribeCustomerImportHistory(
  brandId: string,
  onUpdate: (list: ImportHistory[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    collection(db, "importHistory"),
    where("brandId", "==", brandId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => docToImportHistory(d.id, d.data() as Record<string, unknown>))
        .filter((i) => i.type === "customers");
      onUpdate(list);
    },
    (err) => onError?.(err)
  );
}

/** Real-time listener — returns unsubscribe fn */
export function subscribeImportHistory(
  brandId: string,
  onUpdate: (list: ImportHistory[]) => void,
  onError?: (e: Error) => void
): () => void {
  // Single-field query (no composite index needed).
  // Filter type client-side to avoid requiring a composite Firestore index.
  const q = query(
    collection(db, "importHistory"),
    where("brandId", "==", brandId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => docToImportHistory(d.id, d.data() as Record<string, unknown>))
        .filter((i) => i.type === "products");
      onUpdate(list);
    },
    (err) => onError?.(err)
  );
}

/** Upload CSV to Storage then write an importHistory doc */
export async function queueCsvImport(params: {
  brandId: string;
  file: File;
  platform: ImportPlatform;
  publishStatus: PublishStatus;
}): Promise<string> {
  const { brandId, file, platform, publishStatus } = params;
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `importFiles/${brandId}/${timestamp}_${safeName}`;

  // 1. Upload file to Firebase Storage
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, { contentType: "text/csv" });
  const fileUrl = await getDownloadURL(fileRef);

  // 2. Create importHistory document — backend trigger fires automatically
  const docRef = await addDoc(collection(db, "importHistory"), {
    brandId,
    fileName: file.name,
    fileUrl,
    platform,
    publishStatus,
    status: "pending",
    type: "products",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
