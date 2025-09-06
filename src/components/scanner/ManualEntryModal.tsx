"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { TicketLookupResult } from "@/lib/firebase/callables/scanner";

interface ManualEntryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onLookup: (code: string) => Promise<TicketLookupResult>;
	onUseTicket: (qrString: string) => void;
}

export default function ManualEntryModal({
	isOpen,
	onClose,
	onLookup,
	onUseTicket,
}: ManualEntryModalProps) {
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [lookupResult, setLookupResult] = useState<TicketLookupResult | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code.trim()) return;

		setIsLoading(true);
		setError(null);
		setLookupResult(null);

		try {
			const result = await onLookup(code.trim());
			setLookupResult(result);
		} catch (error: any) {
			setError(error.message || "Failed to lookup ticket");
		} finally {
			setIsLoading(false);
		}
	};

	const handleUseTicket = () => {
		if (lookupResult?.ticket) {
			// For manual entry, we'll need the qrString from the ticket
			// This would need to be provided by the backend or stored differently
			// For now, we'll use the ticket ID as a fallback
			onUseTicket(lookupResult.ticket.id);
			onClose();
		}
	};

	const handleClose = () => {
		setCode("");
		setLookupResult(null);
		setError(null);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-50"
				onClick={handleClose}
			/>

			{/* Modal */}
			<div className="relative bg-surface border border-stroke rounded-2xl p-6 max-w-md w-full">
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-heading font-semibold text-xl">
						Manual Ticket Entry
					</h2>
					<button
						onClick={handleClose}
						className="text-text-muted hover:text-text text-xl"
					>
						×
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-text mb-2">
							Ticket Code or ID
						</label>
						<input
							type="text"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="e.g., RMEU-99BN or ticket ID"
							className="w-full px-4 py-3 bg-bg border border-stroke rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
							disabled={isLoading}
						/>
					</div>

					<button
						type="submit"
						disabled={!code.trim() || isLoading}
						className="w-full py-3 bg-accent text-bg rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
					>
						{isLoading ? (
							<>
								<Spinner size="sm" className="mr-2" />
								Looking up...
							</>
						) : (
							"Lookup Ticket"
						)}
					</button>
				</form>

				{/* Error */}
				{error && (
					<div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
						<p className="text-red-500 text-sm">{error}</p>
					</div>
				)}

				{/* Lookup Result */}
				{lookupResult && (
					<div className="mt-4 space-y-4">
						{lookupResult.status === "ok" && lookupResult.ticket ? (
							<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-3">
									<span className="text-2xl">✅</span>
									<h3 className="font-medium text-green-500">Ticket Found</h3>
								</div>

								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-text-muted">Code:</span>
										<span className="font-mono font-medium">
											{lookupResult.ticket.ticketCode}
										</span>
									</div>

									<div className="flex justify-between">
										<span className="text-text-muted">Type:</span>
										<span>{lookupResult.ticket.ticketTypeId}</span>
									</div>

									<div className="flex justify-between">
										<span className="text-text-muted">Status:</span>
										<span
											className={`font-medium ${
												lookupResult.ticket.status === "valid"
													? "text-green-500"
													: lookupResult.ticket.status === "used"
													? "text-amber-500"
													: "text-red-500"
											}`}
										>
											{lookupResult.ticket.status.toUpperCase()}
										</span>
									</div>
								</div>

								{lookupResult.ticket.status === "valid" && (
									<button
										onClick={handleUseTicket}
										className="w-full mt-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
									>
										Use Ticket
									</button>
								)}
							</div>
						) : lookupResult.status === "not_found" ? (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
								<div className="flex items-center gap-2">
									<span className="text-2xl">❌</span>
									<h3 className="font-medium text-red-500">Ticket Not Found</h3>
								</div>
								<p className="text-red-500 text-sm mt-1">
									No ticket found with that code or ID.
								</p>
							</div>
						) : (
							<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
								<div className="flex items-center gap-2">
									<span className="text-2xl">⚠️</span>
									<h3 className="font-medium text-amber-500">Event Mismatch</h3>
								</div>
								<p className="text-amber-500 text-sm mt-1">
									This ticket is for a different event.
								</p>
							</div>
						)}
					</div>
				)}

				{/* Instructions */}
				<div className="mt-4 p-3 bg-bg rounded-lg">
					<p className="text-xs text-text-muted">
						Enter the ticket code (e.g., RMEU-99BN) or the full ticket ID to
						lookup and verify a ticket manually.
					</p>
				</div>
			</div>
		</div>
	);
}
