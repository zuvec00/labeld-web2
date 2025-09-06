"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
	getFirestore,
	collection,
	query,
	where,
	getDocs,
	DocumentData,
} from "firebase/firestore";
import { TicketQR } from "@/components/events/TicketQR";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function MyTicketsPage() {
	const [tickets, setTickets] = useState<DocumentData[]>([]);
	const [loading, setLoading] = useState(true);
	const [needLogin, setNeedLogin] = useState(false);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (user) => {
			if (!user) {
				setNeedLogin(true);
				setTickets([]);
				setLoading(false);
				return;
			}

			try {
				const db = getFirestore();
				const q = query(
					collection(db, "attendeeTickets"),
					where("ownerUserId", "==", user.uid)
				);
				const snaps = await getDocs(q);
				setTickets(snaps.docs.map((d) => ({ id: d.id, ...d.data() })));
			} catch (error) {
				console.error("Error fetching tickets:", error);
			} finally {
				setLoading(false);
			}
		});

		return () => unsub();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen bg-bg flex items-center justify-center">
				<div className="text-center">
					<Spinner size="lg" />
					<p className="text-text-muted mt-4 font-manrope">
						Loading your tickets...
					</p>
				</div>
			</div>
		);
	}

	if (needLogin) {
		return (
			<div className="min-h-screen bg-bg">
				<div className="max-w-4xl mx-auto px-6 py-12">
					<div className="bg-surface border border-stroke rounded-2xl p-8 text-center">
						<h1 className="text-3xl font-heading font-bold text-white mb-4">
							My Tickets
						</h1>
						<p className="text-text-muted font-manrope mb-6">
							Please sign in to view your tickets.
						</p>
						<Button
							text="Sign In"
							onClick={() => (window.location.href = "/auth")}
							className="bg-cta hover:bg-cta/90"
						/>
					</div>
				</div>
			</div>
		);
	}

	if (!tickets.length) {
		return (
			<div className="min-h-screen bg-bg">
				<div className="max-w-4xl mx-auto px-6 py-12">
					<div className="bg-surface border border-stroke rounded-2xl p-8 text-center">
						<h1 className="text-3xl font-heading font-bold text-white mb-4">
							My Tickets
						</h1>
						<p className="text-text-muted font-manrope mb-6">No tickets yet.</p>
						<Button
							text="Discover Events"
							onClick={() => (window.location.href = "/e/discover")}
							className="bg-cta hover:bg-cta/90"
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-bg">
			<div className="max-w-4xl mx-auto px-6 py-12">
				<h1 className="text-3xl font-heading font-bold text-white mb-8">
					My Tickets
				</h1>

				<div className="space-y-6">
					{tickets.map((ticket) => (
						<div
							key={ticket.id}
							className="bg-surface border border-stroke rounded-2xl p-6 hover:border-accent/50 transition-colors"
						>
							<div className="flex flex-col lg:flex-row gap-6">
								<div className="flex-1 space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="text-text-muted font-manrope text-sm">
												Ticket Code
											</label>
											<p className="text-white font-manrope font-semibold">
												{ticket.ticketCode}
											</p>
										</div>
										<div>
											<label className="text-text-muted font-manrope text-sm">
												Status
											</label>
											<div className="flex items-center gap-2">
												<span
													className={`px-3 py-1 rounded-full text-xs font-manrope font-medium ${
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
										</div>
										<div>
											<label className="text-text-muted font-manrope text-sm">
												Ticket Type
											</label>
											<p className="text-white font-manrope">
												{ticket.ticketTypeId}
											</p>
										</div>
										{ticket.eventName && (
											<div>
												<label className="text-text-muted font-manrope text-sm">
													Event
												</label>
												<p className="text-white font-manrope">
													{ticket.eventName}
												</p>
											</div>
										)}
									</div>

									<div className="bg-bg/50 border border-stroke rounded-xl p-4">
										<p className="text-text-muted font-manrope text-sm">
											💡 <strong>Tip:</strong> Keep this page open or screenshot
											the QR before arriving at the venue.
										</p>
									</div>
								</div>

								<div className="flex-shrink-0">
									<TicketQR value={ticket.qrString} size={200} />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
