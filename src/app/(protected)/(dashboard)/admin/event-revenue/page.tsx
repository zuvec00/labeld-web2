"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import Card from "@/components/dashboard/Card";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import {
	getEventRevenueBreakdown,
	RevenueBreakdownSummary,
} from "@/lib/firebase/admin/revenue";
import { getDateRange } from "@/lib/orders/helpers";
import { formatCurrency } from "@/lib/checkout/calc";
import { BarChart3, TrendingUp, DollarSign, Calendar } from "lucide-react";

type DateRangeType =
	| "today"
	| "7days"
	| "30days"
	| "60days"
	| "90days"
	| "custom";

export default function AdminEventRevenuePage() {
	const { user } = useAuth();

	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<RevenueBreakdownSummary | null>(null);
	const [rangeType, setRangeType] = useState<DateRangeType>("30days");
	const [error, setError] = useState<string | null>(null);

	// Custom range state
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [showCustomPicker, setShowCustomPicker] = useState(false);

	const fetchRevenueData = async () => {
		setLoading(true);
		setError(null);
		try {
			let range;
			if (rangeType === "custom") {
				if (!customStart || !customEnd) return; // Don't fetch if incomplete
				range = getDateRange("custom", {
					start: new Date(customStart),
					end: new Date(customEnd), // Typically end of day, but simple date is start of day 00:00.
					// ideally we'd set end to 23:59:59 if the user picks a date.
					// For now, let's just use what getDateRange expects or adjust.
				});
				// Adjust end date to be end of day to be inclusive
				range.end.setHours(23, 59, 59, 999);
			} else {
				range = getDateRange(rangeType);
			}

			const result = await getEventRevenueBreakdown(range.start, range.end);
			setData(result);
		} catch (err: any) {
			console.error("Error fetching revenue breakdown:", err);
			setError("Failed to fetch revenue data. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (rangeType !== "custom") {
			setShowCustomPicker(false);
			fetchRevenueData();
		} else {
			setShowCustomPicker(true);
		}
	}, [rangeType]);

	// Trigger fetch when applying custom range
	const handleApplyCustomRange = () => {
		if (customStart && customEnd) {
			fetchRevenueData();
		}
	};

	if (!user) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<p className="text-text-muted">Please log in to access this page.</p>
			</div>
		);
	}

	// Helper to format NGN using common util or local
	const fmt = (minor: number) => formatCurrency(minor, "NGN");

	return (
		<div className="space-y-8 min-h-dvh bg-bg px-4 sm:px-6 py-8 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
				<div>
					<h1 className="font-heading font-semibold text-2xl sm:text-3xl flex items-center gap-3 text-text">
						<BarChart3 className="w-8 h-8 text-accent" />
						Event Revenue Breakdown
					</h1>
					<p className="text-text-muted mt-1">
						Analyze revenue, platform fees, and net profit per event.
					</p>
				</div>

				{/* Date Range Selector */}
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-surface border border-stroke rounded-xl p-2 w-full sm:w-auto overflow-x-auto">
					<div className="flex bg-surface rounded-lg p-1 gap-1 min-w-max">
						{(
							[
								"today",
								"7days",
								"30days",
								"60days",
								"90days",
							] as DateRangeType[]
						).map((t) => (
							<button
								key={t}
								onClick={() => setRangeType(t)}
								className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all whitespace-nowrap ${
									rangeType === t
										? "bg-accent/10 text-accent font-medium shadow-sm"
										: "text-text-muted hover:text-text hover:bg-stroke/50"
								}`}
							>
								{t === "today"
									? "Today"
									: t === "7days"
									? "7d"
									: t === "30days"
									? "30d"
									: t === "60days"
									? "60d"
									: "90d"}
							</button>
						))}
						<button
							onClick={() => setRangeType("custom")}
							className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all flex items-center gap-1 ${
								rangeType === "custom"
									? "bg-accent/10 text-accent font-medium shadow-sm"
									: "text-text-muted hover:text-text hover:bg-stroke/50"
							}`}
						>
							<Calendar className="w-3 h-3" /> Custom
						</button>
					</div>

					{/* Custom Date Inputs */}
					{showCustomPicker && (
						<div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
							<input
								type="date"
								value={customStart}
								onChange={(e) => setCustomStart(e.target.value)}
								className="px-3 py-1.5 text-sm bg-bg border border-stroke rounded-md text-text focus:border-accent outline-none"
							/>
							<span className="text-text-muted">-</span>
							<input
								type="date"
								value={customEnd}
								onChange={(e) => setCustomEnd(e.target.value)}
								className="px-3 py-1.5 text-sm bg-bg border border-stroke rounded-md text-text focus:border-accent outline-none"
							/>
							<Button
								text="Go"
								size="sm"
								variant="secondary"
								onClick={handleApplyCustomRange}
								disabled={!customStart || !customEnd || loading}
								className="px-3 h-8"
							/>
						</div>
					)}
				</div>
			</div>

			{error && (
				<div className="bg-alert/10 border border-alert/20 text-alert p-4 rounded-xl">
					{error}
				</div>
			)}

			{loading ? (
				<div className="py-20 flex justify-center">
					<Spinner size="lg" />
				</div>
			) : data ? (
				<>
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card className="flex flex-col gap-2">
							<span className="text-sm text-text-muted flex items-center gap-2">
								<DollarSign className="w-4 h-4" /> Total Gross Revenue
							</span>
							<span className="text-3xl font-bold text-text">
								{fmt(data.totalGrossMinor)}
							</span>
							<span className="text-xs text-text-muted">
								Across {data.events.length} active events
							</span>
						</Card>

						<Card className="flex flex-col gap-2">
							<span className="text-sm text-text-muted flex items-center gap-2">
								<TrendingUp className="w-4 h-4" /> Total Platform Fees
							</span>
							<span className="text-3xl font-bold text-alert">
								-{fmt(data.totalFeesMinor)}
							</span>
							<span className="text-xs text-text-muted">
								Platform revenue from tickets & merch
							</span>
						</Card>

						<Card className="flex flex-col gap-2">
							<span className="text-sm text-text-muted flex items-center gap-2">
								<DollarSign className="w-4 h-4" /> Total Net Revenue
							</span>
							<span className="text-3xl font-bold text-cta">
								{fmt(data.totalNetMinor)}
							</span>
							<span className="text-xs text-text-muted">
								Payout liability to organizers
							</span>
						</Card>
					</div>

					{/* Breakdown Table */}
					<div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
						<div className="px-6 py-4 border-b border-stroke">
							<h2 className="font-heading font-semibold text-lg">
								Event Performance
							</h2>
						</div>

						<div className="overflow-x-auto">
							{data.events.length === 0 ? (
								<div className="p-12 text-center text-text-muted">
									No revenue data found for the selected period.
								</div>
							) : (
								<table className="w-full text-left text-sm">
									<thead className="bg-bg text-text-muted uppercase text-xs font-semibold">
										<tr>
											<th className="px-6 py-4">Event</th>
											<th className="px-6 py-4 text-right">Orders</th>
											<th className="px-6 py-4 text-right">Gross Revenue</th>
											<th className="px-6 py-4 text-right">Platform Fees</th>
											<th className="px-6 py-4 text-right">Net Revenue</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-stroke">
										{data.events.map((event) => (
											<tr
												key={event.eventId}
												className="hover:bg-bg/50 transition-colors"
											>
												<td className="px-6 py-4 font-medium text-text">
													<div>{event.eventTitle}</div>
													<div className="text-xs text-text-muted font-mono mt-0.5">
														{event.eventId}
													</div>
												</td>
												<td className="px-6 py-4 text-right text-text-muted">
													{event.orderCount.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right font-medium text-text">
													{fmt(event.grossRevenueMinor)}
												</td>
												<td className="px-6 py-4 text-right text-alert font-medium">
													-{fmt(event.platformFeesMinor)}
												</td>
												<td className="px-6 py-4 text-right text-cta font-bold">
													{fmt(event.netRevenueMinor)}
												</td>
											</tr>
										))}
									</tbody>
									{/* Footer Row */}
									<tfoot className="bg-bg/50 font-semibold text-text">
										<tr>
											<td className="px-6 py-4">TOTAL</td>
											<td className="px-6 py-4 text-right">
												{data.totalOrders.toLocaleString()}
											</td>
											<td className="px-6 py-4 text-right">
												{fmt(data.totalGrossMinor)}
											</td>
											<td className="px-6 py-4 text-right text-alert">
												-{fmt(data.totalFeesMinor)}
											</td>
											<td className="px-6 py-4 text-right text-cta">
												{fmt(data.totalNetMinor)}
											</td>
										</tr>
									</tfoot>
								</table>
							)}
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}
