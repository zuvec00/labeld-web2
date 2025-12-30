/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

export type Role = "owner" | "manager" | "scanner";

export async function ensureOwnerIfEmpty(eventId: string): Promise<{ seeded: boolean }> {
  const fn = httpsCallable(functions, "ensureEventOwnerIfEmpty");
  const res = await fn({ eventId });
  return (res.data as any) ?? { seeded: false };
}

export interface AddOrganizerResult {
  ok: boolean;
  added?: boolean;
  invited?: boolean;
  userId?: string;
  token?: string;
  email?: string;
}

export async function addOrganizerByEmail(
  eventId: string, 
  email: string, 
  roles: Role[],
  baseUrl?: string
): Promise<AddOrganizerResult> {
  const fn = httpsCallable(functions, "addEventOrganizerByEmail");
  const res = await fn({ eventId, email, roles, baseUrl });
  return (res.data as AddOrganizerResult) ?? { ok: false };
}

export async function listOrganizers(eventId: string) {
  const fn = httpsCallable(functions, "listEventOrganizers");
  const res = await fn({ eventId });
  return ((res.data as any)?.organizers ?? []) as Array<{
    id: string; 
    eventId: string; 
    userId: string; 
    roles: Role[]; 
    invitedBy?: string;
  }>;
}

export async function updateOrganizerRoles(eventId: string, targetUserId: string, roles: Role[]) {
  const fn = httpsCallable(functions, "updateEventOrganizerRoles");
  const res = await fn({ eventId, targetUserId, roles });
  return (res.data as any) ?? {};
}

export async function removeOrganizer(eventId: string, targetUserId: string) {
  const fn = httpsCallable(functions, "removeEventOrganizer");
  const res = await fn({ eventId, targetUserId });
  return (res.data as any) ?? {};
}
