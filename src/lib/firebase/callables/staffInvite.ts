import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";

const REGION = undefined as string | undefined;
function fx() {
	return getFunctions(app, REGION);
}

/** What the public invite page shows before sign-in. */
export interface StaffInvitePreview {
	brandName: string;
	firstName: string;
	roleLabel: string;
	inviterName: string;
	/** The invited email with most of it hidden, e.g. "j***@example.com". */
	emailHint: string;
	expiresAt: string;
}

export interface StaffMembership {
	brandId: string;
	brandName: string;
	logoUrl: string | null;
	roleLabel: string;
	templateId: string | null;
	/** active, suspended, plan_inactive or brand_missing */
	state: string;
}

export interface StaffBrandAccess {
	memberships: StaffMembership[];
	pendingInvites: { token: string; brandName: string; roleLabel: string }[];
}

/**
 * Backend messages for these callables are written for people, so show them as
 * they are. Falls back to a generic line for anything unexpected.
 */
export function staffCallableMessage(err: unknown, fallback: string): string {
	const message =
		err && typeof err === "object" && "message" in err
			? String((err as { message?: unknown }).message ?? "").trim()
			: "";
	return message || fallback;
}

/** Shows an invite before accepting. Public: works without signing in. */
export async function getStaffInviteCF(
	token: string
): Promise<StaffInvitePreview> {
	const callable = httpsCallable<
		{ token: string },
		{ ok: boolean; invite: StaffInvitePreview }
	>(fx(), "getStaffInvite");
	const res = await callable({ token });
	return res.data.invite;
}

/** Accepts the invite as the signed-in person. The email must match. */
export async function acceptStaffInviteCF(
	token: string
): Promise<{ brandId: string; brandName: string; alreadyAccepted: boolean }> {
	const callable = httpsCallable<
		{ token: string },
		{ ok: boolean; brandId: string; brandName: string; alreadyAccepted: boolean }
	>(fx(), "acceptStaffInvite");
	const res = await callable({ token });
	return {
		brandId: res.data.brandId,
		brandName: res.data.brandName,
		alreadyAccepted: Boolean(res.data.alreadyAccepted),
	};
}

/** Turns an invite down. Public: works without signing in. */
export async function declineStaffInviteCF(token: string): Promise<void> {
	const callable = httpsCallable<{ token: string }, { ok: boolean }>(
		fx(),
		"declineStaffInvite"
	);
	await callable({ token });
}

/**
 * The brands the signed-in person works for as staff. Returns no access on any
 * failure, so a lookup problem never blocks anyone.
 */
export async function getMyBrandAccessCF(): Promise<StaffBrandAccess> {
	try {
		const callable = httpsCallable<
			Record<string, never>,
			{ memberships?: StaffMembership[]; pendingInvites?: StaffBrandAccess["pendingInvites"] }
		>(fx(), "getMyBrandAccess");
		const res = await callable({});
		return {
			memberships: Array.isArray(res.data?.memberships)
				? res.data.memberships
				: [],
			pendingInvites: Array.isArray(res.data?.pendingInvites)
				? res.data.pendingInvites
				: [],
		};
	} catch (err) {
		console.warn("getMyBrandAccess failed", err);
		return { memberships: [], pendingInvites: [] };
	}
}
