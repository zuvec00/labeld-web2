"use client";
// src/app/(protected)/(dashboard)/wallet/page.tsx
import { useState } from "react";
import { LedgerType, LedgerSource } from "@/types/wallet";
import BalanceHeader from "@/components/wallet/BalanceHeader";
import EarningsOverview from "@/components/wallet/EarningsOverview";
import FiltersBar from "@/components/wallet/FiltersBar";
import LedgerTable from "@/components/wallet/LedgerTable";
import PayoutsTable from "@/components/wallet/PayoutsTable";
import HelpPanel from "@/components/wallet/HelpPanel";
import BankAccountBanner from "@/components/wallet/BankAccountBanner";
// import TestPayoutPanel from "@/components/wallet/TestPayoutPanel";
import TestStorePayoutPanel from "@/components/wallet/TestStorePayoutPanel";
import { useWallet } from "@/hooks/useWallet";
import { usePayouts } from "@/hooks/usePayouts";
import TestPayoutPanel from "@/components/wallet/TestPayoutPanel";

export default function WalletPage() {
	const { user, loading, walletData, error } = useWallet();
	const { payouts } = usePayouts(walletData?.entries || []);

	// Filter state
	const [filters, setFilters] = useState<{
		sources: LedgerSource[];
		types: LedgerType[];
		minAmount: number | null;
		maxAmount: number | null;
	}>({
		sources: [],
		types: [],
		minAmount: null,
		maxAmount: null,
	});

	if (loading) {
		return (
			<div className="space-y-8">
				<div className="animate-pulse">
					<div className="h-8 bg-stroke rounded mb-4"></div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="h-32 bg-stroke rounded-[20px]"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<div className="text-alert text-lg mb-2">Error Loading Wallet</div>
				<p className="text-text-muted/70">{error}</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="text-center py-12">
				<div className="text-alert text-lg mb-2">Authentication Required</div>
				<p className="text-text-muted/70">Please log in to view your wallet</p>
			</div>
		);
	}

	// Create a default summary if none exists (for new users)
	const defaultSummary = {
		currency: "NGN",
		eligibleBalanceMinor: 0,
		onHoldMinor: 0,
		payout: {
			frequency: "weekly",
			dayOfWeek: 5,
			cutOffDayOfWeek: 4,
			cutOffHourLocal: 12,
			payoutHourLocal: 14,
			bank: null,
		},
		lastUpdatedAt: Date.now(),
	};

	// Use actual summary or fall back to default
	const displaySummary = (walletData.summary || defaultSummary) as any; // Cast to any to avoid strict type mismatch with partial default

	return (
		<div className="space-y-8">
			{/* Test Payout Panels - Comment out when going live */}
			{/* <TestPayoutPanel />  */}
			{/* <TestStorePayoutPanel /> */}

			{/* Header Summary */}

			<BalanceHeader summary={displaySummary} />

			{/* Bank Account Status Banner */}
			<BankAccountBanner summary={displaySummary} />

			{/* Earnings Overview */}
			<EarningsOverview
				entries={walletData.entries}
				walletSummary={displaySummary}
			/>

			{/* Filters Bar */}
			<FiltersBar onFiltersChange={setFilters} />

			{/* Transaction History */}
			<LedgerTable entries={walletData.entries} filters={filters} />

			{/* Payouts */}
			<PayoutsTable payouts={payouts} walletSummary={displaySummary} />

			{/* Help Panel */}
			<HelpPanel />
		</div>
	);
}
