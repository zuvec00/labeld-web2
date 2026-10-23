import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";
import { shouldUseLiveSubscriptionPayments } from "@/lib/payment/subscriptionMode";

/**
 * Pro subscription management: retry a failed renewal, cancel/resume renewal,
 * and the cancel "save flow". Same callables and payloads as the mobile
 * `SubscriptionCheckoutService`. The server owns the rules; the optional flow
 * fields only feed the cancellation log and never block a cancel.
 */

// Values are stored by the backend (functions/src/brands/cancelFlow.rules.ts).
export type CancelReason =
	| "budget"
	| "no_sales"
	| "not_using"
	| "break"
	| "missing_or_switching"
	| "other";

export type SwitchingTo =
	| "shopify"
	| "bumpa"
	| "social_only"
	| "another_platform";

export type OfferShown =
	| "none"
	| "help_call"
	| "feature_tour"
	| "feedback_board"
	| "retention_discount";

export interface CancelFlowFields {
	reason?: CancelReason | null;
	switchingTo?: SwitchingTo | null;
	offerShown?: OfferShown | null;
	otherText?: string | null;
}

const isLive = () => shouldUseLiveSubscriptionPayments();

/** Only send the fields that make sense, exactly like mobile `_flowFields`. */
function flowFields(f: CancelFlowFields = {}): Record<string, string> {
	const out: Record<string, string> = {};
	if (f.reason) out.reason = f.reason;
	if (f.switchingTo && f.reason === "missing_or_switching") {
		out.switchingTo = f.switchingTo;
	}
	if (f.offerShown) out.offerShown = f.offerShown;
	if (f.reason === "other" && f.otherText?.trim()) {
		out.otherText = f.otherText.trim();
	}
	return out;
}

const num = (v: unknown) => (typeof v === "number" ? Math.trunc(v) : 0);

// ---------------------------------------------------------------- retry

export interface RetryPaymentResult {
	ok: boolean;
	code: string;
	message: string;
	/** No saved card: retrying can never work, a fresh subscription is needed. */
	needsNewSubscription: boolean;
}

/**
 * Charges the card already on file to recover a failed renewal. A decline is a
 * normal outcome and comes back as `ok: false` with a message, not a throw.
 */
export async function retryProSubscriptionCharge(): Promise<RetryPaymentResult> {
	const { data } = await httpsCallable<{ isLive: boolean }, Record<string, any>>(
		functions,
		"retryProSubscriptionCharge",
	)({ isLive: isLive() });
	const code = String(data.code ?? "error");
	return {
		ok: data.ok === true,
		code,
		message: String(data.message ?? "Something went wrong."),
		needsNewSubscription: code === "no_saved_card" || code === "no_subscription",
	};
}

// --------------------------------------------------------- cancel / resume

export interface CancelResult {
	success: boolean;
	alreadyCancelled: boolean;
	/** ISO date Pro stays active until. */
	subscriptionEndsAt?: string;
}

/** Cancels the renewal. Pro stays active until the paid period ends. */
export async function cancelBrandProSubscription(
	flow?: CancelFlowFields,
): Promise<CancelResult> {
	const { data } = await httpsCallable<Record<string, unknown>, Record<string, any>>(
		functions,
		"cancelBrandProSubscription",
	)({ isLive: isLive(), ...flowFields(flow) });
	return {
		success: data.success === true,
		alreadyCancelled: data.alreadyCancelled === true,
		subscriptionEndsAt: data.subscriptionEndsAt
			? String(data.subscriptionEndsAt)
			: undefined,
	};
}

export interface ResumeResult {
	success: boolean;
	alreadyActive: boolean;
	subscriptionEndsAt?: string;
}

/** Switches a cancelled renewal back on while still inside the paid period. */
export async function resumeBrandProSubscription(): Promise<ResumeResult> {
	const { data } = await httpsCallable<{ isLive: boolean }, Record<string, any>>(
		functions,
		"resumeBrandProSubscription",
	)({ isLive: isLive() });
	return {
		success: data.success === true,
		alreadyActive: data.alreadyActive === true,
		subscriptionEndsAt: data.subscriptionEndsAt
			? String(data.subscriptionEndsAt)
			: undefined,
	};
}

// -------------------------------------------------------------- save flow

/**
 * Logs that the brand left the flow without cancelling ("saved" = kept Pro
 * after seeing the matched screen, "abandoned" = closed it). Best effort: never
 * throws and never blocks the UI.
 */
export async function recordCancellationFlow(
	saved: boolean,
	flow?: CancelFlowFields,
): Promise<void> {
	try {
		await httpsCallable(
			functions,
			"recordCancellationFlow",
			{ timeout: 8000 },
		)({ outcome: saved ? "saved" : "abandoned", ...flowFields(flow) });
	} catch {
		// Logging must never get in the way of the brand.
	}
}

export interface CancellationSaveContext {
	freeProductLimit: number;
	activeProductCount: number;
	productsOverLimit: number;
	feeSavedMinor: number;
	feeSavedSince: Date | null;
	hasCustomDomain: boolean;
}

/** The brand's own numbers for "what you'd lose", or null if unavailable. */
export async function getCancellationSaveContext(): Promise<CancellationSaveContext | null> {
	try {
		const { data } = await httpsCallable<unknown, Record<string, any>>(
			functions,
			"getCancellationSaveContext",
			{ timeout: 8000 },
		)();
		const since = data.feeSavedSince ? new Date(String(data.feeSavedSince)) : null;
		return {
			freeProductLimit: num(data.freeProductLimit) || 12,
			activeProductCount: num(data.activeProductCount),
			productsOverLimit: num(data.productsOverLimit),
			feeSavedMinor: num(data.feeSavedMinor),
			feeSavedSince: since && !isNaN(since.getTime()) ? since : null,
			hasCustomDomain: data.hasCustomDomain === true,
		};
	} catch {
		return null;
	}
}

export interface RetentionOffer {
	percent: number;
	fullKobo: number;
	payKobo: number;
	discountKobo: number;
	currentPeriodEndsAt: Date;
	/** Paid-until date after accepting; full price resumes then. */
	extendedUntil: Date;
}

/**
 * The server-priced one-month retention discount for a brand that said
 * "budget", or null (no offer, or it could not be loaded quickly). Read-only;
 * the UI only displays what the server priced.
 */
export async function getRetentionOffer(): Promise<RetentionOffer | null> {
	try {
		const { data } = await httpsCallable<{ reason: CancelReason }, Record<string, any>>(
			functions,
			"getRetentionOffer",
			{ timeout: 8000 },
		)({ reason: "budget" });
		if (data.eligible !== true) return null;
		const current = new Date(String(data.currentPeriodEndsAt ?? ""));
		const extended = new Date(String(data.extendedUntil ?? ""));
		const pay = num(data.payKobo);
		const full = num(data.fullKobo);
		const discount = num(data.discountKobo);
		if (isNaN(current.getTime()) || isNaN(extended.getTime())) return null;
		if (pay <= 0 || full <= pay || discount <= 0) return null;
		return {
			percent: num(data.percent),
			fullKobo: full,
			payKobo: pay,
			discountKobo: discount,
			currentPeriodEndsAt: current,
			extendedUntil: extended,
		};
	} catch {
		return null;
	}
}

export interface AcceptOfferResult {
	/** False means "payment taken, finishing in the background". */
	completed: boolean;
	payKobo: number;
	extendedUntil: Date | null;
}

/**
 * Accepts the retention discount: charges the saved card and switches the
 * subscription. Throws with a user-facing message on a decline or when the
 * offer is no longer available.
 */
export async function acceptRetentionOffer(): Promise<AcceptOfferResult> {
	const { data } = await httpsCallable<{ isLive: boolean }, Record<string, any>>(
		functions,
		"acceptRetentionOffer",
		{ timeout: 120000 },
	)({ isLive: isLive() });
	const until = data.extendedUntil ? new Date(String(data.extendedUntil)) : null;
	return {
		completed: data.completed === true,
		payKobo: num(data.payKobo),
		extendedUntil: until && !isNaN(until.getTime()) ? until : null,
	};
}
