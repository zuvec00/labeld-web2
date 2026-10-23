"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import {
	normalizeReferralCode,
	validateReferralCodeCF,
} from "@/lib/firebase/callables/referrals";

type Status = "idle" | "checking" | "valid" | "invalid" | "error";

/**
 * Optional ambassador referral code, collected at brand signup (the contract
 * only attributes a brand that signs up with the code). Validates as the brand
 * types and publishes `referralOk` to the onboarding store, so the step can
 * stay blocked while a typed code is unchecked or wrong. A typo then never
 * silently costs the brand its discount.
 *
 * `variant="underline"` matches the borderless fields in the /onboarding flow.
 */
export default function ReferralCodeField({
	variant = "boxed",
}: {
	variant?: "boxed" | "underline";
}) {
	const { referralCode, set } = useBrandOnboard();
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState("");
	const checkId = useRef(0);

	// Re-check on mount (a code may already be in the store from an earlier
	// step) and whenever the code changes.
	useEffect(() => {
		const code = referralCode;
		const id = ++checkId.current;

		if (!code) {
			setStatus("idle");
			setMessage("");
			set("referralOk", true);
			return;
		}

		set("referralOk", false);
		setStatus("checking");
		setMessage("");

		const timer = setTimeout(async () => {
			try {
				const check = await validateReferralCodeCF(code);
				if (id !== checkId.current) return;
				setStatus(check.valid ? "valid" : "invalid");
				setMessage(check.message);
				set("referralOk", check.valid);
			} catch {
				if (id !== checkId.current) return;
				setStatus("error");
				setMessage(
					"Couldn't check this code. Check your connection or clear it.",
				);
				set("referralOk", false);
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [referralCode, set]);

	const inputClass =
		variant === "underline"
			? `w-full bg-transparent border-b-2 text-xl font-medium py-2 pr-8 outline-none placeholder:text-subtle transition-colors uppercase ${
					status === "valid"
						? "border-green-500/50 focus:border-green-500"
						: status === "invalid" || status === "error"
							? "border-red-500/50 focus:border-red-500"
							: "border-stroke focus:border-accent"
				}`
			: `w-full rounded-xl border px-4 py-3 pr-10 text-text placeholder:text-text-muted outline-none uppercase ${
					status === "valid"
						? "border-green-500/60"
						: status === "invalid" || status === "error"
							? "border-alert"
							: "border-stroke focus:border-accent"
				}`;

	return (
		<div className={variant === "underline" ? "space-y-2" : ""}>
			<label
				className={
					variant === "underline"
						? "text-sm font-medium text-text-muted uppercase tracking-wider"
						: "block text-sm text-text-muted mb-1"
				}
			>
				Referral code{" "}
				<span className="normal-case tracking-normal text-text-muted">
					(optional)
				</span>
			</label>
			<div className="relative">
				<input
					value={referralCode}
					onChange={(e) =>
						set("referralCode", normalizeReferralCode(e.target.value).slice(0, 20))
					}
					placeholder="e.g. AMBASSADOR20"
					autoComplete="off"
					autoCapitalize="characters"
					spellCheck={false}
					className={inputClass}
				/>
				<div className="absolute right-3 top-1/2 -translate-y-1/2">
					{status === "checking" && (
						<Loader2 className="w-4 h-4 text-text-muted animate-spin" />
					)}
					{status === "valid" && <Check className="w-4 h-4 text-green-500" />}
					{(status === "invalid" || status === "error") && (
						<X className="w-4 h-4 text-red-500" />
					)}
				</div>
			</div>
			{status === "checking" && (
				<p className="mt-2 text-xs text-text-muted">Checking code…</p>
			)}
			{message && status !== "checking" && (
				<p
					className={`mt-2 text-xs ${
						status === "valid" ? "text-green-500" : "text-alert"
					}`}
				>
					{message}
				</p>
			)}
		</div>
	);
}
