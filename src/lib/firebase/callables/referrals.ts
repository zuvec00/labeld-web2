import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

export type ReferralCodeCheck = {
	valid: boolean;
	discountPercent?: number;
	message: string;
};

/** Canonical form the backend expects: upper-case letters and digits only. */
export function normalizeReferralCode(raw: string): string {
	return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Checks a code while the brand is still typing it. Works before the visitor
 * has an account (the web signup collects brand details before auth).
 * Throws only on a network/server failure; an unknown or expired code comes
 * back as `valid: false` with a message to show.
 */
export async function validateReferralCodeCF(
	code: string,
): Promise<ReferralCodeCheck> {
	const callable = httpsCallable(getFunctions(getApp()), "validateReferralCode");
	const { data } = await callable({ code: normalizeReferralCode(code) });
	const d = data as Partial<ReferralCodeCheck>;
	return {
		valid: d.valid === true,
		discountPercent: d.discountPercent,
		message: d.message ?? "",
	};
}

const TRANSIENT = new Set(["unavailable", "deadline-exceeded", "internal"]);

/**
 * Locks the new brand's attribution to `code`. Call right after the brand is
 * created. Retries transient failures so a flaky connection at the end of
 * onboarding doesn't silently lose the ambassador's referral.
 *
 * Never throws: returns null on success, or a message to show the brand.
 */
export async function attachReferralCodeCF(code: string): Promise<string | null> {
	const callable = httpsCallable(getFunctions(getApp()), "attachReferralCode");
	const maxAttempts = 3;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			await callable({ code: normalizeReferralCode(code) });
			return null;
		} catch (e) {
			const err = e as { code?: string; message?: string };
			const transient = TRANSIENT.has((err.code ?? "").replace("functions/", ""));
			if (transient && attempt < maxAttempts) {
				await new Promise((r) => setTimeout(r, 600 * attempt));
				continue;
			}
			console.error("attachReferralCode failed", err);
			return err.message || "Could not apply your referral code.";
		}
	}
	return "Could not apply your referral code.";
}

export type ReferralOffer = {
	/** The brand signed up with an ambassador's code (hide the free promo). */
	hasReferral: boolean;
	/** This checkout will actually take the discount off the first payment. */
	eligible: boolean;
	discountPercent: number | null;
};

/**
 * Asks the server what the pricing page should show this brand. The discount
 * only exists when the program is switched on and the brand qualifies, so the
 * page must never promise it on its own. Returns null on any failure, which
 * leaves the pricing page exactly as it is without referrals.
 */
export async function getReferralOfferCF(isLive: boolean): Promise<ReferralOffer | null> {
	try {
		const callable = httpsCallable(getFunctions(getApp()), "getReferralOffer");
		const { data } = await callable({ isLive });
		const d = data as Partial<ReferralOffer>;
		return {
			hasReferral: d.hasReferral === true,
			eligible: d.eligible === true,
			discountPercent: typeof d.discountPercent === "number" ? d.discountPercent : null,
		};
	} catch {
		return null;
	}
}
