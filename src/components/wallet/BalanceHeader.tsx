// components/wallet/BalanceHeader.tsx
import { WalletSummary } from "@/types/wallet";
import { formatCurrency, formatDate } from "@/lib/wallet/mock";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface BalanceHeaderProps {
	summary: WalletSummary;
}

export default function BalanceHeader({ summary }: BalanceHeaderProps) {
	const router = useRouter();
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-heading font-semibold">Wallet</h1>
					<p className="text-text-muted mt-1">
						Track balances, payouts, and earnings
					</p>
				</div>
				<Button
					text="Payout Settings"
					variant="secondary"
					onClick={() => router.push("/settings?section=payout")}
					className="flex items-center gap-2"
				>
					<Settings className="w-4 h-4" />
				</Button>
				{/* <Button
					text="Withdraw"
					variant="disabled"
					disabled
					className="cursor-not-allowed"
					title="Coming soon"
				/> */}
			</div>

			{/* Balance Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

			{/* Payout Schedule Info */}
			<div className="bg-surface rounded-2xl p-4 border border-stroke">
				<h3 className="text-sm font-medium text-text mb-3">Payout Schedules</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<div className="w-2 h-2 bg-accent rounded-full"></div>
							<span className="font-medium text-text">Event Earnings</span>
						</div>
						<p className="text-text-muted">
							Event payouts are processed automatically every Friday
						</p>
					</div>
					<div>
						<div className="flex items-center gap-2 mb-1">
							<div className="w-2 h-2 bg-cta rounded-full"></div>
							<span className="font-medium text-text">Store Earnings</span>
						</div>
						<p className="text-text-muted">
							Store payouts follow your custom payout settings
						</p>
					</div>
				</div>
			</div>

			{/* Last Updated */}
			<div className="text-xs text-text-muted">
				Last updated:{" "}
				{summary.lastUpdatedAt ? formatDate(summary.lastUpdatedAt) : "—"}
			</div>
		</div>
	);
}
