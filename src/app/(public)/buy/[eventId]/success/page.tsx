"use client";

import { useSearchParams } from "next/navigation";
import { Check, Download, QrCode } from "lucide-react";
import { formatCurrency } from "@/lib/checkout/calc";

export default function SuccessPage() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId");

	// Mock ticket data
	const mockTickets = [
		{
			id: "ticket-001",
			code: "NOLLY-2024-001",
			type: "Nolly Solo Star",
			qrCode:
				"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
		},
		{
			id: "ticket-002",
			code: "NOLLY-2024-002",
			type: "Nolly Solo Star",
			qrCode:
				"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
		},
	];

	return (
		<div>
			{/* Success Header */}
			<div className="text-center mb-8">
				<div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<Check className="w-10 h-10 text-accent" />
				</div>

				<h1 className="text-3xl font-heading font-bold text-text mb-2">
					Payment Successful!
				</h1>

				<p className="text-text-muted">
					Your tickets have been confirmed. Check your email for details.
				</p>
			</div>

			{/* Order Summary */}
			<div className="bg-surface rounded-2xl border border-stroke p-6 mb-6">
				<h2 className="text-lg font-heading font-semibold mb-4">
					Order Summary
				</h2>

				<div className="space-y-3">
					<div className="flex justify-between">
						<span className="text-text-muted">Order ID</span>
						<span className="font-medium">{orderId}</span>
					</div>

					<div className="flex justify-between">
						<span className="text-text-muted">Event</span>
						<span className="font-medium">
							The Nolly Trivia: September Edition
						</span>
					</div>

					<div className="flex justify-between">
						<span className="text-text-muted">Date</span>
						<span className="font-medium">September 15, 2024</span>
					</div>

					<div className="flex justify-between">
						<span className="text-text-muted">Total Paid</span>
						<span className="font-medium text-lg">₦7,450</span>
					</div>
				</div>
			</div>

			{/* Tickets */}
			<div className="bg-surface rounded-2xl border border-stroke p-6">
				<h2 className="text-lg font-heading font-semibold mb-4">
					Your Tickets
				</h2>

				<div className="space-y-4">
					{mockTickets.map((ticket) => (
						<div
							key={ticket.id}
							className="border border-stroke rounded-lg p-4"
						>
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<h3 className="font-medium text-text">{ticket.type}</h3>
									<p className="text-sm text-text-muted">Code: {ticket.code}</p>
								</div>

								<div className="flex items-center gap-2">
									{/* QR Code */}
									<div className="w-16 h-16 bg-white rounded-lg p-2">
										<img
											src={ticket.qrCode}
											alt="QR Code"
											className="w-full h-full"
										/>
									</div>

									{/* Actions */}
									<div className="flex flex-col gap-2">
										<button className="p-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors">
											<QrCode className="w-4 h-4" />
										</button>
										<button className="p-2 bg-surface border border-stroke text-text-muted rounded-lg hover:bg-stroke transition-colors">
											<Download className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Next Steps */}
			<div className="mt-6 text-center">
				<p className="text-sm text-text-muted mb-4">
					You&apos;ll receive an email confirmation with your tickets attached.
				</p>

				<div className="flex items-center justify-center gap-4">
					<button className="bg-cta hover:bg-cta/90 text-black font-heading font-semibold px-6 py-3 rounded-xl transition-all duration-200">
						Add to Wallet
					</button>

					<button className="bg-surface border border-stroke text-text hover:bg-stroke font-heading font-semibold px-6 py-3 rounded-xl transition-all duration-200">
						Download All
					</button>
				</div>
			</div>
		</div>
	);
}
