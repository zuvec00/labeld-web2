"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Download, ArrowLeft, Home } from "lucide-react";
import {
	getFirestore,
	doc,
	getDoc,
	collection,
	query,
	where,
	getDocs,
	Timestamp,
} from "firebase/firestore";
import { TicketQR } from "@/components/events/TicketQR";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/checkout/calc";
import { downloadFromUrl } from "@/lib/download";

interface OrderData {
	id: string;
	eventId: string;
	status: string;
	lineItems: Array<{
		_type: "ticket" | "merch";
		ticketTypeId?: string;
		merchItemId?: string;
		name: string;
		unitPriceMinor: number;
		currency: string;
		qty: number;
		subtotalMinor: number;
		admitType?: string;
		size?: string;
		color?: string;
	}>;
	amount: {
		currency: string;
		itemsSubtotalMinor: number;
		feesMinor: number;
		totalMinor: number;
	};
	deliverTo?: {
		email?: string;
		phone?: string;
	};
	createdAt: Timestamp;
}

interface TicketData {
	id: string;
	ticketCode: string;
	qrString: string;
	status: string;
	ticketTypeId: string;
	eventId: string;
	ownerUserId: string;
}

interface EventData {
	id: string;
	name: string;
	startAt: Timestamp;
	venue:
		| string
		| {
				name?: string;
				address?: string;
				city?: string;
				state?: string;
				country?: string;
		  };
}

export default function SuccessPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const orderId = searchParams.get("orderId");

	const [order, setOrder] = useState<OrderData | null>(null);
	const [tickets, setTickets] = useState<TicketData[]>([]);
	const [event, setEvent] = useState<EventData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [downloadingTicket, setDownloadingTicket] = useState<string | null>(
		null
	);
	const [downloadingReceipt, setDownloadingReceipt] = useState(false);

	useEffect(() => {
		if (!orderId) {
			setError("No order ID provided");
			setLoading(false);
			return;
		}

		async function fetchOrderData() {
			try {
				const db = getFirestore();

				// Fetch order data
				if (!orderId) {
					setError("No order ID provided");
					setLoading(false);
					return;
				}

				const orderDoc = await getDoc(doc(db, "orders", orderId));
				if (!orderDoc.exists()) {
					setError("Order not found");
					setLoading(false);
					return;
				}

				const orderData = { id: orderDoc.id, ...orderDoc.data() } as OrderData;
				setOrder(orderData);

				// Fetch event data
				const eventDoc = await getDoc(doc(db, "events", orderData.eventId));
				if (eventDoc.exists()) {
					setEvent({ id: eventDoc.id, ...eventDoc.data() } as EventData);
				}

				// Fetch tickets for this order
				const ticketsQuery = query(
					collection(db, "attendeeTickets"),
					where("orderId", "==", orderId)
				);
				const ticketsSnap = await getDocs(ticketsQuery);
				const ticketsData = ticketsSnap.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as TicketData[];
				setTickets(ticketsData);
			} catch (err) {
				console.error("Error fetching order data:", err);
				setError("Failed to load order details");
			} finally {
				setLoading(false);
			}
		}

		fetchOrderData();
	}, [orderId]);

	if (loading) {
		return (
			<div className="min-h-screen bg-bg flex items-center justify-center">
				<div className="text-center">
					<Spinner size="lg" />
					<p className="text-text-muted mt-4 font-manrope">
						Loading your order...
					</p>
				</div>
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className="min-h-screen bg-bg flex items-center justify-center">
				<div className="text-center">
					<div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<Check className="w-10 h-10 text-red-400" />
					</div>
					<h1 className="text-2xl font-heading font-bold text-white mb-2">
						Order Not Found
					</h1>
					<p className="text-text-muted font-manrope">
						{error || "Unable to load order details"}
					</p>
				</div>
			</div>
		);
	}

	const formatDate = (timestamp: Timestamp) => {
		if (!timestamp) return "TBD";
		const date = timestamp.toDate();
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatVenue = (
		venue:
			| string
			| {
					name?: string;
					address?: string;
					city?: string;
					state?: string;
					country?: string;
			  }
	) => {
		if (typeof venue === "string") {
			return venue;
		}

		if (typeof venue === "object" && venue !== null) {
			const parts = [];
			if (venue.name) parts.push(venue.name);
			if (venue.address) parts.push(venue.address);
			if (venue.city) parts.push(venue.city);
			if (venue.state) parts.push(venue.state);
			if (venue.country) parts.push(venue.country);
			return parts.join(", ");
		}

		return "Venue TBD";
	};

	const ticketItems = order.lineItems.filter((item) => item._type === "ticket");
	const merchItems = order.lineItems.filter((item) => item._type === "merch");

	// Download handlers
	const ticketFn = process.env.NEXT_PUBLIC_TICKETPDF_URL!;
	const receiptFn = process.env.NEXT_PUBLIC_RECEIPTPDF_URL!;

	async function handleDownloadTicketPDF(ticket: TicketData) {
		try {
			setDownloadingTicket(ticket.id);
			// your onRequest reads /tickets/:id.pdf from req.path, so we can append it:
			const url = `${ticketFn}/tickets/${ticket.id}.pdf`;
			await downloadFromUrl(url, `ticket-${ticket.ticketCode}.pdf`);
		} catch (error) {
			console.error("Failed to download ticket PDF:", error);
			// You could add a toast notification here
		} finally {
			setDownloadingTicket(null);
		}
	}

	async function handleDownloadReceipt() {
		if (!order) return;
		try {
			setDownloadingReceipt(true);
			const url = `${receiptFn}/orders/${order.id}.pdf`;
			await downloadFromUrl(url, `receipt-${order.id}.pdf`);
		} catch (error) {
			console.error("Failed to download receipt PDF:", error);
			// You could add a toast notification here
		} finally {
			setDownloadingReceipt(false);
		}
	}

	return (
		<div className="min-h-screen bg-bg">
			{/* Navigation Header */}
			<div className="border-b border-stroke">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<button
								onClick={() => router.back()}
								className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
							>
								<ArrowLeft className="w-4 h-4" />
								<span className="font-manrope">Back</span>
							</button>
							<div className="h-6 w-px bg-stroke"></div>
							<button
								onClick={() => router.push("/e/discover")}
								className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
							>
								<Home className="w-4 h-4" />
								<span className="font-manrope">Discover</span>
							</button>
						</div>
						<div className="text-sm text-text-muted font-manrope">
							Order #{order.id}
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Success Header */}
				<div className="text-center mb-12">
					<div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
						<Check className="w-12 h-12 text-accent" />
					</div>

					<h1 className="text-4xl font-heading font-bold text-white mb-4">
						Payment Successful!
					</h1>

					<p className="text-lg text-text-muted font-manrope max-w-2xl mx-auto">
						Your order has been confirmed. Check your email for details and make
						sure to download your tickets below.
					</p>
				</div>

				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column - Order Summary */}
					<div className="lg:col-span-1">
						<div className="bg-surface rounded-2xl border border-stroke p-6 sticky top-8">
							<h2 className="text-xl font-heading font-semibold mb-6 text-white">
								Order Summary
							</h2>

							<div className="space-y-4">
								{event && (
									<div className="pb-4 border-b border-stroke">
										<h3 className="font-medium text-white font-manrope mb-2">
											{event.name}
										</h3>
										<p className="text-sm text-text-muted font-manrope">
											{formatDate(event.startAt)}
										</p>
										<p className="text-sm text-text-muted font-manrope">
											{formatVenue(event.venue)}
										</p>
									</div>
								)}

								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-text-muted font-manrope">
											Order ID
										</span>
										<span className="font-medium text-white font-manrope text-sm">
											{order.id}
										</span>
									</div>

									<div className="flex justify-between">
										<span className="text-text-muted font-manrope">
											Tickets
										</span>
										<span className="font-medium text-white font-manrope">
											{tickets.length}
										</span>
									</div>

									{merchItems.length > 0 && (
										<div className="flex justify-between">
											<span className="text-text-muted font-manrope">
												Merchandise
											</span>
											<span className="font-medium text-white font-manrope">
												{merchItems.length} items
											</span>
										</div>
									)}

									<div className="pt-4 border-t border-stroke">
										<div className="flex justify-between items-center">
											<span className="text-lg font-heading font-semibold text-white">
												Total Paid
											</span>
											<span className="text-xl font-heading font-bold text-accent">
												{formatCurrency(
													order.amount.totalMinor,
													order.amount.currency as "NGN" | "USD"
												)}
											</span>
										</div>
									</div>

									{order.deliverTo?.email && (
										<div className="pt-4 border-t border-stroke">
											<p className="text-sm text-text-muted font-manrope">
												Confirmation sent to:
											</p>
											<p className="font-medium text-white font-manrope">
												{order.deliverTo.email}
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Tickets & Merch */}
					<div className="lg:col-span-2 space-y-8">
						{/* Tickets */}
						{tickets.length > 0 && (
							<div className="bg-surface rounded-2xl border border-stroke p-6">
								<div className="flex items-center justify-between mb-6">
									<h2 className="text-xl font-heading font-semibold text-white">
										Your Tickets ({tickets.length})
									</h2>
									<button
										className="flex items-center gap-2 bg-cta hover:bg-cta/90 text-black font-heading font-semibold px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
										onClick={() => handleDownloadReceipt()}
										disabled={downloadingReceipt}
									>
										{downloadingReceipt ? (
											<>
												<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
												Downloading...
											</>
										) : (
											<>
												<Download className="w-4 h-4" />
												Download Receipt
											</>
										)}
									</button>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{tickets.map((ticket) => (
										<div
											key={ticket.id}
											className="border border-stroke rounded-xl p-6 bg-bg/50"
										>
											<div className="text-center">
												<h3 className="font-medium text-white font-manrope mb-2">
													{ticketItems.find(
														(item) => item.ticketTypeId === ticket.ticketTypeId
													)?.name || "Ticket"}
												</h3>
												<p className="text-sm text-text-muted font-manrope mb-4">
													Code: {ticket.ticketCode}
												</p>

												{/* QR Code */}
												<div className="flex justify-center mb-4">
													<TicketQR value={ticket.qrString} size={140} />
												</div>

												{/* Status */}
												<div className="flex justify-center mb-4">
													<span
														className={`px-3 py-1 rounded-full text-sm font-manrope font-medium ${
															ticket.status === "used"
																? "bg-red-500/20 text-red-400"
																: ticket.status === "active"
																? "bg-green-500/20 text-green-400"
																: "bg-yellow-500/20 text-yellow-400"
														}`}
													>
														{ticket.status}
													</span>
												</div>

												{/* Download Button */}
												<button
													className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-cta/90 text-black font-heading font-semibold px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
													onClick={() => handleDownloadTicketPDF(ticket)}
													disabled={downloadingTicket === ticket.id}
												>
													{downloadingTicket === ticket.id ? (
														<>
															<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
															Downloading...
														</>
													) : (
														<>
															<Download className="w-4 h-4" />
															Download Ticket
														</>
													)}
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Merch Items */}
						{merchItems.length > 0 && (
							<div className="bg-surface rounded-2xl border border-stroke p-6">
								<h2 className="text-xl font-heading font-semibold mb-6 text-white">
									Your Merchandise ({merchItems.length})
								</h2>

								<div className="space-y-4">
									{merchItems.map((item, index) => (
										<div
											key={`${item.merchItemId}-${index}`}
											className="border border-stroke rounded-xl p-4 bg-bg/50"
										>
											<div className="flex justify-between items-center">
												<div>
													<h3 className="font-medium text-white font-manrope">
														{item.name}
													</h3>
													<p className="text-sm text-text-muted font-manrope">
														Quantity: {item.qty}
														{item.size && ` • Size: ${item.size}`}
														{item.color && ` • Color: ${item.color}`}
													</p>
												</div>
												<div className="text-right">
													<p className="font-medium text-white font-manrope">
														{formatCurrency(
															item.subtotalMinor,
															item.currency as "NGN" | "USD"
														)}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Important Notice */}
						<div className="bg-accent/10 border border-accent/20 rounded-2xl p-6">
							<h3 className="text-lg font-heading font-semibold text-white mb-3">
								📱 Important: Download Your Tickets
							</h3>
							<p className="text-text-muted font-manrope mb-4">
								Make sure to download your tickets and receipt. You&apos;ll need
								them for entry to the event.
							</p>
							<div className="flex flex-col sm:flex-row gap-3">
								<button
									className="flex items-center justify-center gap-2 bg-cta hover:bg-cta/90 text-black font-heading font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
									onClick={() => handleDownloadReceipt()}
									disabled={downloadingReceipt}
								>
									{downloadingReceipt ? (
										<>
											<div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
											Downloading Receipt...
										</>
									) : (
										<>
											<Download className="w-5 h-5" />
											Download Receipt
										</>
									)}
								</button>
								<button
									className="bg-surface border border-stroke text-white hover:bg-stroke font-heading font-semibold px-6 py-3 rounded-xl transition-all duration-200"
									onClick={() => router.push("/e/discover")}
								>
									Discover More Events
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
