import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";

/**
 * On-demand withdrawals. Same callables and contract as the mobile wallet
 * service (`wallet_service.dart`): instant Paystack transfer, flat fee, a
 * minimum amount, and one open withdrawal at a time. The server re-validates
 * every request; the checks in the UI only make the button state instant.
 */

export interface WithdrawalPreview {
	eligibleBalanceMinor: number;
	minWithdrawalMinor: number;
	feeMinor: number;
	bankVerified: boolean;
	bank: { bankName?: string; accountNumber?: string } | null;
	/** Present only when an amount was supplied to the preview call. */
	amountRequestedMinor?: number;
	netMinor?: number;
	canWithdraw?: boolean;
	reason?: string;
}

export interface WithdrawalRequestResult {
	requestId: string;
	amountRequestedMinor: number;
	feeMinor: number;
	netMinor: number;
	/** "paid" = transfer already sent; anything else is still being processed. */
	status: string;
}

/** Carries a message that is safe to show to the user. */
export class WithdrawalError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WithdrawalError";
	}
}

function toError(err: unknown, fallback: string): WithdrawalError {
	// Callable errors carry the server's user-facing message in `message`.
	const message = (err as { message?: string } | null)?.message;
	return new WithdrawalError(message?.trim() ? message : fallback);
}

const num = (v: unknown) => Number(v ?? 0) || 0;

export async function getWithdrawalPreview(
	amountMinor?: number,
): Promise<WithdrawalPreview> {
	try {
		const { data } = await httpsCallable<
			{ amountMinor?: number },
			Record<string, any>
		>(
			functions,
			"getWithdrawalPreview",
		)(amountMinor != null ? { amountMinor } : {});

		return {
			eligibleBalanceMinor: num(data.eligibleBalanceMinor),
			minWithdrawalMinor: num(data.minWithdrawalMinor),
			feeMinor: num(data.feeMinor),
			bankVerified: data.bankVerified === true,
			bank:
				data.bank && typeof data.bank === "object"
					? {
							bankName: data.bank.bankName,
							accountNumber: data.bank.accountNumber,
						}
					: null,
			amountRequestedMinor:
				data.amountRequestedMinor != null
					? num(data.amountRequestedMinor)
					: undefined,
			netMinor: data.netMinor != null ? num(data.netMinor) : undefined,
			canWithdraw:
				typeof data.canWithdraw === "boolean" ? data.canWithdraw : undefined,
			reason: typeof data.reason === "string" ? data.reason : undefined,
		};
	} catch (err) {
		throw toError(err, "Could not load withdrawal details.");
	}
}

export async function requestWithdrawal(
	amountMinor: number,
): Promise<WithdrawalRequestResult> {
	try {
		const { data } = await httpsCallable<
			{ amountMinor: number },
			Record<string, any>
		>(
			functions,
			"requestWithdrawal",
		)({ amountMinor });

		return {
			requestId: String(data.requestId ?? ""),
			amountRequestedMinor: num(data.amountRequestedMinor),
			feeMinor: num(data.feeMinor),
			netMinor: num(data.netMinor),
			status: String(data.status ?? "pending"),
		};
	} catch (err) {
		throw toError(err, "Could not submit your withdrawal request.");
	}
}

export async function cancelWithdrawalRequest(
	requestId: string,
): Promise<void> {
	try {
		await httpsCallable<{ requestId: string }, unknown>(
			functions,
			"cancelWithdrawalRequest",
		)({ requestId });
	} catch (err) {
		throw toError(err, "Could not cancel the request.");
	}
}
