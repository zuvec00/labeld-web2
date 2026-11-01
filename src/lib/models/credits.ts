/**
 * Studio credits. Three separate allowances that are never combined (same as the
 * mobile Studio Credits screen):
 * - AI generations: monthly allowance that resets on the 1st
 * - Background removals: one-time allowance plus any purchased credits
 * - Messaging credits: bought in top-ups, one per recipient
 */

/** brands/{brandId}.credits: messaging credits. */
export interface BrandCredits {
	balance: number;
	totalUsed: number;
	updatedAt: Date | null;
}

export type CreditTransactionType = "purchase" | "usage" | "refund";

export interface CreditTransaction {
	id: string;
	brandId: string;
	type: CreditTransactionType;
	/** Positive for purchases/refunds, negative for usage. */
	amount: number;
	balanceAfter: number;
	description: string;
	metadata?: Record<string, unknown> | null;
	createdAt: Date | null;
}

/** users/{uid}/usage/ai_generation */
export interface AiUsage {
	count: number;
	/** e.g. "2026-10"; the allowance is per calendar month. */
	month: string;
	subscriptionTier: string;
	lastCheckedTier: Date | null;
}

/** users/{uid}/usage/bg_removal */
export interface BgRemovalUsage {
	freeAllowanceGranted: number;
	freeAllowanceUsed: number;
	purchasedCredits: number;
	subscriptionTier: string;
	lastCheckedTier: Date | null;
}

export const AI_MONTHLY_LIMIT_FREE = 50;
export const AI_MONTHLY_LIMIT_PRO = 300;
/** Used only until the backend has written the allowance document. */
export const BG_REMOVAL_DEFAULT_FREE = 10;
export const BG_REMOVAL_DEFAULT_PRO = 30;

export const aiLimit = (isPro: boolean) =>
	isPro ? AI_MONTHLY_LIMIT_PRO : AI_MONTHLY_LIMIT_FREE;

export const bgRemovalTotal = (u: BgRemovalUsage | null, isPro: boolean) =>
	u
		? u.freeAllowanceGranted + u.purchasedCredits
		: isPro
			? BG_REMOVAL_DEFAULT_PRO
			: BG_REMOVAL_DEFAULT_FREE;

export const bgRemovalRemaining = (u: BgRemovalUsage | null, isPro: boolean) =>
	u
		? u.freeAllowanceGranted - u.freeAllowanceUsed + u.purchasedCredits
		: bgRemovalTotal(null, isPro);
