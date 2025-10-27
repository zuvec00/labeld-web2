// components/wallet/TestStorePayoutPanel.tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	runTestStorePayout,
	StorePayoutTestResult,
} from "@/lib/firebase/callables/payout";
import { CheckCircle, AlertCircle, Info, Play, Store } from "lucide-react";

export default function TestStorePayoutPanel() {
	const [loading, setLoading] = useState<boolean>(false);
	const [result, setResult] = useState<StorePayoutTestResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [testMode, setTestMode] = useState(true);
	const [dryRun, setDryRun] = useState(true);

	const handleTestStorePayout = async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await runTestStorePayout(testMode, dryRun);
			setResult(result);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to run test store payout"
			);
		} finally {
			setLoading(false);
		}
	};

	const clearResults = () => {
		setResult(null);
		setError(null);
	};

	return (
		<div className="rounded-2xl bg-surface border border-stroke p-6">
			<div className="flex items-center gap-2 mb-4">
				<Store className="w-5 h-5 text-accent" />
				<h3 className="font-heading font-semibold text-lg">
					Test Store Payout System
				</h3>
			</div>

			<p className="text-text-muted text-sm mb-6">
				Test the store payout system for processing store earnings. Use dry run
				mode to simulate without actual transactions.
			</p>

			{/* Controls */}
			<div className="grid gap-4 sm:grid-cols-2 mb-6">
				<div>
					<label className="block text-sm font-medium mb-2">Test Mode</label>
					<select
						value={testMode ? "true" : "false"}
						onChange={(e) => setTestMode(e.target.value === "true")}
						className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
					>
						<option value="true">Test Mode (Paystack Test)</option>
						<option value="false">Live Mode (Paystack Live)</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium mb-2">Run Mode</label>
					<select
						value={dryRun ? "true" : "false"}
						onChange={(e) => setDryRun(e.target.value === "true")}
						className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
					>
						<option value="true">Dry Run (Simulate Only)</option>
						<option value="false">Live Run (Actual Transactions)</option>
					</select>
				</div>
			</div>

			{/* Action Button */}
			<div className="mb-6">
				<Button
					variant="outline"
					text={loading ? "Processing..." : "Test Store Payout"}
					leftIcon={
						loading ? <Spinner size="sm" /> : <Play className="w-4 h-4" />
					}
					onClick={handleTestStorePayout}
					disabled={loading}
					className="w-full"
				/>
			</div>

			{/* Error Display */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
					<div className="flex items-center gap-2 text-red-400">
						<AlertCircle className="w-4 h-4" />
						<span className="text-sm">{error}</span>
					</div>
				</div>
			)}

			{/* Results Display */}
			{result && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Store Payout Test Results</h4>
						<Button
							variant="outline"
							text="Clear"
							onClick={clearResults}
							className="text-xs px-3 py-1"
						/>
					</div>

					<div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-3">
							<CheckCircle className="w-4 h-4 text-accent" />
							<span className="font-medium text-sm">Store Payout Results</span>
						</div>

						{/* Summary Stats */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
							<div>
								<div className="text-text-muted">Total Vendors</div>
								<div className="font-medium">{result.results.totalVendors}</div>
							</div>
							<div>
								<div className="text-text-muted">Successful</div>
								<div className="font-medium text-accent">
									{result.results.successful}
								</div>
							</div>
							<div>
								<div className="text-text-muted">Failed</div>
								<div className="font-medium text-red-400">
									{result.results.failed}
								</div>
							</div>
							<div>
								<div className="text-text-muted">Skipped</div>
								<div className="font-medium text-edit">
									{result.results.skipped}
								</div>
							</div>
						</div>

						{/* Total Amount */}
						<div className="mb-3 p-3 bg-surface rounded-lg">
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">Total Amount:</span>
								<span className="font-bold text-accent">
									₦{(result.results.totalAmount / 100).toLocaleString()}
								</span>
							</div>
						</div>

						{/* Batch ID */}
						{result.results.batchId && (
							<div className="mb-3 p-3 bg-surface rounded-lg">
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium">Batch ID:</span>
									<span className="font-mono text-xs text-text-muted">
										{result.results.batchId}
									</span>
								</div>
							</div>
						)}

						{/* Details */}
						{result.details && (
							<details className="mt-3">
								<summary className="text-xs text-text-muted cursor-pointer">
									View Details
								</summary>
								<div className="mt-2 text-xs space-y-2">
									<div>
										<strong>Vendors with Bank:</strong>{" "}
										{result.details.vendorsWithBank.length}
									</div>
									<div>
										<strong>Vendors without Bank:</strong>{" "}
										{result.details.vendorsWithoutBank.length}
									</div>
									<div>
										<strong>Payout Results:</strong>{" "}
										{result.details.payoutResults.length}
									</div>

									{/* Vendors with Bank Details */}
									{result.details.vendorsWithBank.length > 0 && (
										<div className="mt-3">
											<strong className="text-accent">
												Vendors with Bank Details:
											</strong>
											<div className="mt-1 space-y-1">
												{result.details.vendorsWithBank.map((vendor, index) => (
													<div
														key={index}
														className="flex justify-between text-xs"
													>
														<span>{vendor.vendorName}</span>
														<span className="text-accent">{vendor.amount}</span>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Vendors without Bank Details */}
									{result.details.vendorsWithoutBank.length > 0 && (
										<div className="mt-3">
											<strong className="text-edit">
												Vendors without Bank Details:
											</strong>
											<div className="mt-1 space-y-1">
												{result.details.vendorsWithoutBank.map(
													(vendor, index) => (
														<div
															key={index}
															className="flex justify-between text-xs"
														>
															<span>{vendor.vendorName}</span>
															<span className="text-edit">{vendor.amount}</span>
														</div>
													)
												)}
											</div>
										</div>
									)}

									{/* Payout Results */}
									{result.details.payoutResults.length > 0 && (
										<div className="mt-3">
											<strong className="text-cta">Payout Results:</strong>
											<div className="mt-1 space-y-1">
												{result.details.payoutResults.map((payout, index) => (
													<div
														key={index}
														className="flex justify-between items-center text-xs"
													>
														<span>{payout.vendorName}</span>
														<div className="flex items-center gap-2">
															<span
																className={
																	payout.success
																		? "text-accent"
																		: "text-red-400"
																}
															>
																{payout.success ? "✓" : "✗"}
															</span>
															<span>{payout.amount}</span>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</details>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
