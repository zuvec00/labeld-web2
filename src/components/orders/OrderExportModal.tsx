"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Download, Mail, Calendar, Check, Loader2 } from "lucide-react";
import {
	ExportField,
	EXPORT_FIELD_LABELS,
	DEFAULT_SELECTED_FIELDS,
	exportEmailsOnly,
	exportOrdersWithFields,
	extractUniqueEmails,
} from "@/lib/orders/exportOrders";
import { getAllOrdersForEventExport } from "@/lib/firebase/queries/orders";
import { OrderWithVendorStatus, OrderDoc } from "@/types/orders";

const ALL_FIELDS: ExportField[] = [
	"date",
	"orderId",
	"buyerEmail",
	"buyerName",
	"items",
	"status",
	"subtotal",
	"fees",
	"total",
];

interface OrderExportModalProps {
	isOpen: boolean;
	onClose: () => void;
	eventId?: string; // If provided, fetches from database
	filenamePrefix?: string;
}

export default function OrderExportModal({
	isOpen,
	onClose,
	eventId,
	filenamePrefix = "orders",
}: OrderExportModalProps) {
	// Date range state
	const [startDate, setStartDate] = useState<string>(() => {
		const d = new Date();
		d.setMonth(d.getMonth() - 1);
		return d.toISOString().split("T")[0];
	});
	const [endDate, setEndDate] = useState<string>(() => {
		return new Date().toISOString().split("T")[0];
	});

	// Fetched orders from database
	const [fetchedOrders, setFetchedOrders] = useState<OrderDoc[]>([]);
	const [loading, setLoading] = useState(false);

	// Export mode: 'emails' or 'custom'
	const [mode, setMode] = useState<"emails" | "custom">("emails");

	// Selected fields for custom export
	const [selectedFields, setSelectedFields] = useState<ExportField[]>(
		DEFAULT_SELECTED_FIELDS
	);

	// Fetch orders from database when dates or eventId changes
	useEffect(() => {
		if (!isOpen || !eventId || !startDate || !endDate) {
			setFetchedOrders([]);
			return;
		}

		const fetchOrders = async () => {
			setLoading(true);
			try {
				const start = new Date(startDate);
				start.setHours(0, 0, 0, 0);
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);

				const orders = await getAllOrdersForEventExport(eventId, start, end);
				setFetchedOrders(orders);
			} catch (error) {
				console.error("Error fetching orders for export:", error);
				setFetchedOrders([]);
			} finally {
				setLoading(false);
			}
		};

		fetchOrders();
	}, [isOpen, eventId, startDate, endDate]);

	// Count unique emails
	const uniqueEmailCount = useMemo(() => {
		return extractUniqueEmails(fetchedOrders as OrderWithVendorStatus[]).length;
	}, [fetchedOrders]);

	// Toggle field selection
	const toggleField = (field: ExportField) => {
		setSelectedFields((prev) =>
			prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
		);
	};

	// Handle export
	const handleExport = () => {
		if (fetchedOrders.length === 0) return;

		const timestamp = new Date().toISOString().split("T")[0];
		const filename = `${filenamePrefix}_${timestamp}`;

		if (mode === "emails") {
			exportEmailsOnly(
				fetchedOrders as OrderWithVendorStatus[],
				`${filename}_emails`
			);
		} else {
			// Sort fields by original order
			const sortedFields = ALL_FIELDS.filter((f) => selectedFields.includes(f));
			exportOrdersWithFields(
				fetchedOrders as OrderWithVendorStatus[],
				sortedFields,
				filename
			);
		}

		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-surface border border-stroke rounded-2xl max-w-lg w-full overflow-hidden shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-stroke">
					<h2 className="font-heading font-semibold text-lg flex items-center gap-2">
						<Download className="w-5 h-5 text-cta" />
						Export Orders
					</h2>
					<button
						onClick={onClose}
						className="p-2 text-text-muted hover:text-text hover:bg-bg rounded-lg transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-5 space-y-6">
					{/* Date Range Picker */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text flex items-center gap-2">
							<Calendar className="w-4 h-4 text-text-muted" />
							Select Date Range
						</label>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-text-muted mb-1 block">
									Start Date
								</label>
								<input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="w-full px-3 py-2 bg-bg border border-stroke rounded-lg text-sm focus:outline-none focus:border-cta transition-colors"
								/>
							</div>
							<div>
								<label className="text-xs text-text-muted mb-1 block">
									End Date
								</label>
								<input
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="w-full px-3 py-2 bg-bg border border-stroke rounded-lg text-sm focus:outline-none focus:border-cta transition-colors"
								/>
							</div>
						</div>
						<div className="text-xs text-text-muted flex items-center gap-2">
							{loading ? (
								<>
									<Loader2 className="w-3 h-3 animate-spin" />
									Loading orders...
								</>
							) : (
								<>{fetchedOrders.length} orders found in selected range</>
							)}
						</div>
					</div>

					{/* Export Mode Toggle */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text">Export Type</label>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => setMode("emails")}
								className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
									mode === "emails"
										? "border-cta bg-cta/10 text-cta"
										: "border-stroke bg-bg text-text-muted hover:border-text-muted"
								}`}
							>
								<Mail className="w-4 h-4" />
								<span className="text-sm font-medium">Emails Only</span>
							</button>
							<button
								onClick={() => setMode("custom")}
								className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
									mode === "custom"
										? "border-cta bg-cta/10 text-cta"
										: "border-stroke bg-bg text-text-muted hover:border-text-muted"
								}`}
							>
								<Download className="w-4 h-4" />
								<span className="text-sm font-medium">Custom Fields</span>
							</button>
						</div>
					</div>

					{/* Emails Only Info */}
					{mode === "emails" && (
						<div className="bg-bg rounded-xl p-4 border border-stroke">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-cta/20 flex items-center justify-center">
									<Mail className="w-5 h-5 text-cta" />
								</div>
								<div>
									<div className="font-medium text-text">
										{loading ? "..." : uniqueEmailCount} unique emails
									</div>
									<div className="text-xs text-text-muted">
										Deduplicated buyer emails for marketing
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Custom Field Selection */}
					{mode === "custom" && (
						<div className="space-y-3">
							<label className="text-sm font-medium text-text">
								Select Fields to Include
							</label>
							<div className="flex flex-wrap gap-2">
								{ALL_FIELDS.map((field) => {
									const isSelected = selectedFields.includes(field);
									return (
										<button
											key={field}
											onClick={() => toggleField(field)}
											className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
												isSelected
													? "border-cta bg-cta text-bg"
													: "border-stroke bg-bg text-text-muted hover:border-text-muted"
											}`}
										>
											{isSelected && <Check className="w-3.5 h-3.5" />}
											{EXPORT_FIELD_LABELS[field]}
										</button>
									);
								})}
							</div>
							{selectedFields.length === 0 && (
								<div className="text-xs text-alert">
									Please select at least one field
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between p-5 border-t border-stroke bg-bg/50">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleExport}
						disabled={
							loading ||
							fetchedOrders.length === 0 ||
							(mode === "custom" && selectedFields.length === 0)
						}
						className="flex items-center gap-2 px-5 py-2 bg-cta text-bg font-medium rounded-lg hover:bg-cta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Download className="w-4 h-4" />
						)}
						Export CSV
					</button>
				</div>
			</div>
		</div>
	);
}
