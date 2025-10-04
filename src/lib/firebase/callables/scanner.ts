import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";

export interface ScanSession {
  eventId: string;
  userId: string;
  deviceInfo?: Record<string, unknown>;
  startedAt: unknown;
  endedAt?: unknown;
  counts?: {
    accepted: number;
    rejected_duplicate: number;
    rejected_invalid: number;
  };
}

export interface TicketLookupResult {
  status: "ok" | "not_found" | "event_mismatch";
  ticket?: {
    id: string;
    ticketCode: string;
    ticketTypeId: string;
    status: "valid" | "used" | "refunded" | "revoked";
    ownerUserId: string | null;
    qrString?: string;
  };
  event?: {
    id: string;
    name?: string;
    startAt?: unknown;
    venue?: Record<string, unknown>;
  };
  ownerHint?: {
    emailMasked?: string;
    phoneMasked?: string;
  };
}

export interface VerifyTicketResult {
  success: boolean;
  ticket?: {
    id: string;
    ticketCode: string;
    ticketTypeId: string;
    ownerUserId: string | null;
  };
}

/**
 * Start a new scan session
 */
export async function startScanSession(eventId: string, deviceInfo?: Record<string, unknown>): Promise<{ ok: boolean; sessionId: string }> {
  const startSession = httpsCallable(functions, "startScanSession");
  const result = await startSession({ eventId, deviceInfo });
  return result.data as { ok: boolean; sessionId: string };
}

/**
 * End a scan session
 */
export async function endScanSession(sessionId: string): Promise<{ ok: boolean }> {
  const endSession = httpsCallable(functions, "endScanSession");
  const result = await endSession({ sessionId });
  return result.data as { ok: boolean };
}

/**
 * Verify and use a ticket from QR code
 */
export async function verifyAndUseTicket(
  qrString: string,
  eventId: string,
  deviceInfo?: Record<string, unknown>,
  sessionId?: string
): Promise<VerifyTicketResult> {
  const verifyTicket = httpsCallable(functions, "verifyAndUseTicket");
  const result = await verifyTicket({ qrString, eventId, deviceInfo, sessionId });
  return result.data as VerifyTicketResult;
}

/**
 * Lookup ticket by code or ID for manual entry
 */
export async function lookupTicket(
  eventId: string,
  codeOrTicketId: string
): Promise<TicketLookupResult> {
  const lookup = httpsCallable(functions, "lookupTicket");
  const result = await lookup({ eventId, codeOrTicketId });
  return result.data as TicketLookupResult;
}
