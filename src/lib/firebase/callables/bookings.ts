import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";

export interface UpdateBookingStatusPayload {
  requestId: string;
  status: "approved" | "rejected";
  note?: string;
}

export interface UpdateBookingStatusResult {
  success: boolean;
}

export interface VerifyBookingQrPayload {
  qrString: string;
}

export interface VerifyBookingQrResult {
  success: boolean;
  booking?: {
    id: string;
    guest: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    booking: {
      dateISO: string;
      time: string;
      partySize: number;
      notes?: string;
    };
    checkIn?: {
      code?: string;
      qrString?: string;
      scannedAt?: unknown;
      scannedBy?: string;
    };
    status: string;
  };
}

/**
 * Update booking status (approve/reject) via backend
 */
export async function updateBookingStatusCF(
  payload: UpdateBookingStatusPayload
): Promise<UpdateBookingStatusResult> {
  const callable = httpsCallable(functions, "updateBookingStatus");
  const result = await callable(payload);
  return result.data as UpdateBookingStatusResult;
}

/**
 * Verify booking QR code and retrieve booking details
 */
export async function verifyBookingQrCF(
  payload: VerifyBookingQrPayload
): Promise<VerifyBookingQrResult> {
  const callable = httpsCallable(functions, "verifyBookingQr");
  const result = await callable(payload);
  return result.data as VerifyBookingQrResult;
}
