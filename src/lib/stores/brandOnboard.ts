"use client";

import { create } from "zustand";

/***************************************
 * Brand Onboard State (Zustand)
 * - UI-only draft values during onboarding
 ***************************************/
export type BrandOnboardState = {
  // Step 1
  brandName: string;
  brandUsername: string; // @handle rules applied in UI
  phoneNumber: string;   // NEW
  brandCategory: string | null;
  logoFile: File | null;  // local file before upload
  coverFile: File | null; // local file before upload
  instagram: string;
  youtube: string;
  tiktok: string;

  // Step 2
  bio: string;
  tags: string[];        // up to 3 -> maps to brandTags
  country: string | null;
  state: string | null;

  // setters
  set<K extends keyof BrandOnboardState>(key: K, value: BrandOnboardState[K]): void;
  reset(): void;
};

export const useBrandOnboard = create<BrandOnboardState>((set) => ({
  brandName: "",
  brandUsername: "",
  phoneNumber: "",
  brandCategory: null,
  logoFile: null,
  coverFile: null,
  instagram: "",
  youtube: "",
  tiktok: "",
  bio: "",
  tags: [],
  country: null,
  state: null,
  set: (key, value) => set({ [key]: value } ),
  reset: () =>
    set({
      brandName: "",
      brandUsername: "",
      phoneNumber: "",
      brandCategory: null,
      logoFile: null,
      coverFile: null,
      instagram: "",
      youtube: "",
      tiktok: "",
      bio: "",
      tags: [],
      country: null,
      state: null,
    }),
}));

/***************************************
 * BrandModel (matches Flutter BrandModel)
 * - Use for persisted brand objects (Firestore/Hive equivalent)
 ***************************************/
import { BrandModel } from "../models/brand"; // Import the model
import { Timestamp } from "firebase/firestore";

// ... (BrandOnboardState definition remains) ...

/***************************************
 * BrandModel (matches Flutter BrandModel)
 * - Use for persisted brand objects (Firestore/Hive equivalent)
 ***************************************/
// Deleted local interface

/***************************************
 * Firestore converters
 * - fromFirestore: any -> BrandModel (handles Timestamp/ISO/Date)
 * - toFirestore: BrandModel -> plain object (with location object)
 ***************************************/

// Helper to check if object is Firestore Timestamp
function isTimestamp(val: any): val is Timestamp {
  return val && typeof val.toDate === "function";
}

export function brandFromFirestore(map: any): BrandModel {
  const createdAtRaw = map?.createdAt;
  const updatedAtRaw = map?.updatedAt;

  const createdAt = isTimestamp(createdAtRaw)
    ? createdAtRaw.toDate()
    : createdAtRaw instanceof Date
    ? createdAtRaw
    : new Date(createdAtRaw ?? Date.now());

  const updatedAt = isTimestamp(updatedAtRaw)
    ? updatedAtRaw.toDate()
    : updatedAtRaw instanceof Date
    ? updatedAtRaw
    : new Date(updatedAtRaw ?? Date.now());

  return {
    uid: String(map?.uid ?? ""),
    brandName: String(map?.brandName ?? ""),
    username: String(map?.username ?? ""),
    phoneNumber: map?.phoneNumber ?? null,
    bio: map?.bio ?? null,
    category: String(map?.category ?? ""),
    brandTags: Array.isArray(map?.brandTags)
      ? map.brandTags.map((e: any) => String(e))
      : null,
    logoUrl: String(map?.logoUrl ?? ""),
    coverImageUrl: map?.coverImageUrl ?? null,
    state: map?.state ?? map?.location?.state ?? null,     // support either shape
    country: map?.country ?? map?.location?.country ?? null,
    createdAt,
    updatedAt,
    heat:
      typeof map?.heat === "number"
        ? map.heat
        : parseInt(String(map?.heat ?? 0), 10) || 0,
    instagram: map?.instagram ?? null,
    youtube: map?.youtube ?? null,
    tiktok: map?.tiktok ?? null,
    subscriptionTier: map?.subscriptionTier ?? "free", // Default to free if missing
    brandSlug: map?.brandSlug ?? undefined,
    
    // New Subscription Fields
    subscriptionId: map?.subscriptionId ?? null,
    subscriptionStatus: map?.subscriptionStatus ?? undefined, // 'undefined' allows clean check
    subscriptionStartedAt: map?.subscriptionStartedAt ?? null, // Expecting Timestamp or null
    subscriptionEndsAt: map?.subscriptionEndsAt ?? null,
    billingCycle: map?.billingCycle ?? null,

    // Acquisition Survey
    acquisitionSurvey: map?.acquisitionSurvey
      ? {
          source: map.acquisitionSurvey.source ?? "",
          subSource: map.acquisitionSurvey.subSource ?? undefined,
          otherDetail: map.acquisitionSurvey.otherDetail ?? undefined,
          skipped: map.acquisitionSurvey.skipped ?? false,
          respondedAt: isTimestamp(map.acquisitionSurvey.respondedAt)
            ? map.acquisitionSurvey.respondedAt.toDate()
            : map.acquisitionSurvey.respondedAt instanceof Date
            ? map.acquisitionSurvey.respondedAt
            : new Date(),
        }
      : null,
  };
}

export function brandToFirestore(model: BrandModel) {
  return {
    uid: model.uid,
    brandName: model.brandName,
    username: model.username,
    brandSlug: model.brandSlug ?? null,
    phoneNumber: model.phoneNumber ?? null,
    bio: model.bio ?? null,
    category: model.category,
    brandTags: model.brandTags ?? null,
    state: model.state ?? null,
    country: model.country ?? null,
    // keep flat copies to mirror Flutter, and also a nested location object
    logoUrl: model.logoUrl,
    coverImageUrl: model.coverImageUrl ?? null,
    location: { state: model.state ?? null, country: model.country ?? null },
    // If you set serverTimestamp() at write time with the SDK, it’ll overwrite these
    createdAt:
      model.createdAt instanceof Date ? model.createdAt.toISOString() : model.createdAt,
    updatedAt:
      model.updatedAt instanceof Date ? model.updatedAt.toISOString() : model.updatedAt,
    heat: model.heat ?? 0,
    instagram: model.instagram ?? null,
    youtube: model.youtube ?? null,
    tiktok: model.tiktok ?? null,
    
    // Subscription Fields
    subscriptionTier: model.subscriptionTier ?? "free",
    subscriptionId: model.subscriptionId ?? null,
    subscriptionStatus: model.subscriptionStatus ?? null,
    subscriptionStartedAt: model.subscriptionStartedAt ?? null,
    subscriptionEndsAt: model.subscriptionEndsAt ?? null,
    billingCycle: model.billingCycle ?? null,

    // Acquisition Survey
    acquisitionSurvey: model.acquisitionSurvey ?? null,
  };
}

/***************************************
 * Builder helpers from onboarding state
 ***************************************/
export function buildNewBrandFromOnboard(
  uid: string,
  s: BrandOnboardState,
  urls: { logoUrl: string; coverImageUrl?: string | null }
): BrandModel {
  const now = new Date();
  return {
    uid,
    brandName: s.brandName.trim(),
    username: s.brandUsername.trim().toLowerCase(),
    phoneNumber: s.phoneNumber.trim() || null,
    bio: s.bio || null,
    category: s.brandCategory || "",
    brandTags: s.tags?.length ? s.tags.slice(0, 3) : null,
    logoUrl: urls.logoUrl,
    coverImageUrl: urls.coverImageUrl ?? null,
    state: s.state || null,
    country: s.country || null,
    createdAt: now,
    updatedAt: now,
    heat: 0,
    instagram: s.instagram || null,
    youtube: s.youtube || null,
    tiktok: s.tiktok || null,
    subscriptionTier: "free",
  };
}

/***************************************
 * Username validation (same as Flutter)
 ***************************************/
export function isValidBrandUsername(u: string): boolean {
  const username = (u ?? "").trim();
  if (username.length < 3 || username.length > 15) return false;
  if (/\s/.test(username)) return false;
  const re = /^[a-zA-Z0-9](?!.*[_.]{2})[a-zA-Z0-9._]{1,13}[a-zA-Z0-9]$/;
  return re.test(username);
}
