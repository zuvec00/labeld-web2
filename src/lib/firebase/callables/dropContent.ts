/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";

export async function addDropContentCF(contentData: Record<string, any>): Promise<string> {
  const callable = httpsCallable(getFunctions(app), "addDropContent");
  const { data } = await callable({ contentData });
  // Expecting { success: true, id: "newDocId" }
  if (!(data as any)?.success) throw new Error("Add drop content failed");
  return (data as any)?.id ?? "";
}

export async function updateDropContentCF(args: {
  contentId: string;
  updatedData: Record<string, any>;
}) {
  const functions = getFunctions(app);
  const callable = httpsCallable(functions, "updateDropContent");
  const { data } = await callable(args as any);
  if (!data || (data as any).success !== true) {
    throw new Error("Update drop content failed");
  }
}
