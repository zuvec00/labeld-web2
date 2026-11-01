// components/wallet/BalanceHeader.tsx
"use client";

import { useState } from "react";
import { WalletSummary } from "@/types/wallet";
import { formatCurrency, formatDate } from "@/lib/wallet/mock";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import RequestWithdrawalDialog from "./RequestWithdrawalDialog";

interface BalanceHeaderProps {
	summary: WalletSummary;
}

export default function BalanceHeader({ summary }: BalanceHeaderProps) {
	const router = useRouter();
	const [showWithdraw, setShowWithdraw] = useState(false);

	return (
		<>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-heading font-semibold">Wallet</h1>
						<p className="text-text-muted mt-1">
							Track balances, payouts, and earnings
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Button
							text="Bank & Payouts"
							variant="secondary"
							onClick={() => router.push("/settings?section=payout")}
							className="flex items-center gap-2"
						>
							<Settings className="w-4 h-4" />
						</Button>
						<Button
							text="Withdraw"
							variant="cta"
							onClick={() => setShowWithdraw(true)}
						/>
					</div>
				</div>

				{/* Balance Cards */}
				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-6"
					data-tour="balance-cards"
				>
					{/* Eligible Balance */}
					<div className="rounded-[20px] bg-surface border border-stroke p-6 hover:border-accent/30 transition-colors group">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-medium text-text-muted">
								Eligible Balance
							</h3>
							<div className="w-3 h-3 bg-accent rounded-full group-hover:scale-110 transition-transform"></div>
						</div>
						<div className="text-3xl font-heading font-semibold text-accent mb-2">
							{formatCurrency(summary.eligibleBalanceMinor)}
						</div>
						<p className="text-xs text-text-muted">Ready to withdraw</p>
					</div>

					{/* On Hold Balance */}
					<div className="rounded-[20px] bg-surface border border-stroke p-6 hover:border-calm-2/30 transition-colors group">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-medium text-text-muted">On Hold</h3>
							<div className="w-3 h-3 bg-calm-2 rounded-full group-hover:scale-110 transition-transform"></div>
						</div>
						<div className="text-3xl font-heading font-semibold text-calm-2 mb-2">
							{formatCurrency(summary.onHoldMinor)}
						</div>
						<p className="text-xs text-text-muted">Awaiting confirmation</p>
					</div>

					{/* Total Balance */}
					<div className="rounded-[20px] bg-surface border border-stroke p-6 hover:border-cta/30 transition-colors group">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-medium text-text-muted">
								Total On-Platform
							</h3>
							<div className="w-3 h-3 bg-cta rounded-full group-hover:scale-110 transition-transform"></div>
						</div>
						<div className="text-3xl font-heading font-semibold text-cta mb-2">
							{formatCurrency(summary.eligibleBalanceMinor + summary.onHoldMinor)}
						</div>
						<p className="text-xs text-text-muted">Eligible + On Hold</p>
					</div>
				</div>

				{/* How withdrawals work (replaces the retired payout schedules) */}
				<div className="bg-surface rounded-2xl p-4 border border-stroke">
					<h3 className="text-sm font-medium text-text mb-1">Withdraw anytime</h3>
					<p className="text-xs text-text-muted leading-relaxed">
						Request a withdrawal anytime and the funds go straight to your
						bank. Flat {formatCurrency(10000)} fee per withdrawal,{" "}
						{formatCurrency(100000)} minimum, one withdrawal at a time.
					</p>
				</div>

				{/* Last Updated */}
				<div className="text-xs text-text-muted">
					Last updated:{" "}
					{summary.lastUpdatedAt ? formatDate(summary.lastUpdatedAt) : "—"}
				</div>
			</div>

			<RequestWithdrawalDialog
				isOpen={showWithdraw}
				onClose={() => setShowWithdraw(false)}
			/>
		</>
	);
}
