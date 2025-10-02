/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { listMyEventsLite } from "@/lib/firebase/queries/event";
import {
	getMultipleEventTicketStats,
	type TicketStats,
} from "@/lib/firebase/queries/attendeeTickets";

type TabKey = "all" | "published" | "drafts" | "ended";
const TABS: { key: TabKey; label: string }[] = [
	{ key: "all", label: "All Events" },
	{ key: "published", label: "Published" },
	{ key: "drafts", label: "Drafts" },
	{ key: "ended", label: "Ended" },
];

export default function EventsIndexPage() {
	const router = useRouter();
	const auth = getAuth();

	const [tab, setTab] = useState<TabKey>("all");
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);
	const [events, setEvents] = useState<any[]>([]);
	const [ticketStats, setTicketStats] = useState<Record<string, TicketStats>>(
		{}
	);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const uid = auth.currentUser?.uid;
				if (!uid) return router.push("/");

				// Load events first
				const data = await listMyEventsLite(uid);
				if (!mounted) return;
				setEvents(data);

				// Load ticket stats for all events
				if (data.length > 0) {
					const eventIds = data.map((event) => event.id);
					const stats = await getMultipleEventTicketStats(eventIds);
					if (!mounted) return;
					setTicketStats(stats);
				}

				setErr(null);
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load events");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [router, auth.currentUser]);

	const filtered = useMemo(() => {
		if (tab === "all") return events;
		if (tab === "published") {
			// Show published events that haven't ended yet
			return events.filter((e) => {
				if (e.status !== "published") return false;
				try {
					const endDate = e.endAt?.toDate
						? e.endAt.toDate()
						: new Date(e.endAt);
					return endDate.getTime() > Date.now();
				} catch {
					return true; // If date parsing fails, show it
				}
			});
		}
		if (tab === "drafts") return events.filter((e) => e.status === "draft");
		// "ended" tab: show events with status="ended" OR published events past their endAt date
		return events.filter((e) => {
			// if (e.status === "ended") return true;
			if (e.status === "published") {
				try {
					const endDate = e.endAt?.toDate
						? e.endAt.toDate()
						: new Date(e.endAt);
					return endDate.getTime() <= Date.now();
				} catch {
					return false;
				}
			}
			return false;
		});
	}, [events, tab]);

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-6xl mx-auto">
			<div className="flex items-center justify-between">
				<h1 className="font-heading font-semibold text-2xl">Events</h1>
				<Button
					text="Create new event"
					variant="primary"
					onClick={() => router.push("/events/create/details")}
				/>
			</div>

			{err && <p className="mt-3 text-alert">{err}</p>}

			<div className="mt-6 border-b border-stroke flex gap-6">
				{TABS.map((t) => (
					<button
						key={t.key}
						onClick={() => setTab(t.key)}
						className={[
							"pb-3 -mb-px text-sm",
							tab === t.key
								? "border-b-2 border-accent text-accent"
								: "text-text-muted",
						].join(" ")}
					>
						{t.label}
					</button>
				))}
				<div className="ml-auto" />
				{/* Optional: Filter button */}
				{/* <button className="text-sm text-text-muted">Filter</button> */}
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{filtered.map((ev) => (
					<EventCard
						key={ev.id}
						ev={ev}
						ticketStats={ticketStats[ev.id]}
						router={router}
						onOpen={() => router.push(`/events/${ev.id}`)}
					/>
				))}
				{!filtered.length && (
					<div className="col-span-full rounded-2xl bg-surface border border-stroke p-8 text-center text-text-muted">
						No events here yet.
					</div>
				)}
			</div>
		</div>
	);
}

function EventCard({
	ev,
	ticketStats,
	router,
	onOpen,
}: {
	ev: any;
	ticketStats?: TicketStats;
	router: any;
	onOpen: () => void;
}) {
	const startedLabel = (() => {
		try {
			const d = ev.startAt?.toDate ? ev.startAt.toDate() : new Date(ev.startAt);
			const diff = Date.now() - d.getTime();
			const hours = Math.floor(Math.abs(diff) / 36e5);
			return diff >= 0 ? `Started ${hours}h ago` : `Starts in ${hours}h`;
		} catch {
			return "";
		}
	})();

	return (
		<div className="rounded-2xl bg-surface border border-stroke overflow-hidden">
			<img src={ev.coverImageURL} className="h-40 w-full object-cover" alt="" />
			<div className="p-4">
				<div className="flex items-center gap-2">
					<span className="text-xs px-2 py-0.5 rounded-full bg-bg border border-stroke text-text-muted">
						{ev.venue?.city ? "Physical" : "Online"}
					</span>
					{ev.status === "draft" && (
						<span className="text-xs px-2 py-0.5 rounded-full border border-stroke">
							Draft
						</span>
					)}
				</div>
				<h3 className="mt-2 font-medium">{ev.title || "Untitled"}</h3>
				<p className="text-xs text-text-muted mt-1">{startedLabel}</p>

				<div className="mt-4 space-y-2">
					{/* Ticket Statistics */}
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-1 text-text-muted">
							<span>🎟️</span>
							<span>{ticketStats?.totalTickets ?? 0} sold</span>
						</div>
						{ticketStats?.checkedInTickets !== undefined &&
							ticketStats.checkedInTickets > 0 && (
								<div className="flex items-center gap-1 text-green-500">
									<span>✅</span>
									<span>{ticketStats.checkedInTickets} checked in</span>
								</div>
							)}
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-between">
						<div className="text-xs text-text-muted">
							{ticketStats?.activeTickets ?? 0} active tickets
						</div>
						<div className="flex items-center gap-2">
							<button
								title="Scan Tickets"
								onClick={(e) => {
									e.stopPropagation();
									router.push(`/scan?eventId=${ev.id}`);
								}}
								className="flex items-center gap-1 px-2 py-1 bg-accent text-bg rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors"
							>
								<QrCode className="w-3 h-3" />
								Scan
							</button>
							<button
								title="Open"
								onClick={onOpen}
								className="text-sm underline"
							>
								Open
							</button>
							{/* copy / delete icons can go here */}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
