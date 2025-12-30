// lib/orders/exportOrders.ts
import { OrderWithVendorStatus, StoreOrderWithVendorStatus, LineItem } from "@/types/orders";

export type ExportField =
	| "date"
	| "orderId"
	| "buyerEmail"
	| "buyerName"
	| "items"
	| "status"
	| "subtotal"
	| "fees"
	| "total";

export const EXPORT_FIELD_LABELS: Record<ExportField, string> = {
	date: "Date Placed",
	orderId: "Order ID",
	buyerEmail: "Buyer Email",
	buyerName: "Buyer Name",
	items: "Items",
	status: "Payment Status",
	subtotal: "Subtotal",
	fees: "Fees",
	total: "Total",
};

export const DEFAULT_SELECTED_FIELDS: ExportField[] = [
	"date",
	"orderId",
	"buyerEmail",
	"items",
	"status",
	"subtotal",
];

/**
 * Format date for CSV export
 */
function formatDate(timestamp: any): string {
	if (!timestamp) return "";
	try {
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return date.toISOString().split("T")[0]; // YYYY-MM-DD
	} catch {
		return "";
	}
}

/**
 * Format money value (convert minor to major)
 */
function formatMoney(minor: number, currency: string = "NGN"): string {
	const major = (minor || 0) / 100;
	return `${currency} ${major.toLocaleString()}`;
}

/**
 * Format line items for display
 */
function formatLineItems(lineItems: LineItem[]): string {
	return lineItems
		.map((item) => {
			const name = item.name || "";
			const qty = item.qty || 1;
			return `${name} x${qty}`;
		})
		.join("; ");
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
	if (!value) return "";
	const stringValue = String(value);
	if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
}

/**
 * Extract unique emails from orders (deduplicated)
 */
export function extractUniqueEmails(
	orders: (OrderWithVendorStatus | StoreOrderWithVendorStatus)[]
): string[] {
	const emails = new Set<string>();
	orders.forEach((order) => {
		const email = order.deliverTo?.email || (order.deliverTo as any)?.email;
		if (email && typeof email === "string" && email.includes("@")) {
			emails.add(email.toLowerCase().trim());
		}
	});
	return Array.from(emails).sort();
}

/**
 * Export only unique emails as CSV
 */
export function exportEmailsOnly(
	orders: (OrderWithVendorStatus | StoreOrderWithVendorStatus)[],
	filename: string = "attendee_emails"
): void {
	const emails = extractUniqueEmails(orders);
	const csvContent = ["Email", ...emails].join("\n");
	downloadCSV(csvContent, `${filename}.csv`);
}

/**
 * Build order row based on selected fields
 */
function buildOrderRow(
	order: OrderWithVendorStatus | StoreOrderWithVendorStatus,
	fields: ExportField[]
): string[] {
	const row: string[] = [];

	fields.forEach((field) => {
		switch (field) {
			case "date":
				row.push(formatDate(order.createdAt));
				break;
			case "orderId":
				row.push(order.id);
				break;
			case "buyerEmail":
				row.push(order.deliverTo?.email || (order.deliverTo as any)?.email || "");
				break;
			case "buyerName":
				row.push(
					(order.deliverTo as any)?.name ||
						(order.deliverTo as any)?.fullName ||
						""
				);
				break;
			case "items":
				row.push(formatLineItems(order.lineItems));
				break;
			case "status":
				row.push(order.status);
				break;
			case "subtotal":
				row.push(formatMoney(order.amount.itemsSubtotalMinor, order.amount.currency));
				break;
			case "fees":
				row.push(formatMoney(order.amount.feesMinor, order.amount.currency));
				break;
			case "total":
				row.push(formatMoney(order.amount.totalMinor, order.amount.currency));
				break;
		}
	});

	return row;
}

/**
 * Export orders with selected fields as CSV
 */
export function exportOrdersWithFields(
	orders: (OrderWithVendorStatus | StoreOrderWithVendorStatus)[],
	fields: ExportField[],
	filename: string = "orders_export"
): void {
	if (fields.length === 0 || orders.length === 0) return;

	// Header row
	const headers = fields.map((f) => EXPORT_FIELD_LABELS[f]);

	// Data rows
	const rows = orders.map((order) =>
		buildOrderRow(order, fields).map(escapeCSV)
	);

	// Combine
	const csvContent = [
		headers.map(escapeCSV).join(","),
		...rows.map((row) => row.join(",")),
	].join("\n");

	downloadCSV(csvContent, `${filename}.csv`);
}

/**
 * Trigger browser download of CSV
 */
export function downloadCSV(content: string, filename: string): void {
	const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", filename);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Filter orders by date range
 */
export function filterOrdersByDateRange(
	orders: (OrderWithVendorStatus | StoreOrderWithVendorStatus)[],
	startDate: Date,
	endDate: Date
): (OrderWithVendorStatus | StoreOrderWithVendorStatus)[] {
	return orders.filter((order) => {
		try {
			const orderDate = order.createdAt?.toDate
				? order.createdAt.toDate()
				: new Date(order.createdAt);
			return orderDate >= startDate && orderDate <= endDate;
		} catch {
			return false;
		}
	});
}
