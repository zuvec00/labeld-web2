"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Link2, Receipt } from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { DialogFrame } from "@/components/wallet/AddBankAccountDialog";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { displayOrderNumber } from "@/lib/orders/displayOrderNumber";
import { toast } from "@/app/hooks/use-toast";
import type { StoreOrderWithVendorStatus } from "@/types/orders";
import {
	generateStoreOrderInvoice,
	generateStoreOrderReceipt,
	PaymentLinkLimitError,
	prepareManualSalePaymentLink,
	type InvoiceBankDetails,
	type InvoiceOptions,
} from "@/lib/firebase/callables/orderDocuments";

interface Props {
	order: StoreOrderWithVendorStatus;
}

/** What the share dialog is showing. */
interface Shared {
	title: string;
	/** The document or payment URL. */
	url: string;
	/** Ready-to-paste message that includes the URL. */
	message: string;
	/** Opens the PDF (not offered for a bare payment link). */
	openLabel?: string;
}

const customerName = (o: StoreOrderWithVendorStatus) =>
	(o.deliverTo?.fullName ?? "").trim();

const greeting = (o: StoreOrderWithVendorStatus) =>
	customerName(o) ? `Hi ${customerName(o)},\n\n` : "Hello,\n\n";

/**
 * Invoice, receipt and payment link for a store order. Same rules as mobile:
 * an invoice is for pending orders, a receipt for paid ones, and a Pay Now link
 * is a Pro feature for pending manual sales.
 */
export default function OrderDocumentActions({ order }: Props) {
	const router = useRouter();
	const { roleDetection } = useDashboardContext();
	const brandName = roleDetection?.brandName || "";
	const isPro = roleDetection?.brandSubscriptionTier === "pro";

	const isPending = order.status === "pending";
	const isPaid = order.status === "paid";
	const isManualSale = order.saleType === "manual_sale";
	const canIncludePaymentLink = isPro && isManualSale && isPending;

	const [busy, setBusy] = useState<"invoice" | "receipt" | "link" | null>(null);
	const [showInvoiceOptions, setShowInvoiceOptions] = useState(false);
	const [shared, setShared] = useState<Shared | null>(null);
	const [showUpgrade, setShowUpgrade] = useState(false);

	const failed = (title: string, e: unknown) =>
		toast({
			title,
			description: (e as { message?: string })?.message || "Please try again.",
			variant: "destructive",
			duration: 6000,
		});

	const handleInvoice = async (options: InvoiceOptions) => {
		setBusy("invoice");
		try {
			const inv = await generateStoreOrderInvoice(order.id, options);
			setShowInvoiceOptions(false);
			toast({ title: `${inv.invoiceNumber} generated`, duration: 3000 });
			setShared({
				title: inv.invoiceNumber,
				url: inv.invoiceUrl,
				openLabel: "Open PDF",
				message: invoiceMessage(
					brandName,
					order,
					inv.paymentUrl,
					inv.bankDetails,
					inv.invoiceUrl,
				),
			});
		} catch (e) {
			failed("Could not generate invoice", e);
		} finally {
			setBusy(null);
		}
	};

	const handleReceipt = async () => {
		setBusy("receipt");
		try {
			const rec = await generateStoreOrderReceipt(order.id);
			toast({ title: `${rec.receiptNumber} generated`, duration: 3000 });
			setShared({
				title: rec.receiptNumber,
				url: rec.receiptUrl,
				openLabel: "Open PDF",
				message:
					`${greeting(order)}Here is your receipt from ${brandName} for Order ${displayOrderNumber(order)}.\n\n` +
					`Payment has been received. Keep this for your records.\n\n` +
					`Thank you,\n${brandName}\n\nReceipt: ${rec.receiptUrl}`,
			});
		} catch (e) {
			failed("Could not generate receipt", e);
		} finally {
			setBusy(null);
		}
	};

	const handlePaymentLink = async () => {
		setBusy("link");
		try {
			const url = await prepareManualSalePaymentLink(order.id);
			const items = order.lineItems
				.map((i) => `• ${i.qty}x ${i.name}`)
				.join("\n");
			setShared({
				title: "Payment link",
				url,
				message:
					`${greeting(order)}Here are your order details from ${brandName}:\n${items}\n\n` +
					`You can update your shipping details and make payment here:\n${url}\n\n` +
					`Thank you,\n${brandName}`,
			});
		} catch (e) {
			if (e instanceof PaymentLinkLimitError) setShowUpgrade(true);
			else failed("Could not prepare payment link", e);
		} finally {
			setBusy(null);
		}
	};

	return (
		<div className="bg-surface rounded-lg p-4">
			<h3 className="text-lg font-medium text-text mb-3">Documents</h3>

			{isPending || isPaid ? (
				<div className="flex flex-wrap gap-3">
					{isPending && (
						<Button
							text="Send Invoice"
							variant="outline"
							leftIcon={<FileText className="w-4 h-4" />}
							onClick={() => setShowInvoiceOptions(true)}
							disabled={busy !== null}
						/>
					)}
					{isPending && isManualSale && (
						<Button
							text={busy === "link" ? "Preparing..." : "Payment Link"}
							variant="outline"
							leftIcon={<Link2 className="w-4 h-4" />}
							onClick={handlePaymentLink}
							disabled={busy !== null}
						/>
					)}
					{isPaid && (
						<Button
							text={busy === "receipt" ? "Generating..." : "Generate Receipt"}
							variant="outline"
							leftIcon={<Receipt className="w-4 h-4" />}
							onClick={handleReceipt}
							disabled={busy !== null}
						/>
					)}
				</div>
			) : (
				<p className="text-sm text-text-muted">
					Invoices are available for pending orders and receipts for paid
					orders.
				</p>
			)}

			{showInvoiceOptions && (
				<InvoiceOptionsDialog
					canIncludePaymentLink={canIncludePaymentLink}
					submitting={busy === "invoice"}
					onClose={() => setShowInvoiceOptions(false)}
					onSubmit={handleInvoice}
				/>
			)}

			{shared && <ShareDialog shared={shared} onClose={() => setShared(null)} />}

			{showUpgrade && (
				<DialogFrame
					title="Upgrade to Pro"
					onClose={() => setShowUpgrade(false)}
					className="max-w-md"
				>
					<div className="space-y-5">
						<p className="text-sm text-text-muted leading-relaxed">
							You&apos;ve reached the free payment link limit. Upgrade to Pro
							to keep sending customers a secure link to pay online.
						</p>
						<div className="flex gap-3">
							<Button
								text="Not now"
								variant="outline"
								onClick={() => setShowUpgrade(false)}
								className="flex-1"
							/>
							<Button
								text="View plans"
								variant="primary"
								onClick={() => router.push("/pricing")}
								className="flex-1"
							/>
						</div>
					</div>
				</DialogFrame>
			)}
		</div>
	);
}

function invoiceMessage(
	brandName: string,
	order: StoreOrderWithVendorStatus,
	paymentUrl: string | null,
	bank: InvoiceBankDetails | null,
	invoiceUrl: string,
): string {
	const lines: string[] = [];
	if (paymentUrl?.trim()) lines.push(`Pay securely online: ${paymentUrl.trim()}`);
	if (bank?.accountNumber) {
		const parts = [bank.bankName, bank.accountName, bank.accountNumber].filter(
			(v) => v && String(v).trim(),
		);
		lines.push(`Bank transfer: ${parts.join(" - ")}`);
	}
	const payment = lines.length ? `${lines.join("\n")}\n\n` : "";
	return (
		`${greeting(order)}Here is your invoice from ${brandName}.\n\n${payment}` +
		`Thank you,\n${brandName}\n\nInvoice: ${invoiceUrl}`
	);
}

// ------------------------------------------------------------ invoice options

function InvoiceOptionsDialog({
	canIncludePaymentLink,
	submitting,
	onClose,
	onSubmit,
}: {
	canIncludePaymentLink: boolean;
	submitting: boolean;
	onClose: () => void;
	onSubmit: (o: InvoiceOptions) => void;
}) {
	// Defaults match mobile: due in 7 days; online payment recommended when
	// available, otherwise show bank details.
	const [dueDate, setDueDate] = useState(() => {
		const d = new Date();
		d.setDate(d.getDate() + 7);
		return toInputDate(d);
	});
	const [terms, setTerms] = useState("Payment due within 7 days.");
	const [notes, setNotes] = useState("");
	const [includePaymentLink, setIncludePaymentLink] = useState(
		canIncludePaymentLink,
	);
	const [includeBankDetails, setIncludeBankDetails] = useState(
		!canIncludePaymentLink,
	);

	const todayInput = toInputDate(new Date());
	const valid = dueDate >= todayInput;

	return (
		<DialogFrame title="Send Invoice" onClose={onClose} className="max-w-md">
			<div className="space-y-5">
				<p className="text-sm text-text-muted">
					{canIncludePaymentLink
						? "Online payment is recommended for this invoice."
						: "Review the details before sharing the PDF."}
				</p>

				<Field label="Due date">
					<Input
						type="date"
						value={dueDate}
						min={todayInput}
						onChange={(e) => setDueDate(e.target.value)}
						className="text-sm"
					/>
				</Field>

				<Field label="Payment terms">
					<Input
						value={terms}
						onChange={(e) => setTerms(e.target.value)}
						placeholder="Payment due within 7 days."
						className="text-sm"
					/>
				</Field>

				<Field label="Note">
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Add a short note for the customer"
						rows={3}
						className="resize-y"
					/>
				</Field>

				{canIncludePaymentLink && (
					<Toggle
						title="Pay Now link"
						subtitle="Recommended. Customer can pay securely online."
						checked={includePaymentLink}
						onChange={setIncludePaymentLink}
					/>
				)}
				<Toggle
					title={
						canIncludePaymentLink ? "Also show bank details" : "Show bank details"
					}
					subtitle={
						canIncludePaymentLink
							? "Optional backup for customers who prefer transfer."
							: "Shown only if payout details are available."
					}
					checked={includeBankDetails}
					onChange={setIncludeBankDetails}
				/>

				<div className="flex gap-3 pt-1">
					<Button
						text="Cancel"
						variant="outline"
						onClick={onClose}
						disabled={submitting}
						className="flex-1"
					/>
					<Button
						text={submitting ? "Generating..." : "Generate"}
						variant={valid ? "primary" : "disabled"}
						disabled={!valid || submitting}
						onClick={() =>
							onSubmit({
								notes: notes.trim(),
								paymentTerms: terms.trim(),
								// Local end of day so "today" is never already past
								dueDate: new Date(`${dueDate}T23:59:59`),
								includePaymentLink,
								includeBankDetails,
							})
						}
						className="flex-1"
					/>
				</div>
			</div>
		</DialogFrame>
	);
}

function toInputDate(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label className="text-sm text-text-muted">{label}</label>
			{children}
		</div>
	);
}

function Toggle({
	title,
	subtitle,
	checked,
	onChange,
}: {
	title: string;
	subtitle: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<label className="flex items-start justify-between gap-4 rounded-xl border border-stroke p-3 cursor-pointer">
			<div>
				<p className="text-sm font-medium text-text">{title}</p>
				<p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
			</div>
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="mt-1 h-4 w-4 accent-[var(--color-cta,#000)]"
			/>
		</label>
	);
}

// ---------------------------------------------------------------- share dialog

function ShareDialog({
	shared,
	onClose,
}: {
	shared: Shared;
	onClose: () => void;
}) {
	const canNativeShare =
		typeof navigator !== "undefined" && typeof navigator.share === "function";

	const copy = async (text: string, done: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast({ title: done, duration: 2500 });
		} catch {
			toast({
				title: "Couldn't copy",
				description: "Select the text and copy it manually.",
				variant: "destructive",
			});
		}
	};

	const nativeShare = async () => {
		try {
			await navigator.share({ text: shared.message });
		} catch {
			// Dismissing the share sheet is not an error
		}
	};

	return (
		<DialogFrame title={shared.title} onClose={onClose} className="max-w-md">
			<div className="space-y-4">
				<p className="text-sm text-text-muted">
					Send this to your customer. The message includes the link.
				</p>

				<div className="rounded-xl bg-bg border border-stroke p-3 text-xs text-text-muted break-all">
					{shared.url}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<Button
						text="Copy Link"
						variant="outline"
						onClick={() => copy(shared.url, "Link copied")}
					/>
					<Button
						text="Copy Message"
						variant="outline"
						onClick={() => copy(shared.message, "Message copied")}
					/>
					{shared.openLabel && (
						<a
							href={shared.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center rounded-2xl border border-cta px-4 py-3 text-sm font-semibold text-cta hover:opacity-90"
						>
							{shared.openLabel}
						</a>
					)}
					{canNativeShare && (
						<Button text="Share" variant="primary" onClick={nativeShare} />
					)}
				</div>

				<Button text="Done" variant="secondary" onClick={onClose} className="w-full" />
			</div>
		</DialogFrame>
	);
}
