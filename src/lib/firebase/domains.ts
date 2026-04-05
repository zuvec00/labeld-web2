import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebaseConfig";

/**
 * Checks if a custom domain is already registered in the global registry.
 */
export async function isCustomDomainTaken(domain: string): Promise<boolean> {
  const normalizedDomain = domain.toLowerCase().trim();
  const domainRef = doc(db, "domains", normalizedDomain);
  const snap = await getDoc(domainRef);
  return snap.exists();
}

/**
 * Registers a custom domain in the global registry and updates the brand profile.
 */
export async function registerCustomDomain(uid: string, domain: string, slug: string) {
  const normalizedDomain = domain.toLowerCase().trim();
  
  // 1. Check if already taken (final safety check)
  const isTaken = await isCustomDomainTaken(normalizedDomain);
  if (isTaken) throw new Error("This domain is already registered with another account.");

  // 2. Add to global domains registry
  // NOTE: brandId and slug are required by the backend verification callable
  await setDoc(doc(db, "domains", normalizedDomain), {
    ownerId: uid,
    brandId: uid,
    slug: slug,
    createdAt: serverTimestamp(),
    status: "pending",
    verified: false
  });

  // 3. Update brand profile
  await updateDoc(doc(db, "brands", uid), {
    customDomain: normalizedDomain,
    useCustomDomain: false, // Default to false until verified/enabled by user
    customDomainStatus: "pending"
  });
}

/**
 * Toggles the "Primary Domain" status (useCustomDomain).
 */
export async function toggleCustomDomainUsage(uid: string, enabled: boolean) {
  await updateDoc(doc(db, "brands", uid), {
    useCustomDomain: enabled
  });
}

/**
 * Triggers the backend DNS verification callable.
 */
export async function triggerDomainVerification(domain: string): Promise<{ verified: boolean; message: string }> {
  const verifyFn = httpsCallable<{ domain: string }, { verified: boolean; message: string }>(functions, 'verifyDomainManual');
  const result = await verifyFn({ domain });
  return result.data;
}

/**
 * Triggers the backend manual domain removal callable.
 * This handles both Vercel cleanup and Firestore record removal in one go.
 */
export async function triggerDomainRemoval(domain: string): Promise<{ success: boolean; message: string }> {
  const removeFn = httpsCallable<{ domain: string }, { success: boolean; message: string }>(functions, 'removeDomainManual');
  const result = await removeFn({ domain });
  return result.data;
}
