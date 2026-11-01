import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";

/**
 * Order documents: invoice and receipt PDFs, and the customer payment link.
 * Same callables and payloads as the mobile order details screen.
 */

/** The free plan's payment-link allowance is used up; the brand needs Pro. */
export class PaymentLinkLimitError extends Error {
	constructor(message = "You've reached the free payment link limit.") {
		super(message);
		this.name = "PaymentLinkLimitError";
	}
}

interface CallableErrorShape {
	code?: string;
	message?: string;
	details?: { code?: string } | null;
}

function message(err: unknown, fallback: string): string {
	const m = (err as CallableErrorShape | null)?.message;
	return m?.trim() ? m : fallback;
}

// ----------------------------------------------------------------- payment link

/** A secure online payment link for a pending manual sale. */
export async function prepareManualSalePaymentLink(
	orderId: string,
): Promise<string> {
	try {
		const { data } = await httpsCallable<{ orderId: string }, Record<string, any>>(
			functions,
			"prepareManualSalePaymentLink",
		)({ orderId });
		const url = typeof data.paymentUrl === "string" ? data.paymentUrl : "";
		if (!url) throw new Error("Missing payment link");
		return url;
	} catch (err) {
		const e = err as CallableErrorShape;
		// Same triggers as mobile: any of these means "upgrade to keep going".
		if (
			e?.code === "functions/permission-denied" ||
			e?.code === "functions/resource-exhausted" ||
			e?.details?.code === "FREE_PAYMENT_LINK_LIMIT_REACHED"
		) {
			throw new PaymentLinkLimitError();
		}
		throw new Error(message(err, "Could not prepare payment link."));
	}
}

// --------------------------------------------------------------------- invoice

export interface InvoiceOptions {
	notes: string;
	paymentTerms: string;
	/** Due date; sent as an ISO string. */
	dueDate: Date;
	includePaymentLink: boolean;
	includeBankDetails: boolean;
}

export interface InvoiceBankDetails {
	bankName?: string;
	accountName?: string;
	accountNumber?: string;
}

export interface GeneratedInvoice {
	invoiceUrl: string;
	invoiceNumber: string;
	fileName: string;
	paymentUrl: string | null;
	bankDetails: InvoiceBankDetails | null;
}

export async function generateStoreOrderInvoice(
	orderId: string,
	options: InvoiceOptions,
): Promise<GeneratedInvoice> {
	try {
		const { data } = await httpsCallable<Record<string, unknown>, Record<string, any>>(
			functions,
			"generateStoreOrderInvoice",
		)({
			orderId,
			notes: options.notes,
			paymentTerms: options.paymentTerms,
			dueDate: options.dueDate.toISOString(),
			includePaymentLink: options.includePaymentLink,
			includeBankDetails: options.includeBankDetails,
		});
		const invoiceUrl = data.invoiceUrl ? String(data.invoiceUrl) : "";
		if (!invoiceUrl) throw new Error("Invoice URL was not returned");
		const invoiceNumber = data.invoiceNumber ? String(data.invoiceNumber) : "Invoice";
		return {
			invoiceUrl,
			invoiceNumber,
			fileName: data.fileName ? String(data.fileName) : `${invoiceNumber}.pdf`,
			paymentUrl: data.paymentUrl ? String(data.paymentUrl) : null,
			bankDetails:
				data.bankDetails && typeof data.bankDetails === "object"
					? {
							bankName: data.bankDetails.bankName,
							accountName: data.bankDetails.accountName,
							accountNumber: data.bankDetails.accountNumber,
						}
					: null,
		};
	} catch (err) {
		throw new Error(message(err, "Could not generate invoice."));
	}
}

// --------------------------------------------------------------------- receipt

export interface GeneratedReceipt {
	receiptUrl: string;
	receiptNumber: string;
	fileName: string;
}

export async function generateStoreOrderReceipt(
	orderId: string,
): Promise<GeneratedReceipt> {
	try {
		const { data } = await httpsCallable<{ orderId: string }, Record<string, any>>(
			functions,
			"generateStoreOrderReceipt",
		)({ orderId });
		const receiptUrl = data.receiptUrl ? String(data.receiptUrl) : "";
		if (!receiptUrl) throw new Error("Receipt URL was not returned");
		const receiptNumber = data.receiptNumber ? String(data.receiptNumber) : "Receipt";
		return {
			receiptUrl,
			receiptNumber,
			fileName: data.fileName ? String(data.fileName) : `${receiptNumber}.pdf`,
		};
	} catch (err) {
		throw new Error(message(err, "Could not generate receipt."));
	}
}
