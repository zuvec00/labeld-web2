import { getFunctions, httpsCallable } from "firebase/functions";
import { app, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

/** If your CFs are in a specific region, set it here */
const REGION = undefined as string | undefined; // e.g. "europe-west1"
function fx() {
  return getFunctions(app, REGION);
}

/** accept boolean true or common { success: true } / { ok: true } etc. */
function isOk(data: any): boolean {
  return (
    data === true ||
    data?.success === true ||
    data?.ok === true ||
    data?.alreadyExisted === true
  );
}

/** --------------------------- addUserCF --------------------------- */
export async function addUserCF(payload: {
  email?: string | null;
  username?: string;
  displayName?: string;
  profileImageUrl?: string | null;
  isBrand?: boolean;
  brandSpaceSetupComplete?: boolean;
}) {
  const callable = httpsCallable(fx(), "addUser");
  const res = await callable({
    email: payload.email ?? null,
    username: payload.username ?? "",
    displayName: payload.displayName ?? "",
    profileImageUrl: payload.profileImageUrl ?? null,
    isBrand: payload.isBrand ?? false,
    brandSpaceSetupComplete: payload.brandSpaceSetupComplete ?? false,
    profileSetupComplete: false,
  });
  const { data } = res as { data: any };
  if (!isOk(data)) {
    console.warn("addUserCF unexpected response:", data);
    throw new Error("User creation failed");
  }
}

/** ---------- ensure user doc exists (for Google/Apple first-timers) ---------- */
export async function ensureUserDoc(
  uid: string,
  defaults: Parameters<typeof addUserCF>[0]
) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await addUserCF(defaults);
  }
}

/** ------------------------ username availability ------------------------ */
export async function checkUsernameUniqueCF(username: string): Promise<boolean> {
  const callable = httpsCallable(fx(), "checkUsernameUnique");
  const res = await callable({ username });
  const taken = (res as any)?.data?.taken === true;
  return !taken;
}

/** ----------------------------- update user ----------------------------- */
type UpdateUserArgs = {
  email?: string | null;
  username?: string; // lowercased before send
  displayName?: string;
  profileImageUrl?: string | null;
  isBrand?: boolean;
  brandSpaceSetupComplete?: boolean;
  profileSetupComplete?: boolean;
};

export async function updateUserCF(fields: UpdateUserArgs) {
  const callable = httpsCallable(fx(), "updateUser");
  const res = await callable(fields);
  const ok = isOk((res as any)?.data);
  if (!ok) {
    console.warn("updateUserCF unexpected response:", (res as any)?.data);
    throw new Error("updateUser failed");
  }
}

/** --------------------------- send notification -------------------------- */
export async function sendNotificationCF(args: {
  title: string;
  content: string;
  externalUserIds?: string[];
  androidChannelId?: string;
  iosSound?: string;
}) {
  const callable = httpsCallable(fx(), "sendNotification");
  await callable(args);
}
