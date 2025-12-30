import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";

const REGION = undefined as string | undefined;
function fx() {
	return getFunctions(app, REGION);
}

export interface InviteDetails {
	eventId: string;
	eventTitle: string;
	roles: string[];
	inviterName: string;
	expiresAt: string;
	email: string; // The email the invite was sent to
}

export interface AcceptInviteResult {
	ok: boolean;
	success: boolean;
	eventId: string;
	eventTitle?: string;
	roles: string[];
}

/**
 * Get invite details for display (unauthenticated)
 */
export async function getEventInviteCF(
	token: string
): Promise<InviteDetails | null> {
	const callable = httpsCallable<{ token: string }, { ok: boolean; invite: InviteDetails }>(
		fx(),
		"getEventInvite"
	);
	try {
		const res = await callable({ token });
		if (res.data?.ok && res.data?.invite) {
			return res.data.invite;
		}
		return null;
	} catch (error) {
		console.error("Error fetching invite:", error);
		throw error;
	}
}

/**
 * Accept an invite (must be authenticated)
 */
export async function acceptEventInviteCF(
	token: string
): Promise<AcceptInviteResult> {
	const callable = httpsCallable<{ token: string }, AcceptInviteResult>(
		fx(),
		"acceptEventInvite"
	);
	const res = await callable({ token });
	return res.data;
}
