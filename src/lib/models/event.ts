// lib/models/Event.ts
export type EventVisibility = "public" | "unlisted";

export interface EventModel {
  id?: string;
  title: string;
  slug: string;
  description: string;
  coverImageURL: string;
  startAt: Date;        // store as Firestore Timestamp on write
  endAt: Date;
  timezone: string;     // e.g. "Africa/Lagos"
  status: "draft" | "published" | "cancelled" | "ended";
  venue: { name: string; address: string; city?: string; state: string; country: string };
  capacityMode: "unlimited" | "limited";
  capacityTotal: number | null;  // null when unlimited
  visibility: EventVisibility;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}
