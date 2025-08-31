import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";

export type DropContent = {
  id: string;
  brandId: string;
  dropProductId?: string | null;
  teaserImageUrl: string;
  momentName?: string | null;
  momentDescription?: string | null;
  tags?: string[];
};

export async function fetchDropContentById(id: string): Promise<DropContent | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "dropContents", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    brandId: d.brandId,
    dropProductId: d.dropProductId ?? null,
    teaserImageUrl: d.teaserImageUrl,
    momentName: d.momentName ?? "",
    momentDescription: d.momentDescription ?? "",
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
  };
}

// ✅ delete drop content (your request)
export async function deleteDropContent(contentId: string, brandId?: string) {
  const db = getFirestore();
  await deleteDoc(doc(db, "dropContents", contentId));
  // Optional: refresh any local cache here if you keep one for brandId
}
