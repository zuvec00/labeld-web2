// src/lib/models/moment.ts
export type MomentType = "image" | "video" | "text";

export type MomentDoc = {
  id: string;
  eventId: string;
  authorUserId: string;
  type: MomentType;
  mediaURL?: string;
  thumbURL?: string;
  text?: string;
  likeCount?: number;
  commentCount?: number;
  visibility: "attendeesOnly" | "public";
  createdAt: Date;
  reported?: boolean;
};
