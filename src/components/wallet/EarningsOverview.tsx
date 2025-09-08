// components/wallet/EarningsOverview.tsx
import { useState } from "react";
import { EarningsBySource, WalletLedgerEntry } from "@/types/wallet";
import { formatCurrency } from "@/lib/wallet/mock";
import Card from "@/components/dashboard/Card";

interface EarningsOverviewProps {
	entries: WalletLedgerEntry[];
}

type PeriodType = "today" | "7days" | "30days" | "custom";

export default function EarningsOverview({ entries }: EarningsOverviewProps) {
	const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("7days");

	// Calculate date ranges
	const getDateRange = (period: PeriodType) => {
		const now = Date.now();
		const oneDay = 24 * 60 * 60 * 1000;

		switch (period) {
			case "today":
				const startOfDay = new Date();
				startOfDay.setHours(0, 0, 0, 0);
				return {
					start: startOfDay.getTime(),
					end: now,
					label: "Today",
				};
			case "7days":
				return {
					start: now - 7 * oneDay,
					end: now,
					label: "Last 7 days",
				};
			case "30days":
				return {
					start: now - 30 * oneDay,
					end: now,
					label: "Last 30 days",
				};
			case "custom":
				// For now, default to 30 days - in a real app you'd have a date picker
				return {
					start: now - 30 * oneDay,
					end: now,
					label: "Custom period",
				};
			default:
				return {
					start: now - 7 * oneDay,
					end: now,
					label: "Last 7 days",
				};
		}
	};

	// Filter entries by selected period
	const dateRange = getDateRange(selectedPeriod);
	const filteredEntries = entries.filter(
		(entry) =>
			entry.createdAt >= dateRange.start && entry.createdAt <= dateRange.end
	);

	// Calculate earnings from filtered entries
	const calculateEarningsFromEntries = (
		entries: WalletLedgerEntry[]
	): EarningsBySource => {
		const result: EarningsBySource = {
			event: { eligibleMinor: 0, onHoldMinor: 0 },
			store: { eligibleMinor: 0, onHoldMinor: 0 },
		};

		entries.forEach((entry) => {
			if (entry.type === "credit_eligible") {
				if (entry.source === "event") {
					result.event.eligibleMinor += entry.amountMinor;
				} else if (entry.source === "store") {
					result.store.eligibleMinor += entry.amountMinor;
				}
			} else if (entry.type === "debit_hold") {
				if (entry.source === "event") {
					result.event.onHoldMinor += entry.amountMinor;
				} else if (entry.source === "store") {
					result.store.onHoldMinor += entry.amountMinor;
				}
			}
		});

		return result;
	};

	const periodEarnings = calculateEarningsFromEntries(filteredEntries);

	return (
		<Card title="Earnings Overview">
			<div className="space-y-6">
				{/* No transactions message */}
				{filteredEntries.length === 0 && (
					<div className="text-center py-8">
						<div className="text-text-muted text-sm mb-2">
							No transactions found
						</div>
						<p className="text-text-muted/70 text-xs">
							No earnings recorded for the selected period
						</p>
					</div>
				)}

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Events Earnings */}
					<div className="rounded-[16px] bg-bg border border-stroke p-4 hover:border-cta/30 transition-colors group">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-sm font-medium text-text-muted">
								Events Earnings
							</h4>
							<div className="w-2 h-2 bg-cta rounded-full group-hover:scale-110 transition-transform"></div>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-xs text-text-muted">Eligible</span>
								<span className="text-sm font-semibold text-accent">
									{formatCurrency(periodEarnings.event.eligibleMinor)}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-xs text-text-muted">On Hold</span>
								<span className="text-sm font-semibold text-calm-2">
									{formatCurrency(periodEarnings.event.onHoldMinor)}
								</span>
							</div>
						</div>
					</div>

					{/* Store Earnings */}
					<div className="rounded-[16px] bg-bg border border-stroke p-4 hover:border-calm-1/30 transition-colors group">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-sm font-medium text-text-muted">
								Store Earnings
							</h4>
							<div className="w-2 h-2 bg-calm-1 rounded-full group-hover:scale-110 transition-transform"></div>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-xs text-text-muted">Eligible</span>
								<span className="text-sm font-semibold text-accent">
									{formatCurrency(periodEarnings.store.eligibleMinor)}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-xs text-text-muted">On Hold</span>
								<span className="text-sm font-semibold text-calm-2">
									{formatCurrency(periodEarnings.store.onHoldMinor)}
								</span>
							</div>
						</div>
					</div>

					{/* This Period Total */}
					<div className="rounded-[16px] bg-bg border border-stroke p-4 hover:border-edit/30 transition-colors group">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-sm font-medium text-text-muted">
								This Period Total
							</h4>
							<div className="w-2 h-2 bg-edit rounded-full group-hover:scale-110 transition-transform"></div>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-xs text-text-muted">Eligible</span>
								<span className="text-lg font-heading font-semibold text-edit">
									{formatCurrency(
										periodEarnings.event.eligibleMinor +
											periodEarnings.store.eligibleMinor
									)}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Date Range Control & Legend */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-stroke/60">
					{/* Date Range Control */}
					<div className="flex items-center gap-2">
						<span className="text-sm text-text-muted">Period:</span>
						<div className="flex items-center gap-1">
							{[
								{ key: "today", label: "Today" },
								{ key: "7days", label: "7 days" },
								{ key: "30days", label: "30 days" },
								// { key: "custom", label: "Custom" },
							].map((period) => (
								<button
									key={period.key}
									onClick={() => setSelectedPeriod(period.key as PeriodType)}
									className={`px-3 py-1 text-xs rounded-lg transition-colors ${
										selectedPeriod === period.key
											? "bg-cta text-text font-semibold"
											: "bg-stroke text-text-muted hover:bg-stroke/80"
									}`}
								>
									{period.label}
								</button>
							))}
						</div>
						<span className="text-xs text-text-muted ml-2">
							({dateRange.label} • {filteredEntries.length} transactions)
						</span>
					</div>

					{/* Legend */}
					<div className="flex items-center gap-4 text-xs">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-accent rounded-full"></div>
							<span className="text-text-muted">Eligible</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-calm-2 rounded-full"></div>
							<span className="text-text-muted">On Hold</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
