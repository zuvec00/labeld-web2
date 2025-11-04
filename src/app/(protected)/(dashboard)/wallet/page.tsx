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

	if (!walletData.summary) {
		return (
			<div className="text-center py-12">
				<div className="text-text-muted text-lg mb-2">No wallet found</div>
				<p className="text-text-muted/70">
					Your wallet will be created when you make your first sale
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Test Payout Panels - Comment out when going live */}
			<TestPayoutPanel /> 
			{/* <TestStorePayoutPanel /> */}

			{/* Header Summary */}

			<BalanceHeader summary={walletData.summary} />

			{/* Bank Account Status Banner */}
			{walletData.summary && <BankAccountBanner summary={walletData.summary} />}

			{/* Earnings Overview */}
			<EarningsOverview
				entries={walletData.entries}
				walletSummary={walletData.summary}
			/>

			{/* Filters Bar */}
			<FiltersBar onFiltersChange={setFilters} />

			{/* Transaction History */}
			<LedgerTable entries={walletData.entries} filters={filters} />

			{/* Payouts */}
			<PayoutsTable payouts={payouts} walletSummary={walletData.summary} />

			{/* Help Panel */}
			<HelpPanel />
		</div>
	);
}
