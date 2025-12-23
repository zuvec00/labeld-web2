// components/wallet/TestPayoutPanel.tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	runTestPayout,
	runTestPayoutReminders,
	runTestRetryFailedPayouts,
	PayoutTestResult,
	PayoutReminderResult,
	PayoutRetryResult,
} from "@/lib/firebase/callables/payout";
import {
	CheckCircle,
	AlertCircle,
	Info,
	Play,
	Mail,
	RotateCcw,
} from "lucide-react";

export default function TestPayoutPanel() {
	const [loading, setLoading] = useState<string | null>(null);
	const [results, setResults] = useState<{
		payout?: PayoutTestResult;
		reminders?: PayoutReminderResult;
		retry?: PayoutRetryResult;
	}>({});
	const [error, setError] = useState<string | null>(null);

	const [testMode, setTestMode] = useState(true);
	const [dryRun, setDryRun] = useState(true);

	const handleTestPayout = async () => {
		setLoading("payout");
		setError(null);
		try {
			const result = await runTestPayout(testMode, dryRun);
			setResults((prev) => ({ ...prev, payout: result }));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to run test payout"
			);
		} finally {
			setLoading(null);
		}
	};

	const handleTestReminders = async () => {
		setLoading("reminders");
		setError(null);
		try {
			const result = await runTestPayoutReminders(dryRun);
			setResults((prev) => ({ ...prev, reminders: result }));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to run test reminders"
			);
		} finally {
			setLoading(null);
		}
	};

	const handleTestRetry = async () => {
		setLoading("retry");
		setError(null);
		try {
			const result = await runTestRetryFailedPayouts(dryRun);
			setResults((prev) => ({ ...prev, retry: result }));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to run test retry");
		} finally {
			setLoading(null);
		}
	};

	const clearResults = () => {
		setResults({});
		setError(null);
	};

	return (
		<div className="rounded-2xl bg-surface border border-stroke p-6">
			<div className="flex items-center gap-2 mb-4">
				<Info className="w-5 h-5 text-accent" />
				<h3 className="font-heading font-semibold text-lg">
					Test Payout System
				</h3>
			</div>

			<p className="text-text-muted text-sm mb-6">
				Test the payout system with different configurations. Use dry run mode
				to simulate without actual transactions.
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

			{/* Action Buttons */}
			<div className="grid gap-3 sm:grid-cols-3 mb-6">
				<Button
					variant="outline"
					text={loading === "payout" ? "Processing..." : "Test Payout"}
					leftIcon={
						loading === "payout" ? (
							<Spinner size="sm" />
						) : (
							<Play className="w-4 h-4" />
						)
					}
					onClick={handleTestPayout}
					disabled={loading !== null}
					className="w-full"
				/>
				<Button
					variant="outline"
					text={loading === "reminders" ? "Sending..." : "Test Reminders"}
					leftIcon={
						loading === "reminders" ? (
							<Spinner size="sm" />
						) : (
							<Mail className="w-4 h-4" />
						)
					}
					onClick={handleTestReminders}
					disabled={loading !== null}
					className="w-full"
				/>
				<Button
					variant="outline"
					text={loading === "retry" ? "Retrying..." : "Test Retry"}
					leftIcon={
						loading === "retry" ? (
							<Spinner size="sm" />
						) : (
							<RotateCcw className="w-4 h-4" />
						)
					}
					onClick={handleTestRetry}
					disabled={loading !== null}
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
			{(results.payout || results.reminders || results.retry) && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Test Results</h4>
						<Button
							variant="outline"
							text="Clear"
							onClick={clearResults}
							className="text-xs px-3 py-1"
						/>
					</div>

					{/* Payout Results */}
					{results.payout && (
						<div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
							<div className="flex items-center gap-2 mb-3">
								<CheckCircle className="w-4 h-4 text-accent" />
								<span className="font-medium text-sm">Payout Test Results</span>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
								<div>
									<div className="text-text-muted">Total Vendors</div>
									<div className="font-medium">
										{results.payout.results.totalVendors}
									</div>
								</div>
								<div>
									<div className="text-text-muted">Successful</div>
									<div className="font-medium text-accent">
										{results.payout.results.successful}
									</div>
								</div>
								<div>
									<div className="text-text-muted">Failed</div>
									<div className="font-medium text-red-400">
										{results.payout.results.failed}
									</div>
								</div>
								<div>
									<div className="text-text-muted">Skipped</div>
									<div className="font-medium text-edit">
										{results.payout.results.skipped}
									</div>
								</div>
							</div>
							{results.payout.details && (
								<div className="mt-4 space-y-3">
									{/* Vendors with Bank Details */}
									{results.payout.details.vendorsWithBank.length > 0 && (
										<details className="group">
											<summary className="text-xs font-medium text-text cursor-pointer hover:text-accent flex items-center gap-2">
												<span>
													✓ Vendors with Bank (
													{results.payout.details.vendorsWithBank.length})
												</span>
											</summary>
											<div className="mt-2 overflow-x-auto">
												<table className="w-full text-xs">
													<thead className="border-b border-stroke">
														<tr>
															<th className="text-left py-2 px-2 text-text-muted">
																Vendor ID
															</th>
															<th className="text-left py-2 px-2 text-text-muted">
																Name
															</th>
															<th className="text-right py-2 px-2 text-text-muted">
																Amount
															</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-stroke/50">
														{results.payout.details.vendorsWithBank.map(
															(vendor, idx) => (
																<tr key={idx} className="hover:bg-bg/50">
																	<td className="py-2 px-2 font-mono text-text-muted">
																		{vendor.vendorId}
																	</td>
																	<td className="py-2 px-2">
																		{vendor.vendorName || "—"}
																	</td>
																	<td className="py-2 px-2 text-right font-mono">
																		{vendor.amount}
																	</td>
																</tr>
															)
														)}
													</tbody>
												</table>
											</div>
										</details>
									)}

									{/* Vendors without Bank Details */}
									{results.payout.details.vendorsWithoutBank.length > 0 && (
										<details className="group">
											<summary className="text-xs font-medium text-alert cursor-pointer hover:text-red-400 flex items-center gap-2">
												<span>
													⚠ Vendors without Bank (
													{results.payout.details.vendorsWithoutBank.length})
												</span>
											</summary>
											<div className="mt-2 overflow-x-auto">
												<table className="w-full text-xs">
													<thead className="border-b border-stroke">
														<tr>
															<th className="text-left py-2 px-2 text-text-muted">
																Vendor ID
															</th>
															<th className="text-left py-2 px-2 text-text-muted">
																Name
															</th>
															<th className="text-right py-2 px-2 text-text-muted">
																Amount
															</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-stroke/50">
														{results.payout.details.vendorsWithoutBank.map(
															(vendor, idx) => (
																<tr key={idx} className="hover:bg-bg/50">
																	<td className="py-2 px-2 font-mono text-text-muted">
																		{vendor.vendorId}
																	</td>
																	<td className="py-2 px-2">
																		{vendor.vendorName || "—"}
																	</td>
																	<td className="py-2 px-2 text-right font-mono">
																		{vendor.amount}
																	</td>
																</tr>
															)
														)}
													</tbody>
												</table>
											</div>
										</details>
									)}

									{/* Payout Results */}
									{results.payout.details.payoutResults &&
										results.payout.details.payoutResults.length > 0 && (
											<details className="group">
												<summary className="text-xs font-medium text-text cursor-pointer hover:text-accent flex items-center gap-2">
													<span>
														📋 Payout Results (
														{results.payout.details.payoutResults.length})
													</span>
												</summary>
												<div className="mt-2 overflow-x-auto">
													<table className="w-full text-xs">
														<thead className="border-b border-stroke">
															<tr>
																<th className="text-left py-2 px-2 text-text-muted">
																	Vendor ID
																</th>
																<th className="text-left py-2 px-2 text-text-muted">
																	Name
																</th>
																<th className="text-right py-2 px-2 text-text-muted">
																	Amount
																</th>
																<th className="text-center py-2 px-2 text-text-muted">
																	Status
																</th>
																<th className="text-left py-2 px-2 text-text-muted">
																	Details
																</th>
															</tr>
														</thead>
														<tbody className="divide-y divide-stroke/50">
															{results.payout.details.payoutResults.map(
																(result, idx) => (
																	<tr key={idx} className="hover:bg-bg/50">
																		<td className="py-2 px-2 font-mono text-text-muted">
																			{result.vendorId}
																		</td>
																		<td className="py-2 px-2">
																			{result.vendorName || "—"}
																		</td>
																		<td className="py-2 px-2 text-right font-mono">
																			{result.amount}
																		</td>
																		<td className="py-2 px-2 text-center">
																			{result.success ? (
																				<span className="text-accent">✓</span>
																			) : (
																				<span className="text-alert">✗</span>
																			)}
																		</td>
																		<td className="py-2 px-2 text-text-muted">
																			{result.transferCode && (
																				<span className="font-mono">
																					{result.transferCode}
																				</span>
																			)}
																			{result.error && (
																				<span className="text-alert">
																					{result.error}
																				</span>
																			)}
																		</td>
																	</tr>
																)
															)}
														</tbody>
													</table>
												</div>
											</details>
										)}

									{results.payout.results.batchId && (
										<div className="text-xs text-text-muted">
											<strong>Batch ID:</strong>{" "}
											<span className="font-mono">
												{results.payout.results.batchId}
											</span>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* Reminder Results */}
					{results.reminders && (
						<div className="bg-edit/5 border border-edit/20 rounded-xl p-4">
							<div className="flex items-center gap-2 mb-3">
								<CheckCircle className="w-4 h-4 text-edit" />
								<span className="font-medium text-sm">
									Reminder Test Results
								</span>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
								<div>
									<div className="text-text-muted">Total Vendors</div>
									<div className="font-medium">
										{results.reminders.results.totalVendors}
									</div>
								</div>
								<div>
									<div className="text-text-muted">Emails Sent</div>
									<div className="font-medium text-accent">
										{results.reminders.results.emailsSent}
									</div>
								</div>
								<div>
									<div className="text-text-muted">Emails Failed</div>
									<div className="font-medium text-red-400">
										{results.reminders.results.emailsFailed}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Retry Results */}
					{results.retry && (
						<div className="bg-cta/5 border border-cta/20 rounded-xl p-4">
							<div className="flex items-center gap-2 mb-3">
								<CheckCircle className="w-4 h-4 text-cta" />
								<span className="font-medium text-sm">Retry Test Results</span>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
								<div>
									<div className="text-text-muted">Total Retries</div>
									<div className="font-medium">
										{results.retry.results.totalRetries}
									</div>
								</div>
								<div>
									<div className="text-text-muted">Successful</div>
									<div className="font-medium text-accent">
										{results.retry.results.successful}
									</div>
								</div>
								<div>
									<div className="text-text-muted">Failed</div>
									<div className="font-medium text-red-400">
										{results.retry.results.failed}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
