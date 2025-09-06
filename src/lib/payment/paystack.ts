/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFunctions, httpsCallable } from "firebase/functions";
import { CartItem } from "@/hooks/useCheckoutCart";

declare global {
	interface Window {
		PaystackPop: any;
	}
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here";

export interface PaymentMetadata {
	eventId: string;
	customerName: string;
	phone: string;
	orderType: "tickets" | "merch" | "mixed";
}

// Types for fee calculation (matching your backend function)
export type Currency = "NGN" | "USD";

export type PricedLine = {
  _type: "ticket" | "merch";
  name: string;
  unitPriceMinor: number;
  qty: number;
  currency: Currency;
  transferFeesToGuest?: boolean;
};

export type LineWithFee = PricedLine & {
  lineSubtotalMinor: number;
  labeldFeeMinor: number;
  feeChargedToBuyerMinor: number;
  feeAbsorbedByOrgMinor: number;
  lineBuyerTotalMinor: number;
};

export type TotalsWithLabeldFee = {
  currency: Currency;
  itemsSubtotalMinor: number;
  buyerFeesMinor: number;
  absorbedFeesMinor: number;
  totalDueMinor: number;
  lines: LineWithFee[];
};

// Types for the finalizeOrder callable
export interface FinalizeOrderPayload {
  idempotencyKey: string;
  eventId: string;
  buyerUserId?: string | null;
  deliverTo: {
    email: string;
    phone?: string;
  };
  provider: "paystack" | "flutterwave";
  providerRef: {
    initRef: string;
    verifyRef: string;
  };
  lineItems: Array<{
    _type: "ticket" | "merch";
    ticketTypeId?: string;
    merchItemId?: string;
    qty: number;
    variantKey?: string; // for merch size/color
  }>;
  clientTotals: {
    currency: Currency;
    itemsSubtotalMinor: number;
    feesMinor: number;
    totalMinor: number;
  };
}

export interface FinalizeOrderResponse {
  success: boolean;
  orderId?: string;
  status?: "paid" | "pending" | "failed" | "refunded" | "cancelled";
  amount?: { 
    itemsSubtotalMinor: number; 
    feesMinor: number; 
    totalMinor: number; 
    currency: "NGN" | "USD" 
  };
  lineItems?: any[];
  error?: string;
}

export interface CalculateFeesResponse {
  success: boolean;
  totals?: TotalsWithLabeldFee;
  error?: string;
}

export class PaystackService {
	private static instance: PaystackService;
	private isInitialized = false;
	private functions = getFunctions();

	private constructor() {}

	public static getInstance(): PaystackService {
		if (!PaystackService.instance) {
			PaystackService.instance = new PaystackService();
		}
		return PaystackService.instance;
	}

	private async initializePaystack(): Promise<void> {
		if (this.isInitialized) return;

		return new Promise((resolve, reject) => {
			// Check if Paystack is already loaded
			if (window.PaystackPop) {
				this.isInitialized = true;
				resolve();
				return;
			}

			// Load Paystack script
			const script = document.createElement("script");
			script.src = "https://js.paystack.co/v1/inline.js";
			script.async = true;
			script.onload = () => {
				this.isInitialized = true;
				resolve();
			};
			script.onerror = () => {
				reject(new Error("Failed to load Paystack SDK"));
			};
			document.head.appendChild(script);
		});
	}

	public async initializePayment(
		amountMinor: number, // Expecting minor units (kobo) from totals.totalMinor
		email: string,
		metadata: PaymentMetadata,
		onSuccess: (response: any) => void,
		onClose: () => void,
		onError: (error: string) => void
	): Promise<void> {
		try {
			await this.initializePaystack();

			if (!window.PaystackPop) {
				throw new Error("Paystack SDK not loaded");
			}

			// amountMinor is already in kobo, no need to multiply by 100
			const amountInKobo = amountMinor;

			const handler = window.PaystackPop.setup({
				key: PAYSTACK_PUBLIC_KEY,
				email: email,
				amount: amountInKobo,
				currency: "NGN",
				metadata: {
					custom_fields: [
						{
							display_name: "Event ID",
							variable_name: "event_id",
							value: metadata.eventId,
						},
						{
							display_name: "Customer Name",
							variable_name: "customer_name",
							value: metadata.customerName,
						},
						{
							display_name: "Phone",
							variable_name: "phone",
							value: metadata.phone,
						},
						{
							display_name: "Order Type",
							variable_name: "order_type",
							value: metadata.orderType,
						},
					],
				},
				callback: (response: any) => {
					onSuccess(response);
				},
				onClose: () => {
					onClose();
				},
			});

			handler.openIframe();
		} catch (error) {
			console.error("Payment initialization failed:", error);
			onError(error instanceof Error ? error.message : "Payment initialization failed");
		}
	}

	// Helper method to calculate fees using the backend function
	public async calculateFees(items: CartItem[]): Promise<TotalsWithLabeldFee> {
		try {
			// Map CartItem[] to PricedLine[] and enforce single currency
			const currency = (items[0]?.currency ?? "NGN") as Currency;
			const pricedLines: PricedLine[] = items.map(item => ({
				_type: item._type,
				name: item.name,
				unitPriceMinor: item.unitPriceMinor,
				qty: item.qty,
				currency, // enforce single currency
				transferFeesToGuest: item._type === "ticket" ? (item as any).transferFeesToGuest : undefined,
			}));

			// Call Firebase function to calculate fees
			const calculateFees = httpsCallable(this.functions, 'calculateFees');
			const result = await calculateFees({ lines: pricedLines, currency });
			
			const response = result.data as CalculateFeesResponse;
			if (!response.success) {
				throw new Error(response.error || 'Failed to calculate fees');
			}

			return response.totals || this.fallbackFeeCalculation(items, currency);
		} catch (error) {
			console.error("Failed to calculate fees:", error);
			// Fallback to local calculation if Firebase function fails
			const currency = (items[0]?.currency ?? "NGN") as Currency;
			return this.fallbackFeeCalculation(items, currency);
		}
	}

	// Fallback local fee calculation (will be removed once Firebase function is fully integrated)
	private fallbackFeeCalculation(items: CartItem[], currency: Currency): TotalsWithLabeldFee {
		// Convert CartItem[] to PricedLine[] for the fee calculation function
		const pricedLines: PricedLine[] = items.map(item => ({
			_type: item._type,
			name: item.name,
			unitPriceMinor: item.unitPriceMinor,
			qty: item.qty,
			currency, // use the enforced single currency
			transferFeesToGuest: item._type === "ticket" ? (item as any).transferFeesToGuest : undefined,
		}));

		return this.localPriceLinesWithLabeldFee(pricedLines, currency);
	}

	// Local implementation of fee calculation (matching your backend function)
	private localPriceLinesWithLabeldFee(
		lines: PricedLine[],
		currency: Currency
	): TotalsWithLabeldFee {
		if (lines.length === 0) {
			return {
				currency,
				itemsSubtotalMinor: 0,
				buyerFeesMinor: 0,
				absorbedFeesMinor: 0,
				totalDueMinor: 0,
				lines: [],
			};
		}

		// single-currency sanity
		for (const l of lines) {
			if (l.currency !== currency) {
				throw new Error("All line items must use the same currency");
			}
		}

		const PERCENT_RATE = 0.06;     // 6%
		const FLAT_NGN_MINOR = 10000;  // ₦100 => 100 * 100

		function round(n: number) { return Math.round(n); }

		let itemsSubtotalMinor = 0;
		let buyerFeesMinor = 0;
		let absorbedFeesMinor = 0;
		const out: LineWithFee[] = [];

		for (const l of lines) {
			const lineSubtotal = l.unitPriceMinor * l.qty;

			// Apply fee only for tickets.
			let rawFee = 0;
			if (l._type === "ticket") {
				// Percent fee uses the line subtotal currency. Flat ₦100 only makes sense for NGN orders.
				const percent = round(lineSubtotal * PERCENT_RATE);
				const flat    = (l.currency === "NGN") ? FLAT_NGN_MINOR : 0; // if USD later, decide separate flat
				rawFee = percent + flat;
			}

			const transfer = l.transferFeesToGuest ?? true;
			const feeChargedToBuyer   = transfer ? rawFee : 0;
			const feeAbsorbedByOrg    = transfer ? 0      : rawFee;
			const lineBuyerTotal      = lineSubtotal + feeChargedToBuyer;

			itemsSubtotalMinor += lineSubtotal;
			buyerFeesMinor     += feeChargedToBuyer;
			absorbedFeesMinor  += feeAbsorbedByOrg;

			out.push({
				...l,
				lineSubtotalMinor: lineSubtotal,
				labeldFeeMinor: rawFee,
				feeChargedToBuyerMinor: feeChargedToBuyer,
				feeAbsorbedByOrgMinor: feeAbsorbedByOrg,
				lineBuyerTotalMinor: lineBuyerTotal,
			});
		}

		return {
			currency,
			itemsSubtotalMinor,
			buyerFeesMinor,
			absorbedFeesMinor,
			totalDueMinor: itemsSubtotalMinor + buyerFeesMinor,
			lines: out,
		};
	}

	// Helper method to finalize order after successful payment
	public async finalizeOrder(
		payload: FinalizeOrderPayload
	): Promise<string> {
		try {
			const finalizeOrderFn = httpsCallable(this.functions, 'finalizeOrder');
			const res = await finalizeOrderFn(payload);
			
			const data = res.data as FinalizeOrderResponse;
			if (!data.success || !data.orderId) {
				throw new Error(data?.error || "Failed to finalize order");
			}

			return data.orderId;
		} catch (error) {
			console.error("Failed to finalize order:", error);
			throw new Error("Failed to finalize order");
		}
	}
}

export const paystackService = PaystackService.getInstance();
