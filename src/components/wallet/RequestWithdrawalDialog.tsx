// components/wallet/RequestWithdrawalDialog.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Landmark } from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/wallet/mock";
import {
	getWithdrawalPreview,
	requestWithdrawal,
	type WithdrawalPreview,
	type WithdrawalRequestResult,
} from "@/lib/firebase/callables/withdrawals";
import { DialogFrame } from "./AddBankAccountDialog";

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * On-demand withdrawal. Laid out like mobile's RequestWithdrawalSheet (title,
 * "Available", amount, fee, "You'll receive", bank line, one primary action)
 * and built from the same pieces as AddBankAccountDialog: DialogFrame, the red
 * error box, a right-aligned bordered footer, and a centered success state.
 * The wallet screen is realtime, so the balance updates on its own afterwards.
 */
export default function RequestWithdrawalDialog({ isOpen, onClose }: Props) {
	const [preview, setPreview] = useState<WithdrawalPreview | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	const [amountNaira, setAmountNaira] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [result, setResult] = useState<WithdrawalRequestResult | null>(null);

	const loadPreview = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		try {
			setPreview(await getWithdrawalPreview());
		} catch (e) {
			setLoadError(
				e instanceof Error ? e.message : "Could not load withdrawal details.",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	// Fresh preview every time the dialog opens; clear everything when it closes
	useEffect(() => {
		if (isOpen) {
			loadPreview();
		} else {
			setPreview(null);
			setLoadError(null);
			setAmountNaira("");
			setSubmitError(null);
			setResult(null);
			setSubmitting(false);
		}
	}, [isOpen, loadPreview]);

	if (!isOpen) return null;

	const amountMinor = (parseInt(amountNaira, 10) || 0) * 100;

	// Mirrors the backend so the button state is instant; the server re-checks.
	const validationReason = (): string | null => {
		if (!preview) return null;
		if (!preview.bankVerified) return "Add and verify a bank account first.";
		if (amountMinor <= 0) return null; // nothing entered yet
		if (amountMinor < preview.minWithdrawalMinor) {
			return `Minimum withdrawal is ${formatCurrency(preview.minWithdrawalMinor)}.`;
		}
		if (amountMinor > preview.eligibleBalanceMinor) {
			return "Amount exceeds your available balance.";
		}
		if (amountMinor - preview.feeMinor <= 0) {
			return "Amount must be greater than the fee.";
		}
		return null;
	};

	const reason = validationReason();
	const canSubmit =
		!!preview &&
		preview.bankVerified &&
		amountMinor >= preview.minWithdrawalMinor &&
		amountMinor <= preview.eligibleBalanceMinor &&
		amountMinor - preview.feeMinor > 0 &&
		!submitting;

	const net =
		preview && amountMinor > preview.feeMinor ? amountMinor - preview.feeMinor : 0;

	const handleSubmit = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		setSubmitError(null);
		try {
			setResult(await requestWithdrawal(amountMinor));
		} catch (e) {
			setSubmitError(e instanceof Error ? e.message : "Request failed.");
		} finally {
			setSubmitting(false);
		}
	};

	// ---- Success (same shape as AddBankAccountDialog's success step) ----
	if (result) {
		return (
			<DialogFrame title="Request Withdrawal" onClose={onClose} className="max-w-md">
				<div className="space-y-6">
					<div className="text-center py-8">
						<div className="flex flex-col items-center gap-4">
							<div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
								<CheckCircle className="w-8 h-8 text-accent" />
							</div>
							<div>
								<h3 className="font-medium text-lg mb-2">
									{result.status === "paid"
										? "Withdrawal sent!"
										: "Withdrawal requested"}
								</h3>
								<p className="text-text-muted text-sm mb-4">
									{result.status === "paid"
										? "It's on its way to your bank account."
										: "It will be processed shortly."}
								</p>
								<div className="bg-surface border border-stroke rounded-xl p-4 text-left space-y-2">
									<Row
										label="Amount"
										value={formatCurrency(result.amountRequestedMinor)}
									/>
									<Row label="Fee" value={`- ${formatCurrency(result.feeMinor)}`} />
									<Row
										label="You'll receive"
										value={formatCurrency(result.netMinor)}
										emphasize
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 pt-4 border-t border-stroke">
						<Button variant="primary" text="Done" onClick={onClose} />
					</div>
				</div>
			</DialogFrame>
		);
	}

	// ---- Form ----
	return (
		<DialogFrame title="Request Withdrawal" onClose={onClose} className="max-w-md">
			<div className="space-y-6">
				{/* Error Display */}
				{(loadError || submitError) && (
					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
						<div className="flex items-center gap-2 text-red-400">
							<AlertCircle className="w-4 h-4" />
							<span className="text-sm">{loadError || submitError}</span>
						</div>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Spinner size="md" />
					</div>
				) : preview ? (
					<div className="space-y-4">
						<p className="text-sm text-text-muted">
							Available:{" "}
							<span className="font-medium text-text">
								{formatCurrency(preview.eligibleBalanceMinor)}
							</span>
						</p>

						{!preview.bankVerified ? (
							<div className="flex items-start gap-3 bg-surface border border-stroke rounded-xl p-4">
								<Landmark className="w-5 h-5 mt-0.5 text-text-muted flex-shrink-0" />
								<p className="text-sm text-text-muted">
									Add and verify a bank account before you can withdraw. You can
									do that from the banner on the wallet page.
								</p>
							</div>
						) : (
							<>
								<div>
									<label
										htmlFor="withdraw-amount"
										className="block text-sm font-medium mb-2"
									>
										Amount <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
											₦
										</span>
										<Input
											id="withdraw-amount"
											type="text"
											inputMode="numeric"
											autoFocus
											value={amountNaira}
											onChange={(e) =>
												setAmountNaira(e.target.value.replace(/\D/g, ""))
											}
											placeholder="0"
											disabled={submitting}
											className="pl-9 text-xl font-semibold disabled:opacity-50"
										/>
									</div>
									<button
										type="button"
										onClick={() =>
											setAmountNaira(
												String(Math.floor(preview.eligibleBalanceMinor / 100)),
											)
										}
										disabled={submitting}
										className="text-xs font-medium text-cta hover:underline mt-2 disabled:opacity-50"
									>
										Withdraw all
									</button>
								</div>

								<div className="space-y-2 text-sm">
									<Row label="Fee" value={`- ${formatCurrency(preview.feeMinor)}`} />
									<Row
										label="You'll receive"
										value={formatCurrency(net)}
										emphasize
									/>
								</div>

								{reason && <p className="text-sm text-red-400">{reason}</p>}

								{preview.bank?.bankName && (
									<p className="text-xs text-text-muted">
										To {preview.bank.bankName} ••••
										{(preview.bank.accountNumber ?? "").slice(-4)}
									</p>
								)}
							</>
						)}
					</div>
				) : null}

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 pt-4 border-t border-stroke">
					<Button
						variant="outline"
						text="Cancel"
						onClick={onClose}
						disabled={submitting}
					/>
					{loadError && !preview ? (
						<Button variant="primary" text="Retry" onClick={loadPreview} />
					) : (
						<Button
							variant={canSubmit ? "primary" : "disabled"}
							text={submitting ? "Sending..." : "Request Withdrawal"}
							onClick={handleSubmit}
							disabled={!canSubmit}
						/>
					)}
				</div>
			</div>
		</DialogFrame>
	);
}

function Row({
	label,
	value,
	emphasize = false,
}: {
	label: string;
	value: string;
	emphasize?: boolean;
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-text-muted">{label}</span>
			<span className={emphasize ? "font-bold text-text" : "font-medium text-text"}>
				{value}
			</span>
		</div>
	);
}
