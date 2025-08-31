import { getFirestore, doc, getDoc, deleteDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";

export type DropContent = {
  id: string;
  brandId: string;
  dropProductId?: string | null;
  teaserImageUrl: string;
  momentName?: string | null;
  momentDescription?: string | null;
  tags?: string[];
  launchDate?: Date | null;
  reactions?: Record<string, number>;
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

// Fetch public drop content for discover page
export async function fetchPublicDropContent(): Promise<DropContent[]> {
  const db = getFirestore();
  const q = query(
    collection(db, "dropContents"),
  
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      brandId: data.brandId,
      dropProductId: data.dropProductId ?? null,
      teaserImageUrl: data.teaserImageUrl,
      momentName: data.momentName ?? null,
      momentDescription: data.momentDescription ?? null,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      launchDate: data.launchDate ? new Date(data.launchDate) : null,
      reactions: data.reactions ?? {},
    };
  });
}
