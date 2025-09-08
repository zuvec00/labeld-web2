// components/wallet/BankAccountBanner.tsx
import { WalletSummary } from "@/types/wallet";
import { Button } from "@/components/ui/button";

interface BankAccountBannerProps {
	summary: WalletSummary;
}

export default function BankAccountBanner({ summary }: BankAccountBannerProps) {
	const { bank } = summary.payout;

	// No bank account set up
	if (!bank) {
		return (
			<div className="rounded-[20px] bg-alert/10 border border-alert/20 p-6">
				<div className="flex items-start gap-4">
					<div className="w-6 h-6 bg-alert rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
						<span className="text-white text-sm font-bold">!</span>
					</div>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-alert mb-2">
							Bank Account Required
						</h3>
						<p className="text-text-muted mb-4">
							You need to add your bank account details to receive payouts for
							your earnings. Without a bank account, your funds will remain in
							your wallet.
						</p>
						<Button
							text="Add Bank Account"
							variant="cta"
							className="cursor-not-allowed opacity-50"
							title="Coming soon"
						/>
					</div>
				</div>
			</div>
		);
	}

	// Bank account exists but not verified
	if (!bank.isVerified) {
		return (
			<div className="rounded-[20px] bg-edit/10 border border-edit/20 p-6">
				<div className="flex items-start gap-4">
					<div className="w-6 h-6 bg-edit rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
						<span className="text-white text-sm font-bold">⏳</span>
					</div>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-edit mb-2">
							Bank Account Verification Pending
						</h3>
						<p className="text-text-muted mb-2">
							Your bank account{" "}
							<strong>
								{bank.bankName} ••••{bank.accountNumber.slice(-4)}
							</strong>{" "}
							is pending verification.
						</p>
						<p className="text-text-muted mb-4">
							Once verified, you&apos;ll be able to receive payouts
							automatically every Friday.
						</p>
						<div className="flex items-center gap-3">
							<Button
								text="Check Verification Status"
								variant="outline"
								outlineColor="edit"
								className="cursor-not-allowed opacity-50"
								title="Coming soon"
							/>
							<Button
								text="Update Bank Details"
								variant="secondary"
								className="cursor-not-allowed opacity-50"
								title="Coming soon"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Bank account is verified - show success state
	return (
		<div className="rounded-[20px] bg-accent/10 border border-accent/20 p-6">
			<div className="flex items-start gap-4">
				<div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
					<span className="text-bg text-sm font-bold">✓</span>
				</div>
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-accent mb-2">
						Bank Account Verified
					</h3>
					<p className="text-text-muted mb-2">
						Your bank account{" "}
						<strong>
							{bank.bankName} ••••{bank.accountNumber.slice(-4)}
						</strong>{" "}
						is verified and ready for payouts.
					</p>
					<p className="text-text-muted">
						You&apos;ll receive your earnings automatically every Friday at 2:00
						PM.
					</p>
				</div>
			</div>
		</div>
	);
}
