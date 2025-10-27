"use client";
// components/wallet/LedgerTable.tsx
import { useState, useMemo, useEffect } from "react";
import { WalletLedgerEntry, LedgerType, LedgerSource } from "@/types/wallet";
import { formatCurrency, formatDate } from "@/lib/wallet/mock";
import Card from "@/components/dashboard/Card";
import { Button } from "@/components/ui/button";

interface LedgerTableProps {
	entries: WalletLedgerEntry[];
	filters?: {
		sources: LedgerSource[];
		types: LedgerType[];
		minAmount: number | null;
		maxAmount: number | null;
	};
}

export default function LedgerTable({ entries, filters }: LedgerTableProps) {
	const [sortField, setSortField] = useState<"date" | "amount" | "type">(
		"date"
	);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const [currentPage, setCurrentPage] = useState(1);
	const [entriesPerPage, setEntriesPerPage] = useState(25);

	// Apply filters to entries
	const filteredEntries = useMemo(() => {
		if (!filters) return entries;

		return entries.filter((entry) => {
			// Filter by source
			if (
				filters.sources.length > 0 &&
				!filters.sources.includes(entry.source)
			) {
				return false;
			}

			// Filter by type
			if (filters.types.length > 0 && !filters.types.includes(entry.type)) {
				return false;
			}

			// Filter by amount range
			if (filters.minAmount !== null && entry.amountMinor < filters.minAmount) {
				return false;
			}
			if (filters.maxAmount !== null && entry.amountMinor > filters.maxAmount) {
				return false;
			}

			return true;
		});
	}, [entries, filters]);

	const getTypeColor = (type: string) => {
		switch (type) {
			case "credit_eligible":
				return "text-accent bg-accent/10";
			case "debit_hold":
				return "text-calm-2 bg-calm-2/10";
			case "debit_payout":
				return "text-cta bg-cta/10";
			case "debit_refund":
				return "text-alert bg-alert/10";
			case "credit_release":
				return "text-edit bg-edit/10";
			default:
				return "text-text-muted bg-stroke";
		}
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "credit_eligible":
				return "Credit Eligible";
			case "debit_hold":
				return "Debit Hold";
			case "debit_payout":
				return "Debit Payout";
			case "debit_refund":
				return "Debit Refund";
			case "credit_release":
				return "Credit Release";
			default:
				return type;
		}
	};

	const getSourceLabel = (source: string) => {
		return source.charAt(0).toUpperCase() + source.slice(1);
	};

	const formatStoreId = (orderRef: WalletLedgerEntry["orderRef"]) => {
		if (!orderRef || orderRef.collection !== "storeOrders") return "—";
		// For store orders, use the actual store order ID
		return `ST-${orderRef.id.slice(-6)}`;
	};

	const formatEventId = (eventId: string | null | undefined) => {
		if (!eventId) return "—";
		return `EV-${eventId.slice(-6)}`;
	};

	const getRelevantId = (entry: WalletLedgerEntry) => {
		if (entry.source === "store") {
			return formatStoreId(entry.orderRef);
		} else if (entry.source === "event") {
			return formatEventId(entry.eventId);
		}
		return "—";
	};

	const handleSort = (field: "date" | "amount" | "type") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("desc");
		}
	};

	// Sort filtered entries
	const sortedEntries = useMemo(() => {
		return [...filteredEntries].sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case "date":
					comparison = a.createdAt - b.createdAt;
					break;
				case "amount":
					comparison = a.amountMinor - b.amountMinor;
					break;
				case "type":
					comparison = a.type.localeCompare(b.type);
					break;
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});
	}, [filteredEntries, sortField, sortDirection]);

	// Pagination calculations
	const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
	const startIndex = (currentPage - 1) * entriesPerPage;
	const endIndex = startIndex + entriesPerPage;
	const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

	// Reset to first page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [
		filters?.sources,
		filters?.types,
		filters?.minAmount,
		filters?.maxAmount,
	]);

	// CSV Export functionality
	const exportToCSV = () => {
		const headers = ["Date", "Type", "Source", "ID", "Amount (₦)", "Note"];

		const csvData = sortedEntries.map((entry) => [
			formatDate(entry.createdAt),
			getTypeLabel(entry.type),
			getSourceLabel(entry.source),
			getRelevantId(entry),
			`${entry.type.startsWith("debit") ? "-" : "+"}${(
				Math.abs(entry.amountMinor) / 100
			).toFixed(2)}`, // Convert to major units with correct sign
			entry.note || "",
		]);

		const csvContent = [
			headers.join(","),
			...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`wallet-transactions-${new Date().toISOString().split("T")[0]}.csv`
		);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Handle pagination
	const handlePageChange = (page: number) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
		setEntriesPerPage(newEntriesPerPage);
		setCurrentPage(1); // Reset to first page
	};

	const SortIcon = ({ field }: { field: "date" | "amount" | "type" }) => {
		if (sortField !== field) {
			return <span className="text-text-muted/50">↕</span>;
		}
		return (
			<span className="text-text-muted">
				{sortDirection === "asc" ? "↑" : "↓"}
			</span>
		);
	};

	return (
		<Card
			title={`Transaction History ${
				filters &&
				(filters.sources.length > 0 ||
					filters.types.length > 0 ||
					filters.minAmount !== null ||
					filters.maxAmount !== null)
					? `(${sortedEntries.length} filtered)`
					: `(${entries.length} total)`
			}`}
			right={
				<div className="flex items-center gap-2">
					<Button
						text="Export CSV"
						variant="secondary"
						onClick={exportToCSV}
						disabled={sortedEntries.length === 0}
						title={
							sortedEntries.length === 0
								? "No data to export"
								: "Export all filtered transactions"
						}
					/>
					{/* Demo Controls */}
					{/* <div className="flex items-center gap-1 ml-4">
						<button
							onClick={() => setTableState("loading")}
							className="px-2 py-1 text-xs rounded bg-stroke text-text-muted hover:bg-stroke/80"
						>
							Loading
						</button>
						<button
							onClick={() => setTableState("empty")}
							className="px-2 py-1 text-xs rounded bg-stroke text-text-muted hover:bg-stroke/80"
						>
							Empty
						</button>
						<button
							onClick={() => setTableState("error")}
							className="px-2 py-1 text-xs rounded bg-stroke text-text-muted hover:bg-stroke/80"
						>
							Error
						</button>
						<button
							onClick={() => setTableState("data")}
							className="px-2 py-1 text-xs rounded bg-stroke text-text-muted hover:bg-stroke/80"
						>
							Data
						</button>
					</div> */}
				</div>
			}
		>
			<div className="space-y-4">
				{/* Empty State - No transactions at all */}
				{entries.length === 0 && (
					<div className="text-center py-12">
						<div className="text-text-muted text-lg mb-2">
							No transactions yet
						</div>
						<p className="text-text-muted/70">
							Your transaction history will appear here
						</p>
					</div>
				)}

				{/* No Results from Filters */}
				{entries.length > 0 && sortedEntries.length === 0 && (
					<div className="text-center py-12">
						<div className="text-text-muted text-lg mb-2">
							No transactions match your filters
						</div>
						<p className="text-text-muted/70">
							Try adjusting your filter criteria
						</p>
					</div>
				)}

				{/* Data State */}
				{sortedEntries.length > 0 && (
					<>
						{/* Table */}
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-stroke/60">
										<th
											className="text-left py-3 px-2 text-sm font-medium text-text-muted cursor-pointer hover:text-text"
											onClick={() => handleSort("date")}
										>
											<div className="flex items-center gap-1">
												Date
												<SortIcon field="date" />
											</div>
										</th>
										<th
											className="text-left py-3 px-2 text-sm font-medium text-text-muted cursor-pointer hover:text-text"
											onClick={() => handleSort("type")}
										>
											<div className="flex items-center gap-1">
												Type
												<SortIcon field="type" />
											</div>
										</th>
										<th className="text-left py-3 px-2 text-sm font-medium text-text-muted">
											Source
										</th>
										<th className="text-left py-3 px-2 text-sm font-medium text-text-muted">
											ID
										</th>
										<th
											className="text-left py-3 px-2 text-sm font-medium text-text-muted cursor-pointer hover:text-text"
											onClick={() => handleSort("amount")}
										>
											<div className="flex items-center gap-1">
												Amount
												<SortIcon field="amount" />
											</div>
										</th>
										<th className="text-left py-3 px-2 text-sm font-medium text-text-muted">
											Note
										</th>
									</tr>
								</thead>
								<tbody>
									{paginatedEntries.map((entry, index) => (
										<tr
											key={`${entry.vendorId}-${entry.createdAt}-${index}`}
											className="border-b border-stroke/30 hover:bg-surface/50 transition-colors"
										>
											<td className="py-3 px-2 text-sm text-text">
												{formatDate(entry.createdAt)}
											</td>
											<td className="py-3 px-2">
												<span
													className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
														entry.type
													)}`}
												>
													{getTypeLabel(entry.type)}
												</span>
											</td>
											<td className="py-3 px-2 text-sm text-text">
												{getSourceLabel(entry.source)}
											</td>
											<td className="py-3 px-2 text-sm text-text-muted font-mono">
												{getRelevantId(entry)}
											</td>
											<td
												className={`py-3 px-2 text-sm font-medium ${
													entry.type.startsWith("debit")
														? "text-alert"
														: "text-accent"
												}`}
											>
												{entry.type.startsWith("debit") ? "-" : "+"}
												{formatCurrency(Math.abs(entry.amountMinor))}
											</td>
											<td className="py-3 px-2 text-sm text-text-muted max-w-xs truncate">
												{entry.note || "—"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{sortedEntries.length > 0 && (
							<div className="flex items-center justify-between pt-4 border-t border-stroke/60">
								<div className="flex items-center gap-2">
									<span className="text-sm text-text-muted">Show</span>
									<select
										value={entriesPerPage}
										onChange={(e) =>
											handleEntriesPerPageChange(Number(e.target.value))
										}
										className="px-2 py-1 text-sm rounded bg-surface text-text border border-stroke focus:border-accent focus:outline-none"
									>
										<option value={10}>10</option>
										<option value={25}>25</option>
										<option value={50}>50</option>
										<option value={100}>100</option>
									</select>
									<span className="text-sm text-text-muted">entries</span>
									<span className="text-sm text-text-muted">
										({startIndex + 1}-{Math.min(endIndex, sortedEntries.length)}{" "}
										of {sortedEntries.length})
									</span>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
										className={`px-3 py-1 text-sm rounded transition-colors ${
											currentPage === 1
												? "bg-stroke text-text-muted cursor-not-allowed opacity-50"
												: "bg-surface text-text border border-stroke hover:bg-surface/80"
										}`}
									>
										Previous
									</button>

									{/* Page numbers */}
									<div className="flex items-center gap-1">
										{(() => {
											const pages = [];
											const maxVisiblePages = 5;
											let startPage = Math.max(
												1,
												currentPage - Math.floor(maxVisiblePages / 2)
											);
											const endPage = Math.min(
												totalPages,
												startPage + maxVisiblePages - 1
											);

											// Adjust start page if we're near the end
											if (endPage - startPage < maxVisiblePages - 1) {
												startPage = Math.max(1, endPage - maxVisiblePages + 1);
											}

											// Show first page and ellipsis if needed
											if (startPage > 1) {
												pages.push(
													<button
														key={1}
														onClick={() => handlePageChange(1)}
														className="px-2 py-1 text-sm rounded bg-surface text-text border border-stroke hover:bg-surface/80 transition-colors"
													>
														1
													</button>
												);
												if (startPage > 2) {
													pages.push(
														<span
															key="ellipsis1"
															className="px-2 py-1 text-sm text-text-muted"
														>
															...
														</span>
													);
												}
											}

											// Show visible pages
											for (let i = startPage; i <= endPage; i++) {
												pages.push(
													<button
														key={i}
														onClick={() => handlePageChange(i)}
														className={`px-2 py-1 text-sm rounded transition-colors ${
															i === currentPage
																? "bg-cta text-text font-semibold"
																: "bg-surface text-text border border-stroke hover:bg-surface/80"
														}`}
													>
														{i}
													</button>
												);
											}

											// Show ellipsis and last page if needed
											if (endPage < totalPages) {
												if (endPage < totalPages - 1) {
													pages.push(
														<span
															key="ellipsis2"
															className="px-2 py-1 text-sm text-text-muted"
														>
															...
														</span>
													);
												}
												pages.push(
													<button
														key={totalPages}
														onClick={() => handlePageChange(totalPages)}
														className="px-2 py-1 text-sm rounded bg-surface text-text border border-stroke hover:bg-surface/80 transition-colors"
													>
														{totalPages}
													</button>
												);
											}

											return pages;
										})()}
									</div>

									<button
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage === totalPages}
										className={`px-3 py-1 text-sm rounded transition-colors ${
											currentPage === totalPages
												? "bg-stroke text-text-muted cursor-not-allowed opacity-50"
												: "bg-surface text-text border border-stroke hover:bg-surface/80"
										}`}
									>
										Next
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</Card>
	);
}
