import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/firebaseConfig";

export async function cancelImport(importId: string): Promise<void> {
  const functions = getFunctions(app);
  const callable = httpsCallable(functions, "cancelImport");
  await callable({ importId });
}
