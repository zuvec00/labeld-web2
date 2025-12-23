"use client";

import { useState } from "react";
import Card from "@/components/dashboard/Card";
import { getUpcomingPayout } from "@/lib/firebase/admin/payout";
import { minorToDisplay } from "@/lib/payout/utils";
import DateDisplay from "@/components/orders/Date"; // Renamed to avoid collision with global Date
import { Loader2 } from "lucide-react";

interface PayoutData {
	vendorId: string;
	nextPayoutDate: string;
	totalAmountMinor: number;
	futureAmountMinor?: number;
	walletBalanceMinor?: number;
	eligibleCount: number;
	futureCount?: number;
	breakdown: {
		eventId: string;
		amountMinor: number;
	}[];
	transactions?: {
		id: string;
		createdAt: number;
		amountMinor: number;
		eventId: string;
		orderId: string;
	}[];
	futureTransactions?: {
		id: string;
		createdAt: number;
		targetPayoutAt: number;
		amountMinor: number;
		eventId: string;
		orderId: string;
	}[];
}

export default function AdminUpcomingPayoutsPage() {
	const [vendorId, setVendorId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<PayoutData | null>(null);

	const handleCheckPayout = async () => {
		if (!vendorId.trim()) {
			setError("Please enter a Vendor ID");
			return;
		}

		setLoading(true);
		setError(null);
		setData(null);

		try {
			// Using the client-side version of getUpcomingPayout
			const result = await getUpcomingPayout(vendorId.trim());
			setData(result);
		} catch (err: any) {
			console.error(err);
			setError(err.message || "Failed to fetch payout details");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-heading font-semibold text-text mb-2">
					Admin: Upcoming Payouts
				</h1>
				<p className="text-text-muted">
					Check upcoming payout details for a specific vendor.
				</p>
			</div>

			<Card>
				<div className="flex items-end gap-4">
					<div className="flex-1">
						<label className="block text-sm font-medium text-text-muted mb-1">
							Vendor User ID
						</label>
						<input
							type="text"
							value={vendorId}
							onChange={(e) => setVendorId(e.target.value)}
							className="w-full px-4 py-2 bg-surface border border-stroke rounded-lg text-text focus:outline-none focus:border-primary"
							placeholder="e.g. user_123..."
						/>
					</div>
					<button
						onClick={handleCheckPayout}
						disabled={loading}
						className="px-6 py-2 bg-cta text-text rounded-lg hover:bg-cta/90 transition-colors disabled:opacity-50 flex items-center gap-2"
					>
						{loading && <Loader2 className="w-4 h-4 animate-spin" />}
						{loading ? "Checking..." : "Check Payout"}
					</button>
				</div>
				{error && <p className="mt-2 text-alert text-sm">{error}</p>}
			</Card>

			{data && (
				<div className="space-y-6">
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						<Card>
							<div className="text-text-muted text-sm mb-1">Next Payout</div>
							<div className="text-2xl font-semibold text-cta">
								{minorToDisplay(data.totalAmountMinor)}
							</div>
							<div className="text-xs text-text-muted mt-1">
								{data.eligibleCount} credits
							</div>
						</Card>
						<Card>
							<div className="text-text-muted text-sm mb-1">Future Payouts</div>
							<div className="text-2xl font-semibold text-edit">
								{minorToDisplay(data.futureAmountMinor || 0)}
							</div>
							<div className="text-xs text-text-muted mt-1">
								{data.futureCount || 0} credits
							</div>
						</Card>
						<Card>
							<div className="text-text-muted text-sm mb-1">Wallet Balance</div>
							<div className="text-2xl font-semibold text-text">
								{minorToDisplay(data.walletBalanceMinor || 0)}
							</div>
						</Card>
						<Card>
							<div className="text-text-muted text-sm mb-1">Total Match</div>
							<div className="text-2xl font-semibold">
								{data.totalAmountMinor + (data.futureAmountMinor || 0) ===
								(data.walletBalanceMinor || 0) ? (
									<span className="text-green-600">✓ Match</span>
								) : (
									<span className="text-alert">⚠ Diff</span>
								)}
							</div>
							{data.totalAmountMinor + (data.futureAmountMinor || 0) !==
								(data.walletBalanceMinor || 0) && (
								<div className="text-xs text-text-muted mt-1">
									{minorToDisplay(
										Math.abs(
											data.totalAmountMinor +
												(data.futureAmountMinor || 0) -
												(data.walletBalanceMinor || 0)
										)
									)}
								</div>
							)}
							<div className="text-xs text-text-muted mt-1">
								Next:{" "}
								{new Date(data.nextPayoutDate).toLocaleDateString(undefined, {
									month: "short",
									day: "numeric",
								})}
							</div>
						</Card>
					</div>

					{/* Breakdown Table */}
					<Card>
						<h3 className="text-lg font-medium text-text mb-4">
							Breakdown by Event
						</h3>
						{data.breakdown.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="w-full text-left">
									<thead className="border-b border-stroke">
										<tr>
											<th className="py-2 font-medium text-text-muted">
												Event ID
											</th>
											<th className="py-2 font-medium text-text-muted text-right">
												Amount
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stroke">
										{data.breakdown.map((item, idx) => (
											<tr key={idx}>
												<td className="py-3 text-text font-mono text-sm">
													{item.eventId}
												</td>
												<td className="py-3 text-text text-right font-mono">
													{minorToDisplay(item.amountMinor)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-text-muted text-sm">
								No eligible credits found for the upcoming cycle.
							</p>
						)}
					</Card>

					{/* Transactions Table */}
					<Card>
						<h3 className="text-lg font-medium text-text mb-4">
							Payout Transactions
						</h3>
						{data.transactions && data.transactions.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="w-full text-left">
									<thead className="border-b border-stroke">
										<tr>
											<th className="py-2 px-2 font-medium text-text-muted text-xs uppercase tracking-wider">
												Created At
											</th>
											<th className="py-2 px-2 font-medium text-text-muted text-xs uppercase tracking-wider">
												Source Event
											</th>
											<th className="py-2 px-2 font-medium text-text-muted text-xs uppercase tracking-wider">
												Order Ref
											</th>
											<th className="py-2 px-2 font-medium text-text-muted text-right text-xs uppercase tracking-wider">
												Amount
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stroke">
										{data.transactions.map((tx) => (
											<tr key={tx.id} className="hover:bg-bg/50">
												<td className="py-3 px-2 text-text text-sm">
													<DateDisplay timestamp={tx.createdAt} />
												</td>
												<td className="py-3 px-2 text-text-muted text-sm font-mono">
													{tx.eventId}
												</td>
												<td className="py-3 px-2 text-text-muted text-sm font-mono">
													{tx.orderId}
												</td>
												<td className="py-3 px-2 text-text text-right font-mono font-medium">
													{minorToDisplay(tx.amountMinor)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-text-muted text-sm">
								No eligible credits found for the upcoming cycle.
							</p>
						)}
						<div className="mt-4 pt-4 border-t border-stroke text-xs text-text-muted">
							Showing {data.transactions?.length || 0} eligible transactions
							scheduled for the next payout.
						</div>
					</Card>

					{/* Future Payouts Table */}
					{data.futureTransactions && data.futureTransactions.length > 0 && (
						<Card>
							<h3 className="text-lg font-medium text-text mb-4">
								Future Payouts (After Next Cycle)
							</h3>
							<div className="overflow-x-auto">
								<table className="w-full text-left">
									<thead className="border-b border-stroke">
										<tr>
											<th className="py-2 px-2 font-medium text-text-muted text-xs uppercase tracking-wider">
												Created At
											</th>
											<th className="py-2 px-2 font-medium text-text-muted text-xs uppercase tracking-wider">
												Scheduled For
											</th>
											<th className="py-2 px-2 font-medium text-text-muted text-xs uppercase tracking-wider">
												Source Event
											</th>
											<th className="py-2 px-2 font-medium text-text-muted text-xs uppercase tracking-wider">
												Order Ref
											</th>
											<th className="py-2 px-2 font-medium text-text-muted text-right text-xs uppercase tracking-wider">
												Amount
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stroke">
										{data.futureTransactions.map((tx) => (
											<tr key={tx.id} className="hover:bg-bg/50">
												<td className="py-3 px-2 text-text text-sm">
													<DateDisplay timestamp={tx.createdAt} />
												</td>
												<td className="py-3 px-2 text-edit text-sm">
													<DateDisplay timestamp={tx.targetPayoutAt} />
												</td>
												<td className="py-3 px-2 text-text-muted text-sm font-mono">
													{tx.eventId}
												</td>
												<td className="py-3 px-2 text-text-muted text-sm font-mono">
													{tx.orderId}
												</td>
												<td className="py-3 px-2 text-text text-right font-mono font-medium">
													{minorToDisplay(tx.amountMinor)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className="mt-4 pt-4 border-t border-stroke text-xs text-text-muted">
								Showing {data.futureTransactions.length} transactions scheduled
								for future payout cycles.
							</div>
						</Card>
					)}
				</div>
			)}
		</div>
	);
}
