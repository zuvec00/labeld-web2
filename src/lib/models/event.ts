// lib/models/Event.ts
export type EventVisibility = "public" | "unlisted";

export interface EventModel {
  id?: string;
  title: string;
  slug: string;
  description: string;
  coverImageURL: string;
  startAt: Date;        // store as Firestore Timestamp on write
  endAt?: Date;         // Optional for recurring events
  timezone: string;     // e.g. "Africa/Lagos"
  status: "draft" | "published" | "cancelled" | "ended";
  venue: { name: string; address: string; city?: string; state: string; country: string };
  capacityMode: "unlimited" | "limited";
  capacityTotal: number | null;  // null when unlimited
  visibility: EventVisibility;
  // Recurring event fields (optional for backward compatibility)
  isRecurring?: boolean;
  frequency?: "daily" | "weekly" | "biweekly" | "monthly";
  recurringEndMode?: "date" | "occurrences";
  recurringEndDate?: Date;
  recurringEndOccurrences?: number;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}
