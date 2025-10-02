// components/wallet/AddBankAccountDialog.tsx
"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBankAccount, BankAccountData } from "@/hooks/useBankAccount";
import { Bank } from "@/lib/firebase/callables/bank";
import { CheckCircle, AlertCircle, Building2 } from "lucide-react";

interface AddBankAccountDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function AddBankAccountDialog({
	isOpen,
	onClose,
	onSuccess,
}: AddBankAccountDialogProps) {
	const {
		loading,
		error,
		banks,
		fetchBanks,
		verifyAccount,
		saveBankAccount,
		clearError,
	} = useBankAccount();

	const [step, setStep] = useState<"form" | "verifying" | "success">("form");
	const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
	const [accountNumber, setAccountNumber] = useState("");
	const [accountName, setAccountName] = useState("");
	const [verificationError, setVerificationError] = useState<string | null>(
		null
	);

	// Fetch banks when dialog opens
	useEffect(() => {
		if (isOpen && banks.length === 0) {
			fetchBanks();
		}
	}, [isOpen, banks.length, fetchBanks]);

	// Reset state when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setStep("form");
			setSelectedBank(null);
			setAccountNumber("");
			setAccountName("");
			setVerificationError(null);
			clearError();
		}
	}, [isOpen, clearError]);

	const handleVerifyAccount = async () => {
		if (!selectedBank || !accountNumber.trim()) {
			setVerificationError(
				"Please select a bank and enter your account number"
			);
			return;
		}

		if (accountNumber.length !== 10) {
			setVerificationError("Account number must be 10 digits");
			return;
		}

		setStep("verifying");
		setVerificationError(null);
		clearError();

		try {
			const bankData = await verifyAccount(
				accountNumber.trim(),
				selectedBank.code,
				selectedBank.name
			);

			setAccountName(bankData.accountName);
			await saveBankAccount(bankData);
			setStep("success");
		} catch (err) {
			setVerificationError(
				err instanceof Error ? err.message : "Account verification failed"
			);
			setStep("form");
		}
	};

	const handleClose = () => {
		if (step === "success") {
			onSuccess();
		}
		onClose();
	};

	const canVerify = selectedBank && accountNumber.trim().length === 10;

	if (!isOpen) return null;

	return (
		<DialogFrame
			title="Add Bank Account"
			onClose={handleClose}
			className="max-w-md"
		>
			<div className="space-y-6">
				{/* Error Display */}
				{(error || verificationError) && (
					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
						<div className="flex items-center gap-2 text-red-400">
							<AlertCircle className="w-4 h-4" />
							<span className="text-sm">{error || verificationError}</span>
						</div>
					</div>
				)}

				{/* Form Step */}
				{step === "form" && (
					<div className="space-y-4">
						{/* Bank Selection */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Select Bank <span className="text-red-500">*</span>
							</label>
							{loading && banks.length === 0 ? (
								<div className="flex items-center justify-center py-8">
									<Spinner size="md" />
								</div>
							) : (
								<select
									value={selectedBank?.code || ""}
									onChange={(e) => {
										const bank = banks.find((b) => b.code === e.target.value);
										setSelectedBank(bank || null);
									}}
									className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
									disabled={loading}
								>
									<option value="">Choose your bank</option>
									{banks.map((bank, index) => (
										<option key={`${bank.code}-${index}`} value={bank.code}>
											{bank.name}
										</option>
									))}
								</select>
							)}
						</div>

						{/* Account Number */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Account Number <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={accountNumber}
								onChange={(e) => {
									const value = e.target.value.replace(/\D/g, ""); // Only numbers
									if (value.length <= 10) {
										setAccountNumber(value);
									}
								}}
								placeholder="Enter your 10-digit account number"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								maxLength={10}
								disabled={loading}
							/>
							<p className="text-xs text-text-muted mt-1">
								Enter your 10-digit account number
							</p>
						</div>

						{/* Verify Button */}
						<Button
							variant={canVerify ? "primary" : "disabled"}
							text="Verify Account"
							onClick={handleVerifyAccount}
							disabled={!canVerify || loading}
							className="w-full"
						/>
					</div>
				)}

				{/* Verifying Step */}
				{step === "verifying" && (
					<div className="text-center py-8">
						<div className="flex flex-col items-center gap-4">
							<Spinner size="lg" />
							<div>
								<h3 className="font-medium text-lg mb-2">Verifying Account</h3>
								<p className="text-text-muted text-sm">
									We're verifying your account details with {selectedBank?.name}
									...
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Success Step */}
				{step === "success" && (
					<div className="text-center py-8">
						<div className="flex flex-col items-center gap-4">
							<div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
								<CheckCircle className="w-8 h-8 text-accent" />
							</div>
							<div>
								<h3 className="font-medium text-lg mb-2">Account Verified!</h3>
								<p className="text-text-muted text-sm mb-4">
									Your bank account has been successfully verified and added.
								</p>
								<div className="bg-surface border border-stroke rounded-xl p-4 text-left">
									<div className="flex items-center gap-3 mb-2">
										<Building2 className="w-5 h-5 text-accent" />
										<span className="font-medium">{selectedBank?.name}</span>
									</div>
									<p className="text-sm text-text-muted">{accountName}</p>
									<p className="text-sm text-text-muted">
										••••{accountNumber.slice(-4)}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 pt-4 border-t border-stroke">
					{step === "success" ? (
						<Button variant="primary" text="Done" onClick={handleClose} />
					) : (
						<>
							<Button
								variant="outline"
								text="Cancel"
								onClick={handleClose}
								disabled={loading}
							/>
							{step === "form" && (
								<Button
									variant={canVerify ? "primary" : "disabled"}
									text="Verify Account"
									onClick={handleVerifyAccount}
									disabled={!canVerify || loading}
								/>
							)}
						</>
					)}
				</div>
			</div>
		</DialogFrame>
	);
}

function DialogFrame({
	title,
	children,
	onClose,
	className = "",
}: {
	title: string;
	children: React.ReactNode;
	onClose: () => void;
	className?: string;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div
				className={`w-full max-w-2xl max-h-[90vh] rounded-2xl bg-surface border border-stroke flex flex-col ${className}`}
			>
				<div className="flex items-center justify-between p-6 border-b border-stroke">
					<h3 className="font-heading font-semibold text-lg">{title}</h3>
					<button className="text-text-muted hover:text-text" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-6">{children}</div>
			</div>
		</div>
	);
}
