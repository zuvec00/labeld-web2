import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

export async function checkBrandUsernameUniqueCF(username: string): Promise<boolean> {
  const functions = getFunctions(getApp());
  const callable = httpsCallable(functions, "checkBrandUsernameUnique");
  const { data } = await callable({ username });
  // backend returns { taken: boolean }
  return !(data as any)?.taken;
}

type AddBrandArgs = {
  brandName: string;
  username: string;           // normalized (lowercase)
  bio?: string | null;
  category: string;
  brandTags?: string[] | null;
  logoUrl: string;            // required
  coverImageUrl?: string | null;
  state?: string | null;
  country?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
};

export async function addBrandCF(args: AddBrandArgs): Promise<void> {
  const functions = getFunctions(getApp());
  const callable = httpsCallable(functions, "addBrand");
  const { data } = await callable(args);
  if (!(data as any)?.success) throw new Error("addBrand failed");
}
