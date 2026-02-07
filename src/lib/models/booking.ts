// lib/models/booking.ts
import { Timestamp } from "firebase/firestore";

// Booking status enumeration
export type BookingStatus = 
  | "pending" 
  | "approved" 
  | "declined" 
  | "checked_in" 
  | "cancelled";

// Guest information
export interface BookingGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Booking details
export interface BookingDetails {
  dateISO: string; // YYYY-MM-DD
  time: string; // HH:MM (24-hour format)
  partySize: number;
  minimumSpend?: number;
  notes?: string;
}

// Internal notes and approval tracking
export interface BookingInternal {
  note?: string;
  approvedAt?: string; // ISO timestamp
  approvedBy?: string; // User ID who approved
  declinedAt?: string;
  declinedBy?: string;
}

// Check-in information
export interface BookingCheckIn {
  code?: string; // QR code value
  checkedInAt?: string; // ISO timestamp
  checkedInBy?: string; // Staff member who checked in
}

// Complete booking request
export interface BookingRequest {
  id: string;
  organizerId: string;
  status: BookingStatus;
  guest: BookingGuest;
  booking: BookingDetails;
  internal?: BookingInternal;
  checkIn?: BookingCheckIn;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Day of week type
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

// Opening hours for a single day
export interface DayHours {
  open: string; // HH:MM
  close: string; // HH:MM
  enabled: boolean;
}

// Weekly opening hours
export type OpeningHours = {
  [K in DayOfWeek]?: DayHours;
};

// Slot interval options
export type SlotInterval = 30 | 60 | 90;

// Booking settings for an organizer
export interface BookingSettings {
  organizerId: string;
  acceptBookings: boolean;
  timezone?: string; // e.g., "America/New_York"
  openingHours: OpeningHours;
  slotIntervalMinutes: SlotInterval;
  maxBookingsPerSlot: number;
  maxPartySize: number;
  minLeadTimeMinutes: number; // Minimum advance booking time
  maxAdvanceDays: number; // How far in advance bookings can be made
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

// Default booking settings
export const DEFAULT_BOOKING_SETTINGS: Omit<BookingSettings, "organizerId"> = {
  acceptBookings: true,
  timezone: " West Africa Time (WAT)",
  openingHours: {
    mon: { open: "09:00", close: "22:00", enabled: true },
    tue: { open: "09:00", close: "22:00", enabled: true },
    wed: { open: "09:00", close: "22:00", enabled: true },
    thu: { open: "09:00", close: "22:00", enabled: true },
    fri: { open: "09:00", close: "22:00", enabled: true },
    sat: { open: "10:00", close: "23:00", enabled: true },
    sun: { open: "10:00", close: "21:00", enabled: false },
  },
  slotIntervalMinutes: 60,
  maxBookingsPerSlot: 5,
  maxPartySize: 12,
  minLeadTimeMinutes: 120, // 2 hours
  maxAdvanceDays: 90, // 3 months
};

// Helper to get full guest name
export function getGuestFullName(guest: BookingGuest): string {
  return `${guest.firstName} ${guest.lastName}`.trim();
}

// Helper to format booking date/time
export function formatBookingDateTime(booking: BookingDetails): string {
  return `${booking.dateISO} at ${booking.time}`;
}

// Helper to generate check-in code
export function generateCheckInCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding confusing chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to get status color class
export function getStatusColorClass(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-stroke text-text-muted";
    case "approved":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "declined":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "checked_in":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    case "cancelled":
      return "bg-stroke text-text-muted";
    default:
      return "bg-stroke text-text-muted";
  }
}

// Helper to get status display label
export function getStatusLabel(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "declined":
      return "Declined";
    case "checked_in":
      return "Checked In";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}
