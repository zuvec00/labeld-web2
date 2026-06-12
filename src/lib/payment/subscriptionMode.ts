"use client";

export function shouldUseLiveSubscriptionPayments(): boolean {
	const mode = process.env.NEXT_PUBLIC_SUBSCRIPTION_PAYMENTS_MODE;

	if (mode === "live") return true;
	if (mode === "test") return false;

	return process.env.NODE_ENV === "production";
}
