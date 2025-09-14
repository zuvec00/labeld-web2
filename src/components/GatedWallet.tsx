// components/GatedWallet.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { Lock, Wallet, CheckCircle, Clock } from "lucide-react";

interface GatedWalletProps {
	walletSummary?: {
		eligibleBalanceMinor: number;
		onHoldMinor: number;
		payout: {
			nextPayoutAt?: number;
			lastPayoutAt?: number;
		};
	};
	loading?: boolean;
	className?: string;
}

export default function GatedWallet({
	walletSummary,
	loading = false,
	className = "",
}: GatedWalletProps) {
	const enabled = isFeatureEnabled("wallet");

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="flex items-center justify-between mb-4">
						<div className="h-4 bg-stroke rounded w-16"></div>
						<div className="w-4 h-4 bg-stroke rounded"></div>
					</div>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="animate-pulse flex items-center justify-between p-2 border border-stroke rounded"
							>
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 bg-stroke rounded"></div>
									<div className="h-3 bg-stroke rounded w-20"></div>
								</div>
								<div className="h-3 bg-stroke rounded w-16"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (enabled && walletSummary) {
		// Show real wallet data when enabled
		const formatNaira = (minor: number) =>
			`₦${(minor / 100).toLocaleString("en-NG")}`;

		const totalBalance =
			walletSummary.eligibleBalanceMinor + walletSummary.onHoldMinor;

		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-medium text-text">Wallet</h3>
					<Wallet className="w-4 h-4 text-text-muted" />
				</div>

				<div className="space-y-3">
					{/* Eligible Balance */}
					<div className="flex items-center justify-between p-3 bg-accent/5 border border-accent/20 rounded-lg">
						<div className="flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-accent" />
							<span className="text-sm font-medium text-text">Eligible</span>
						</div>
						<div className="text-right">
							<div className="text-lg font-heading font-semibold text-accent">
								{formatNaira(walletSummary.eligibleBalanceMinor)}
							</div>
							<div className="text-xs text-text-muted">Ready to withdraw</div>
						</div>
					</div>

					{/* On Hold Balance */}
					<div className="flex items-center justify-between p-3 bg-calm-2/5 border border-calm-2/20 rounded-lg">
						<div className="flex items-center gap-2">
							<Clock className="w-4 h-4 text-calm-2" />
							<span className="text-sm font-medium text-text">On Hold</span>
						</div>
						<div className="text-right">
							<div className="text-lg font-heading font-semibold text-calm-2">
								{formatNaira(walletSummary.onHoldMinor)}
							</div>
							<div className="text-xs text-text-muted">Awaiting release</div>
						</div>
					</div>

					{/* Total Balance */}
					<div className="flex items-center justify-between p-3 bg-cta/5 border border-cta/20 rounded-lg">
						<div className="flex items-center gap-2">
							<Wallet className="w-4 h-4 text-cta" />
							<span className="text-sm font-medium text-text">Total</span>
						</div>
						<div className="text-right">
							<div className="text-lg font-heading font-semibold text-cta">
								{formatNaira(totalBalance)}
							</div>
							<div className="text-xs text-text-muted">On platform</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Show locked state when wallet is disabled
	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 opacity-70 cursor-not-allowed relative ${className}`}
			title="Unlocking later this season"
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text-muted">Wallet</h3>
				<div className="flex items-center gap-2">
					<Wallet className="w-4 h-4 text-text-muted opacity-50" />
					<Lock className="w-4 h-4 text-text-muted opacity-70" />
				</div>
			</div>

			<div className="space-y-3">
				{/* Locked state for eligible */}
				<div className="flex items-center justify-between p-3 bg-background/50 border border-stroke/50 rounded-lg">
					<div className="flex items-center gap-2">
						<CheckCircle className="w-4 h-4 text-text-muted opacity-50" />
						<span className="text-sm font-medium text-text-muted">
							Eligible
						</span>
					</div>
					<div className="text-right">
						<div className="text-lg font-heading font-semibold text-text-muted">
							—
						</div>
						<div className="text-xs text-text-muted">Drops with Wallet</div>
					</div>
				</div>

				{/* Locked state for on hold */}
				<div className="flex items-center justify-between p-3 bg-background/50 border border-stroke/50 rounded-lg">
					<div className="flex items-center gap-2">
						<Clock className="w-4 h-4 text-text-muted opacity-50" />
						<span className="text-sm font-medium text-text-muted">On Hold</span>
					</div>
					<div className="text-right">
						<div className="text-lg font-heading font-semibold text-text-muted">
							—
						</div>
						<div className="text-xs text-text-muted">Drops with Wallet</div>
					</div>
				</div>

				{/* Locked state for total */}
				<div className="flex items-center justify-between p-3 bg-background/50 border border-stroke/50 rounded-lg">
					<div className="flex items-center gap-2">
						<Wallet className="w-4 h-4 text-text-muted opacity-50" />
						<span className="text-sm font-medium text-text-muted">Total</span>
					</div>
					<div className="text-right">
						<div className="text-lg font-heading font-semibold text-text-muted">
							—
						</div>
						<div className="text-xs text-text-muted">Drops with Wallet</div>
					</div>
				</div>
			</div>

			{/* Dropping soon indicator */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-center gap-2">
					<div className="w-2 h-2 bg-edit rounded-full animate-pulse"></div>
					<span className="text-xs text-edit">Dropping soon</span>
				</div>
			</div>
		</div>
	);
}
