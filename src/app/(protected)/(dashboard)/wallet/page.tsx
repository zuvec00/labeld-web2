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
import { useWallet } from "@/hooks/useWallet";
import {
	mockWithdrawalRequests,
	mockWalletSummaryNoBank,
	mockWalletSummaryUnverifiedBank,
} from "@/lib/wallet/mock";

export default function WalletPage() {
	const { user, loading, walletData, error } = useWallet();

	// Demo toggle for testing different bank account states
	const [demoBankState, setDemoBankState] = useState<
		"verified" | "unverified" | "none"
	>("verified");
	const [useRealBankData, setUseRealBankData] = useState(true);

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

	// Override wallet data for demo purposes
	const displayWalletData = {
		...walletData,
		summary: walletData.summary
			? (() => {
					switch (demoBankState) {
						case "none":
							return mockWalletSummaryNoBank;
						case "unverified":
							return mockWalletSummaryUnverifiedBank;
						default:
							return walletData.summary;
					}
			  })()
			: null,
	};

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

	if (!displayWalletData.summary) {
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
			{/* Demo Controls */}
			<div className="flex items-center gap-2 p-4 bg-stroke/30 rounded-lg">
				<span className="text-sm text-text-muted">Demo Bank States:</span>
				<button
					onClick={() => setUseRealBankData(!useRealBankData)}
					className={`px-3 py-1 text-xs rounded ${
						useRealBankData
							? "bg-cta text-text font-semibold"
							: "bg-stroke text-text-muted hover:bg-stroke/80"
					}`}
				>
					{useRealBankData ? "Real Data" : "Demo Data"}
				</button>
				{!useRealBankData && (
					<>
						<button
							onClick={() => setDemoBankState("verified")}
							className={`px-3 py-1 text-xs rounded ${
								demoBankState === "verified"
									? "bg-accent text-bg"
									: "bg-stroke text-text-muted hover:bg-stroke/80"
							}`}
						>
							Verified
						</button>
						<button
							onClick={() => setDemoBankState("unverified")}
							className={`px-3 py-1 text-xs rounded ${
								demoBankState === "unverified"
									? "bg-edit text-bg"
									: "bg-stroke text-text-muted hover:bg-stroke/80"
							}`}
						>
							Unverified
						</button>
						<button
							onClick={() => setDemoBankState("none")}
							className={`px-3 py-1 text-xs rounded ${
								demoBankState === "none"
									? "bg-alert text-bg"
									: "bg-stroke text-text-muted hover:bg-stroke/80"
							}`}
						>
							No Bank
						</button>
					</>
				)}
			</div>

			{/* Header Summary */}
			<BalanceHeader summary={displayWalletData.summary} />

			{/* Bank Account Status Banner */}
			{displayWalletData.summary && (
				<BankAccountBanner
					summary={
						useRealBankData
							? walletData.summary || displayWalletData.summary
							: displayWalletData.summary
					}
				/>
			)}

			{/* Earnings Overview */}
			<EarningsOverview entries={displayWalletData.entries} />

			{/* Filters Bar */}
			<FiltersBar onFiltersChange={setFilters} />

			{/* Transaction History */}
			<LedgerTable entries={displayWalletData.entries} filters={filters} />

			{/* Payouts */}
			<PayoutsTable rows={mockWithdrawalRequests} />

			{/* Help Panel */}
			<HelpPanel />
		</div>
	);
}
