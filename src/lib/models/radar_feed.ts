// src/lib/firebase/queries/radar.ts
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  doc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

export type DropContent = {
  id: string;
  brandId: string;
  userId?: string;
  dropProductId?: string | null;
  teaserImageUrl: string;
  momentName?: string | null;
  momentDescription?: string | null;
  launchDate?: Date | null;
  reactions?: Record<string, number>;
};

function tsToDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function fetchBrandContents(brandId: string): Promise<DropContent[]> {
  const db = getFirestore();
  const q = query(
    collection(db, "dropContents"),
    where("brandId", "==", brandId),
   // where("isPublished", "==", true),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      brandId: data.brandId,
      userId: data.userId ?? undefined,
      dropProductId: data.dropProductId ?? null,
      teaserImageUrl: data.teaserImageUrl,
      momentName: data.momentName ?? null,
      momentDescription: data.momentDescription ?? null,
      launchDate: tsToDate(data.launchDate),
      reactions: data.reactions ?? {},
    } as DropContent;
  });
}

export async function deleteDropContent(brandId: string, contentId: string) {
  // NOTE: your Flutter service also removes heat & storage images.
  // Here we only delete the dropContents/{id} doc. Extend if needed.
  const db = getFirestore();
  await deleteDoc(doc(db, "dropContents", contentId));
}

/** Toggle a single-emoji reaction like your Flutter `toggleReactionOnDropContent` */
export async function toggleReactionOnDropContent(
  args: { contentId: string; brandId: string; userId: string; emojiKey: string }
) {
  const db = getFirestore();
  const contentRef = doc(db, "dropContents", args.contentId);
  const userReactionRef = doc(db, "dropContents", args.contentId, "reactions", args.userId);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userReactionRef);
    const contentSnap = await tx.get(contentRef);
    if (!contentSnap.exists()) throw new Error("Content not found");

    const contentData = contentSnap.data();
    const reactions: Record<string, number> = { ...(contentData.reactions ?? {}) };

    let emojis: string[] = [];
    if (userSnap.exists()) {
      const u = userSnap.data();
      emojis = Array.isArray(u.emojis) ? [...u.emojis] : [];
    }

    const has = emojis.includes(args.emojiKey);

    if (has) {
      emojis = emojis.filter((e) => e !== args.emojiKey);
      if (emojis.length === 0) {
        tx.delete(userReactionRef);
      } else {
        tx.update(userReactionRef, { emojis, reactedAt: new Date() });
      }
      reactions[args.emojiKey] = Math.max(0, (reactions[args.emojiKey] ?? 0) - 1);
    } else {
      emojis.push(args.emojiKey);
      tx.set(userReactionRef, { emojis, reactedAt: new Date() }, { merge: true });
      reactions[args.emojiKey] = (reactions[args.emojiKey] ?? 0) + 1;
    }

    tx.update(contentRef, { reactions });
  });
}
