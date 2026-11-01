"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Landmark } from "lucide-react";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useWallet } from "@/hooks/useWallet";
import { useBankAccount } from "@/hooks/useBankAccount";
import { toast } from "@/app/hooks/use-toast";
import AddBankAccountDialog, {
	DialogFrame,
} from "@/components/wallet/AddBankAccountDialog";

/**
 * Payouts. Scheduled payouts (weekly / 3-day / priority) are retired: brands
 * withdraw on demand from the Wallet, same as the mobile app. This page only
 * manages the bank account those withdrawals go to.
 *
 * Layout follows its sibling ShippingSettings (max-w-4xl, h1 + h2 sections);
 * labels and wording follow the mobile wallet ("Change Bank Account",
 * "Remove Bank Account", VERIFIED / UNVERIFIED).
 */
export default function PayoutSettings() {
	const router = useRouter();
	const { walletData, loading, refetch } = useWallet();
	const { removeBankAccount, loading: removing } = useBankAccount();

	const [showBankDialog, setShowBankDialog] = useState(false);
	const [confirmRemove, setConfirmRemove] = useState(false);

	const bank = walletData.summary?.payout?.bank ?? null;

	const handleRemove = async () => {
		try {
			await removeBankAccount();
			setConfirmRemove(false);
			await refetch();
			toast({ title: "Bank account removed successfully.", duration: 4000 });
		} catch {
			toast({
				title: "Failed to remove bank account. Please try again.",
				variant: "destructive",
				duration: 5000,
			});
		}
	};

	if (loading) {
		return (
			<div className="h-[400px] flex items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-12 pb-24">
			{/* Header */}
			<div className="space-y-1">
				<h1 className="text-2xl md:text-3xl font-heading font-medium text-text tracking-tight">
					Bank & Payouts
				</h1>
				<p className="text-text-muted text-lg font-light">
					Withdraw your earnings to your bank account whenever you like.
				</p>
			</div>

			{/* Withdrawing earnings */}
			<div className="space-y-4">
				<h2 className="text-text font-medium text-lg">Withdrawing Earnings</h2>
				<div className="bg-surface rounded-2xl p-5 border border-stroke flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<p className="text-sm text-text-muted leading-relaxed">
						Request a withdrawal anytime and the funds go straight to your
						bank. Flat ₦100 fee per withdrawal, ₦1,000 minimum, one withdrawal
						at a time. There&apos;s no payout schedule to set up.
					</p>
					<Button
						text="Go to Wallet"
						variant="cta"
						onClick={() => router.push("/wallet")}
						className="flex-shrink-0"
					/>
				</div>
			</div>

			{/* Bank account */}
			<div className="space-y-4">
				<h2 className="text-text font-medium text-lg">Bank Account</h2>

				{!bank ? (
					<div className="bg-surface rounded-2xl p-5 border border-stroke flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-start gap-3">
							<Landmark className="w-5 h-5 mt-0.5 text-text-muted flex-shrink-0" />
							<p className="text-sm text-text-muted">
								Not linked. Add and verify a bank account to start
								withdrawing.
							</p>
						</div>
						<Button
							text="Add Bank Account"
							variant="cta"
							onClick={() => setShowBankDialog(true)}
							className="flex-shrink-0"
						/>
					</div>
				) : (
					<div
						className={`rounded-2xl border p-5 space-y-4 ${
							bank.isVerified
								? "bg-accent/5 border-accent/20"
								: "bg-edit/10 border-edit/20"
						}`}
					>
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-1">
								<p className="font-medium text-text">
									{bank.bankName} ••••{bank.accountNumber.slice(-4)}
								</p>
								<p className="text-sm text-text-muted">{bank.accountName}</p>
							</div>
							{bank.isVerified ? (
								<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
									<CheckCircle2 className="w-4 h-4" /> Verified
								</span>
							) : (
								<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-edit">
									<Clock className="w-4 h-4" /> Unverified
								</span>
							)}
						</div>

						<div className="flex flex-wrap gap-3">
							<Button
								text="Change Bank Account"
								variant="secondary"
								onClick={() => setShowBankDialog(true)}
							/>
							<Button
								text="Remove Bank Account"
								variant="outline"
								outlineColor="alert"
								onClick={() => setConfirmRemove(true)}
							/>
						</div>
					</div>
				)}
			</div>

			<AddBankAccountDialog
				isOpen={showBankDialog}
				onClose={() => setShowBankDialog(false)}
				onSuccess={() => {
					refetch();
					setShowBankDialog(false);
				}}
			/>

			{/* Confirm removal (mobile shows the same confirmation) */}
			{confirmRemove && (
				<DialogFrame
					title="Remove Bank Account"
					onClose={() => !removing && setConfirmRemove(false)}
					className="max-w-md"
				>
					<div className="space-y-6">
						<p className="text-sm text-text-muted leading-relaxed">
							Are you sure you want to remove your linked bank account? You
							won&apos;t be able to withdraw until you link a new one.
						</p>
						<div className="flex items-center justify-end gap-3 pt-4 border-t border-stroke">
							<Button
								variant="outline"
								text="Cancel"
								onClick={() => setConfirmRemove(false)}
								disabled={removing}
							/>
							<Button
								variant="danger"
								text={removing ? "Removing..." : "Remove"}
								onClick={handleRemove}
								disabled={removing}
							/>
						</div>
					</div>
				</DialogFrame>
			)}
		</div>
	);
}
