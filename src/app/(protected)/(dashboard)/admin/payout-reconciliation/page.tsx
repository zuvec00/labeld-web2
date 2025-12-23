"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	reconcileManualPayout,
	backfillPayoutBatch,
	ReconciliationResult,
} from "@/lib/firebase/admin/payout";
import { getWalletLedgerEntries } from "@/lib/firebase/queries/wallet";
import { WalletLedgerEntry } from "@/types/wallet";
import LedgerTable from "@/components/wallet/LedgerTable";
import {
	AlertTriangle,
	CheckCircle,
	Terminal,
	RefreshCw,
	FileText,
	ArrowRight,
} from "lucide-react";

export default function PayoutReconciliationPage() {
	const { user } = useAuth();

	const [vendorId, setVendorId] = useState("");
	const [amount, setAmount] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<ReconciliationResult | null>(null);
	const [logs, setLogs] = useState<string[]>([]);

	// Backfill state
	const [batchId, setBatchId] = useState("");
	const [isBackfilling, setIsBackfilling] = useState(false);

	// Ledger verification state
	const [ledgerEntries, setLedgerEntries] = useState<WalletLedgerEntry[]>([]);
	const [loadingLedger, setLoadingLedger] = useState(false);

	// Fetch ledger entries for the current vendorId
	const fetchLedger = async (vid: string) => {
		if (!vid) return;
		setLoadingLedger(true);
		try {
			const entries = await getWalletLedgerEntries(vid, 20); // Fetch top 20 recent
			setLedgerEntries(entries);
		} catch (err) {
			console.error("Failed to fetch ledger:", err);
		} finally {
			setLoadingLedger(false);
		}
	};

	const handleReconcile = async () => {
		if (!vendorId || !amount) return;

		// Amount is in Naira from input, but we need Minor (kobo) for backend
		const amountFloat = parseFloat(amount.replace(/,/g, ""));
		if (isNaN(amountFloat) || amountFloat <= 0) {
			alert("Invalid amount");
			return;
		}

		const amountMinor = Math.round(amountFloat * 100);

		// Confirm action
		const confirmed = window.confirm(
			`Are you sure you want to reconcile a payout of ₦${amountFloat.toLocaleString()} for vendor ${vendorId}? This will modify the ledger.`
		);
		if (!confirmed) return;

		setIsProcessing(true);
		setResult(null);
		setLogs(["Starting reconciliation process..."]);

		try {
			const res = await reconcileManualPayout(vendorId, amountMinor);
			setResult(res);
			setLogs(res.logs);

			// Auto-refresh ledger after successful reconciliation
			if (res.success) {
				await fetchLedger(vendorId);
				if (res.batchId) {
					setBatchId(res.batchId);
					setLogs((prev) => [...prev, `\nBatch ID generated: ${res.batchId}`]);
				}
			}
		} catch (error: any) {
			setResult({
				success: false,
				message: error.message || "Unknown error",
				logs: ["Error occurred during execution."],
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const handleBackfill = async () => {
		if (!vendorId || !amount || !batchId) return;

		const amountFloat = parseFloat(amount.replace(/,/g, ""));
		if (isNaN(amountFloat) || amountFloat <= 0) {
			alert("Invalid amount");
			return;
		}
		const amountMinor = Math.round(amountFloat * 100);

		setIsBackfilling(true);
		setLogs((prev) => [...prev, "\n--- Starting Batch Backfill ---"]);

		try {
			const res = await backfillPayoutBatch(vendorId, amountMinor, batchId);
			setLogs((prev) => [...prev, ...res.logs]);
			if (res.success) {
				setLogs((prev) => [...prev, "Batch backfill completed successfully."]);
			}
		} catch (error: any) {
			setLogs((prev) => [...prev, `Error: ${error.message}`]);
		} finally {
			setIsBackfilling(false);
		}
	};

	if (!user) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<p className="text-text-muted">Please log in to access this page.</p>
			</div>
		);
	}

	return (
		<div className="min-h-dvh bg-bg px-4 sm:px-6 py-8 max-w-6xl mx-auto space-y-8">
			{/* Header */}
			<div>
				<h1 className="font-heading font-semibold text-2xl sm:text-3xl flex items-center gap-3">
					<Terminal className="w-8 h-8 text-accent" />
					Manual Payout Reconciliation
				</h1>
				<p className="text-text-muted mt-2">
					Manually record a payout that happened outside the system and
					reconcile it against the Wallet Ledger.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* left Column: Input Forms */}
				<div className="space-y-6">
					{/* 1. SHARED CONTEXT */}
					<div className="bg-surface border border-stroke rounded-2xl p-6 h-fit">
						<h2 className="font-heading font-semibold text-lg mb-4">
							Target Context
						</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1 text-text-muted">
									Vendor ID
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={vendorId}
										onChange={(e) => setVendorId(e.target.value)}
										placeholder="e.g. 7qXyZ..."
										className="w-full rounded-xl border border-stroke px-4 py-3 text-text bg-bg outline-none focus:border-accent"
									/>
									<Button
										text="Check"
										variant="secondary"
										onClick={() => fetchLedger(vendorId)}
										disabled={!vendorId || loadingLedger}
										leftIcon={<RefreshCw className="w-4 h-4" />}
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1 text-text-muted">
									Amount Paid (₦)
								</label>
								<input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="150000"
									className="w-full rounded-xl border border-stroke px-4 py-3 text-text bg-bg outline-none focus:border-accent"
								/>
								<p className="text-xs text-text-muted mt-1">
									Enter the actual amount paid in Naira.
								</p>
							</div>
						</div>
					</div>

					{/* 2. ACTION: RECONCILE LEDGER */}
					<div className="bg-surface border border-stroke rounded-2xl p-6 h-fit">
						<h2 className="font-heading font-semibold text-lg mb-4">
							Action A: Reconcile Ledger
						</h2>
						<div className="space-y-4">
							<div className="bg-alert/10 border border-alert/20 rounded-lg p-3 text-sm text-alert/90 flex gap-2">
								<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
								<p>
									This will debit the ledger and mark eligible credits as
									"Paid".
								</p>
							</div>
							<Button
								text="Reconcile Payout"
								variant="primary"
								onClick={handleReconcile}
								isLoading={isProcessing}
								disabled={!vendorId || !amount || isProcessing}
								className="w-full"
							/>
						</div>
					</div>

					{/* Step 2: Backfill Batch Record */}
					<div className="bg-surface border border-stroke rounded-2xl p-6 h-fit relative overflow-hidden">
						{/* Optional overlay if step 1 is not done? No, user might want to run independent backfill */}
						<h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
							<FileText className="w-5 h-5 text-text-muted" />
							Action B: Document Batch
						</h2>
						<p className="text-sm text-text-muted mb-4">
							Create the official payout batch record in `eventPayoutBatches`.
							Required for history & receipts.
						</p>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-1 text-text-muted">
									Batch ID
								</label>
								<input
									type="text"
									value={batchId}
									onChange={(e) => setBatchId(e.target.value)}
									placeholder="e.g. manual_payout_..."
									className="w-full rounded-xl border border-stroke px-4 py-3 text-text bg-bg outline-none focus:border-accent font-mono text-sm"
								/>
								<p className="text-xs text-text-muted mt-1">
									Auto-filled after Step 1, or enter manually.
								</p>
							</div>

							<Button
								text="Backfill Batch Record"
								variant="secondary"
								onClick={handleBackfill}
								isLoading={isBackfilling}
								disabled={!vendorId || !amount || !batchId || isBackfilling}
								className="w-full"
								rightIcon={<ArrowRight className="w-4 h-4" />}
							/>
						</div>
					</div>
				</div>

				{/* Logs / Output */}
				<div className="bg-surface border border-stroke rounded-2xl p-6 flex flex-col h-full min-h-[400px]">
					<h2 className="font-heading font-semibold text-lg mb-4 flex items-center justify-between">
						<span>Execution Logs</span>
						{result && (
							<span
								className={`text-sm px-2 py-1 rounded-full flex items-center gap-1 ${
									result.success
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-700"
								}`}
							>
								{result.success ? (
									<CheckCircle className="w-3 h-3" />
								) : (
									<AlertTriangle className="w-3 h-3" />
								)}
								{result.success ? "Success" : "Failed"}
							</span>
						)}
					</h2>

					<div className="flex-1 bg-black/90 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
						{logs.length === 0 ? (
							<span className="text-gray-500 opacity-50">
								Waiting for execution...
							</span>
						) : (
							logs.map((log, i) => (
								<div
									key={i}
									className="mb-1 border-b border-white/5 pb-1 last:border-0"
								>{`> ${log}`}</div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Verification: Ledger Table */}
			{vendorId && (
				<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-heading font-semibold text-xl">
							Verification: Latest Transactions
						</h2>
						<Button
							text="Refresh Ledger"
							variant="outline"
							onClick={() => fetchLedger(vendorId)}
							isLoading={loadingLedger}
							leftIcon={<RefreshCw className="w-4 h-4" />}
						/>
					</div>

					{loadingLedger && ledgerEntries.length === 0 ? (
						<div className="flex justify-center py-12">
							<Spinner size="lg" />
						</div>
					) : (
						<LedgerTable
							entries={ledgerEntries}
							filters={{
								sources: [],
								types: [],
								minAmount: null,
								maxAmount: null,
							}}
						/>
					)}
				</div>
			)}
		</div>
	);
}
