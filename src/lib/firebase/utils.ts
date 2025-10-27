// lib/firebase/utils.ts

// Helper to convert Firestore timestamp to number
export function toMillis(v: any): number {
  if (!v) return Date.now();
  if (typeof v === "number") return v;
  if (v.toMillis) return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  return Date.now();
}
