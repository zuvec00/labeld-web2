"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { TicketLookupResult } from "@/lib/firebase/callables/scanner";
import {
	X,
	Search,
	CheckCircle,
	AlertTriangle,
	XCircle,
	Ticket,
} from "lucide-react";
import Button from "@/components/ui/button";

interface ManualEntryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onLookup: (code: string) => Promise<TicketLookupResult>;
	onUseTicket: (qrString: string) => Promise<void>;
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

	const [isCheckingIn, setIsCheckingIn] = useState(false);
	const [checkInSuccess, setCheckInSuccess] = useState(false);

	const handleUseTicket = async () => {
		if (lookupResult?.ticket?.qrString) {
			setIsCheckingIn(true);
			try {
				await onUseTicket(lookupResult.ticket.qrString);
				setCheckInSuccess(true);
				// Delay closing to show success state/allow user to realize it worked
				setTimeout(() => {
					handleClose();
					// Reset states after close animation would be done
					setTimeout(() => {
						setIsCheckingIn(false);
						setCheckInSuccess(false);
					}, 300);
				}, 1000);
			} catch (err) {
				console.error("Check-in failed:", err);
				setIsCheckingIn(false);
				// Optional: show error in modal if needed, but scanner page handles generic errors
			}
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 transition-opacity">
			<div className="w-full max-w-md bg-[#1C1C1C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
					<h2 className="font-heading font-semibold text-white">
						Manual Entry
					</h2>
					<button
						onClick={handleClose}
						className="text-white/50 hover:text-white transition"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-6 overflow-y-auto">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="relative">
							<input
								type="text"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase())}
								placeholder="Enter ticket ID..."
								className="w-full pl-11 pr-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono text-lg tracking-wide uppercase"
								autoFocus
							/>
							<Search
								className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
								size={20}
							/>
						</div>

						<Button
							text={isLoading ? "Searching..." : "Lookup Ticket"}
							onClick={() => {}} // handled by form
							variant="primary"
							disabled={!code.trim() || isLoading}
							className="w-full py-4 text-base"
						/>
					</form>

					{error && (
						<div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
							<AlertTriangle
								className="text-red-500 shrink-0 mt-0.5"
								size={18}
							/>
							<p className="text-red-400 text-sm">{error}</p>
						</div>
					)}

					{lookupResult && (
						<div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
							{lookupResult.status === "ok" && lookupResult.ticket ? (
								<div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
									{/* Status Header */}
									<div className="p-4 bg-white/5 flex items-center gap-3 border-b border-white/5">
										<CheckCircle className="text-green-500" size={24} />
										<div>
											<h3 className="font-bold text-white">Ticket Found</h3>
											<p
												className={`text-xs font-bold uppercase tracking-wider ${
													lookupResult.ticket.status === "valid"
														? "text-green-400"
														: lookupResult.ticket.status === "used"
														? "text-amber-400"
														: "text-red-400"
												}`}
											>
												STATUS: {lookupResult.ticket.status}
											</p>
										</div>
									</div>

									{/* Ticket Details */}
									<div className="p-4 space-y-3">
										<div className="space-y-1">
											<span className="text-xs text-text-muted uppercase">
												Ticket Type
											</span>
											<p className="text-white font-medium">
												{lookupResult.ticket.ticketTypeId}
											</p>
										</div>
										<div className="space-y-1">
											<span className="text-xs text-text-muted uppercase">
												Code
											</span>
											<p className="text-white font-mono bg-black/30 p-2 rounded border border-white/5">
												{lookupResult.ticket.ticketCode}
											</p>
										</div>
									</div>

									{/* Action */}
									{lookupResult.ticket.status === "valid" && (
										<div className="p-4 pt-0">
											<button
												onClick={handleUseTicket}
												disabled={isCheckingIn || checkInSuccess}
												className={`w-full py-3 font-bold rounded-lg transition flex items-center justify-center gap-2 ${
													checkInSuccess
														? "bg-green-500 text-white"
														: "bg-green-500 hover:bg-green-400 text-white"
												}`}
											>
												{isCheckingIn ? (
													<>
														<Spinner size="sm" className="text-white" />
														<span>Checking In...</span>
													</>
												) : checkInSuccess ? (
													<>
														<CheckCircle size={18} />
														<span>Checked In!</span>
													</>
												) : (
													<>
														<Ticket size={18} />
														<span>Check In</span>
													</>
												)}
											</button>
										</div>
									)}
								</div>
							) : (
								<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
									<XCircle className="text-red-500" size={24} />
									<p className="text-red-400 font-medium">Ticket not found</p>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
