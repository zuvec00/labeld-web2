// lib/models/event.schema.ts
import { z } from "zod";

export const eventDetailsSchema = z.object({
  title: z.string().min(3).max(75),
  slug: z.string().min(3),
  description: z.string().min(1).max(2000),
  coverImageURL: z.string().url(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  timezone: z.string().min(1),
  venue: z.object({
    name: z.string().min(2),
    address: z.string().min(3),
    city: z.string().optional(),
    state: z.string().min(2),
    country: z.string().min(2),
  }),
  capacityMode: z.enum(["unlimited", "limited"]),
  capacityTotal: z.number().int().positive().nullable(),
  visibility: z.enum(["public", "unlisted"]),
}).refine(d => d.endAt > d.startAt, { path: ["endAt"], message: "End time must be after start time" })
  .refine(d => d.capacityMode === "unlimited" ? d.capacityTotal === null : (d.capacityTotal ?? 0) >= 1, {
    path: ["capacityTotal"], message: "Provide a capacity of at least 1 (or choose Unlimited)."
  });
