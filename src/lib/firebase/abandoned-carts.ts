import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import type { AbandonedCart, RecoverySettings } from "@/lib/models/abandoned-cart";
import { DEFAULT_RECOVERY_SETTINGS } from "@/lib/models/abandoned-cart";

export function subscribeAbandonedCarts(
  brandId: string,
  cb: (carts: AbandonedCart[]) => void,
) {
  const q = query(
    collection(db, "abandoned_carts"),
    where("brandId", "==", brandId),
    orderBy("detectedAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as AbandonedCart)),
    );
  });
}

export async function getRecoverySettings(
  brandId: string,
): Promise<RecoverySettings> {
  const ref = doc(db, "brand_recovery_settings", brandId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { brandId, ...DEFAULT_RECOVERY_SETTINGS };
  }
  return { brandId, ...DEFAULT_RECOVERY_SETTINGS, ...(snap.data() as Partial<RecoverySettings>) };
}

export async function saveRecoverySettings(
  settings: RecoverySettings,
): Promise<void> {
  const ref = doc(db, "brand_recovery_settings", settings.brandId);
  await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}
