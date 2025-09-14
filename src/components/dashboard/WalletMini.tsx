// components/dashboard/WalletMini.tsx
"use client";

import { WalletSummary } from "@/types/wallet";
import { formatNaira } from "@/lib/orders/helpers";
import { Wallet, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface WalletMiniProps {
	walletSummary?: WalletSummary;
	loading?: boolean;
	className?: string;
}

export default function WalletMini({
	walletSummary,
	loading = false,
	className = "",
}: WalletMiniProps) {
	const router = useRouter();

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Wallet</h3>
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
		);
	}

	if (!walletSummary) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<h3 className="font-medium text-text mb-4">Wallet</h3>
				<div className="text-center py-8">
					<Wallet className="w-12 h-12 text-text-muted mx-auto mb-3" />
					<div className="text-text-muted">No wallet data</div>
					<div className="text-xs text-text-muted mt-1">
						Wallet will appear here when available
					</div>
				</div>
			</div>
		);
	}

	const formatNextPayout = (timestamp?: number): string => {
		if (!timestamp) return "No payout scheduled";

		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays <= 0) return "Available now";
		if (diffDays === 1) return "Tomorrow";
		if (diffDays <= 7) return `In ${diffDays} days`;

		return date.toLocaleDateString("en-NG", {
			month: "short",
			day: "numeric",
		});
	};

	const formatLastPayout = (timestamp?: number): string => {
		if (!timestamp) return "Never";

		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays <= 7) return `${diffDays} days ago`;

		return date.toLocaleDateString("en-NG", {
			month: "short",
			day: "numeric",
		});
	};

	const totalBalance =
		walletSummary.eligibleBalanceMinor + walletSummary.onHoldMinor;
	const hasBankDetails = walletSummary.payout.bank?.isVerified;

	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text">Wallet</h3>
				<Button
					text="View Details"
					onClick={() => router.push("/wallet")}
					variant="outline"
					className="text-xs px-3 py-1"
				/>
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

			{/* Payout Info */}
			<div className="mt-4 pt-3 border-t border-stroke/50 space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-text-muted">Next payout</span>
					<span className="text-text">
						{formatNextPayout(walletSummary.payout.nextPayoutAt)}
					</span>
				</div>

				<div className="flex items-center justify-between text-sm">
					<span className="text-text-muted">Last payout</span>
					<span className="text-text">
						{formatLastPayout(walletSummary.payout.lastPayoutAt)}
					</span>
				</div>

				{!hasBankDetails && (
					<div className="mt-3 p-2 bg-edit/10 border border-edit/20 rounded-lg">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-edit rounded-full"></div>
							<span className="text-xs text-edit">Bank details not set</span>
						</div>
						<Button
							text="Set Bank Details"
							onClick={() => router.push("/settings")}
							variant="primary"
							className="text-xs px-3 py-1 mt-2"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
