import type { WalletLedgerEntry, WithdrawalLineStatus } from "@/types/wallet";

/**
 * A withdrawal writes several ledger rows (a hold, then a payout or a release).
 * They are tied together by `orderRef.id` starting with "withdrawal_". Mobile
 * shows them as a single "Withdrawal" line with a status; this is the same
 * logic as `collapseWithdrawals` in the mobile wallet model.
 */
export function withdrawalKey(entry: WalletLedgerEntry): string | null {
	const id = entry.orderRef?.id;
	return typeof id === "string" && id.startsWith("withdrawal_") ? id : null;
}

/** True for any row that belongs to a withdrawal (hold, payout or release). */
export function isWithdrawalEntry(entry: WalletLedgerEntry): boolean {
	return withdrawalKey(entry) !== null;
}

/**
 * Folds each withdrawal's rows into one entry carrying `withdrawalStatus`:
 * - a release exists  -> "cancelled" if its note says so, otherwise "reversed"
 * - a payout exists   -> "successful"
 * - otherwise         -> "pending"
 * The folded row sits where the first row of that withdrawal was, and is based
 * on the hold row (the amount the brand asked for) when there is one.
 */
export function collapseWithdrawals(
	entries: WalletLedgerEntry[],
): WalletLedgerEntry[] {
	const groups = new Map<string, WalletLedgerEntry[]>();
	for (const e of entries) {
		const key = withdrawalKey(e);
		if (key) groups.set(key, [...(groups.get(key) ?? []), e]);
	}

	const result: WalletLedgerEntry[] = [];
	const emitted = new Set<string>();
	for (const e of entries) {
		const key = withdrawalKey(e);
		if (!key) {
			result.push(e);
			continue;
		}
		if (emitted.has(key)) continue;
		emitted.add(key);

		const group = groups.get(key)!;
		const base =
			group.find((g) => g.type === "debit_hold") ?? group[group.length - 1];
		const releases = group.filter((g) => g.type === "credit_release");
		const paid = group.some((g) => g.type === "debit_payout");

		let status: WithdrawalLineStatus;
		if (releases.length > 0) {
			const cancelled = releases.some((r) =>
				(r.note ?? "").toLowerCase().includes("cancelled"),
			);
			status = cancelled ? "cancelled" : "reversed";
		} else if (paid) {
			status = "successful";
		} else {
			status = "pending";
		}
		result.push({ ...base, withdrawalStatus: status });
	}
	return result;
}

/** Chip text and colour classes for a withdrawal line (labels match mobile). */
export function withdrawalBadge(status: WithdrawalLineStatus): {
	label: string;
	className: string;
} {
	switch (status) {
		case "successful":
			return { label: "Successful", className: "text-accent bg-accent/10" };
		case "reversed":
			return { label: "Failed · Reversed", className: "text-alert bg-alert/10" };
		case "cancelled":
			return { label: "Cancelled", className: "text-text-muted bg-stroke" };
		default:
			return { label: "Pending", className: "text-edit bg-edit/10" };
	}
}
