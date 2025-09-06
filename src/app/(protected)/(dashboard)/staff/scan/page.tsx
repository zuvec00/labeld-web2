"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function StaffScanPage() {
	const [qrString, setQrString] = useState("");
	const [eventId, setEventId] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function verify() {
		try {
			setBusy(true);
			setMessage(null);
			setError(null);

			const user = auth.currentUser;
			if (!user) throw new Error("Please sign in as staff.");
			if (!eventId.trim()) throw new Error("Enter the correct eventId.");
			if (!qrString.trim()) throw new Error("Paste a QR string from a ticket.");

			const fn = httpsCallable(getFunctions(), "verifyAndUseTicket");
			const res: any = await fn({
				qrString: qrString.trim(),
				eventId: eventId.trim(),
				deviceInfo: {
					ua: typeof navigator !== "undefined" ? navigator.userAgent : "server",
				},
			});

			if (res?.data?.success) {
				setMessage(`✅ Accepted - Ticket ${res.data.ticket.ticketCode}`);
			} else {
				setError("❌ Rejected (no success flag).");
			}
		} catch (e: any) {
			setError(`❌ ${e?.message || "Rejected."}`);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="min-h-screen bg-bg">
			<div className="max-w-2xl mx-auto px-6 py-12">
				<div className="bg-surface border border-stroke rounded-2xl p-8">
					<h1 className="text-3xl font-heading font-bold text-white mb-2">
						Staff Scanner
					</h1>
					<p className="text-text-muted font-manrope mb-8">
						Paste a QR string or type it out to test the verifier callable.
					</p>

					<div className="space-y-6">
						<div>
							<label className="block text-white font-manrope font-medium mb-2">
								Event ID
							</label>
							<input
								type="text"
								value={eventId}
								onChange={(e) => setEventId(e.target.value)}
								placeholder="Enter event ID"
								className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-white font-manrope placeholder:text-text-muted focus:border-accent focus:outline-none"
							/>
						</div>

						<div>
							<label className="block text-white font-manrope font-medium mb-2">
								QR String
							</label>
							<textarea
								value={qrString}
								onChange={(e) => setQrString(e.target.value)}
								placeholder="base64url(payload).base64url(hmac)"
								rows={6}
								className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-white font-manrope placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
							/>
						</div>

						<Button
							text={busy ? "Verifying..." : "Verify & Use"}
							onClick={verify}
							disabled={busy || !eventId.trim() || !qrString.trim()}
							className="w-full bg-cta hover:bg-cta/90 disabled:opacity-50 disabled:cursor-not-allowed"
						/>

						{busy && (
							<div className="flex items-center justify-center py-4">
								<Spinner size="md" />
							</div>
						)}

						{message && (
							<div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
								<p className="text-green-400 font-manrope">{message}</p>
							</div>
						)}

						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
								<p className="text-red-400 font-manrope">{error}</p>
							</div>
						)}
					</div>

					<div className="mt-8 pt-6 border-t border-stroke">
						<h3 className="text-white font-heading font-semibold mb-3">
							Quick Test Plan
						</h3>
						<div className="space-y-2 text-text-muted font-manrope text-sm">
							<p>
								1. Ensure a paid order exists → confirm /attendeeTickets were
								minted
							</p>
							<p>2. Log in as the buyer → visit /tickets → see QR(s)</p>
							<p>3. Copy the qrString and visit this page as staff</p>
							<p>
								4. Paste qrString, enter the correct eventId, click Verify & Use
							</p>
							<p>• First time: ✅ Accepted</p>
							<p>• Second time: ❌ Rejected (&quot;Ticket already used&quot;)</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
