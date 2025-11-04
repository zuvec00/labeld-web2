// lib/models/event.schema.ts
import { z } from "zod";

export const eventDetailsSchema = z.object({
  title: z.string().min(3).max(75),
  slug: z.string().min(3),
  description: z.string().min(1).max(2000),
  coverImageURL: z.string().url(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(), // Optional for recurring events
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
  // Recurring event fields (optional for backward compatibility)
  isRecurring: z.boolean().optional().default(false),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
  recurringEndMode: z.enum(["date", "occurrences"]).optional(),
  recurringEndDate: z.coerce.date().optional(),
  recurringEndOccurrences: z.number().int().positive().optional(),
}).refine(d => !d.isRecurring ? (d.endAt ? d.endAt > d.startAt : false) : true, { 
    path: ["endAt"], 
    message: "End time must be after start time" 
  })
  .refine(d => d.isRecurring ? true : (d.endAt ? d.endAt > d.startAt : false), {
    path: ["endAt"],
    message: "End time is required for non-recurring events and must be after start time."
  })
  .refine(d => d.capacityMode === "unlimited" ? d.capacityTotal === null : (d.capacityTotal ?? 0) >= 1, {
    path: ["capacityTotal"], message: "Provide a capacity of at least 1 (or choose Unlimited)."
  })
  .refine(d => !d.isRecurring || d.frequency, {
    path: ["frequency"],
    message: "Please select a frequency for recurring events."
  })
  .refine(d => !d.isRecurring || d.recurringEndMode, {
    path: ["recurringEndMode"],
    message: "Please select how the recurring event should end."
  })
  .refine(d => !d.isRecurring || d.recurringEndMode !== "date" || d.recurringEndDate, {
    path: ["recurringEndDate"],
    message: "Please select an end date for the recurring event."
  })
  .refine(d => !d.isRecurring || d.recurringEndMode !== "occurrences" || (d.recurringEndOccurrences && d.recurringEndOccurrences > 0), {
    path: ["recurringEndOccurrences"],
    message: "Please enter a valid number of occurrences (at least 1)."
  });
