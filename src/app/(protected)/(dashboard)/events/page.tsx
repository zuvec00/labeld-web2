"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { Spinner } from "@/components/ui/spinner";
import Button, { Button2 } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { QrCode, Ticket, Users } from "lucide-react";
import { listMyEventsLite } from "@/lib/firebase/queries/event";
import {
	getMultipleEventTicketStats,
	type TicketStats,
} from "@/lib/firebase/queries/attendeeTickets";
import { db } from "@/lib/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import EventOrganizerOnboardingModal from "@/components/marketing/EventOrganizerOnboardingModal";

type TabKey = "all" | "published" | "drafts" | "ended";
const TABS: { key: TabKey; label: string }[] = [
	{ key: "all", label: "All Events" },
	{ key: "published", label: "Published" },
	{ key: "drafts", label: "Drafts" },
	{ key: "ended", label: "Ended" },
];

import { deleteEvent } from "@/lib/firebase/queries/event";
import { Copy, Trash2 } from "lucide-react";

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
	const [showEventOrganizerModal, setShowEventOrganizerModal] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const uid = auth.currentUser?.uid;
				if (!uid) return router.push("/");

				// Check if user has event organizer profile
				const eventOrganizerRef = doc(db, "eventOrganizers", uid);
				const eventOrganizerSnap = await getDoc(eventOrganizerRef);
				const hasProfile = eventOrganizerSnap.exists();

				if (!mounted) return;

				if (!hasProfile) {
					setShowEventOrganizerModal(true);
					setLoading(false);
					return;
				}

				const data = await listMyEventsLite(uid);
				if (!mounted) return;
				setEvents(data);

				if (data.length > 0) {
					const eventIds = data.map((event) => event.id);
					const stats = await getMultipleEventTicketStats(eventIds);
					if (!mounted) return;
					setTicketStats(stats);
				}

				setErr(null);
			} catch (e) {
				if (!mounted) return;
				setErr((e as Error)?.message ?? "Failed to load events");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [router, auth.currentUser]);

	const handleEventOrganizerComplete = () => {
		setShowEventOrganizerModal(false);
		window.location.reload();
	};

	const handleDelete = async (eventId: string) => {
		if (!confirm("Are you sure you want to delete this event?")) return;
		try {
			await deleteEvent(eventId);
			setEvents(events.filter((e) => e.id !== eventId));
		} catch (error) {
			console.error(error);
			alert("Failed to delete event");
		}
	};

	const filtered = useMemo(() => {
		if (tab === "all") return events;
		if (tab === "published") {
			return events.filter((e) => {
				if (e.status !== "published") return false;
				try {
					const endDate = e.endAt?.toDate
						? e.endAt.toDate()
						: new Date(e.endAt);
					return endDate.getTime() > Date.now();
				} catch {
					return true;
				}
			});
		}
		if (tab === "drafts") return events.filter((e) => e.status === "draft");
		return events.filter((e) => {
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
				<h1 className="font-heading font-medium text-2xl">Events</h1>
				<Button2
					text="Create new event"
					variant="primary"
					className="font-medium"
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
							"pb-3 -mb-px text-sm !font-sans",
							tab === t.key
								? "border-b-2 border-accent text-accent"
								: "text-text-muted",
						].join(" ")}
					>
						{t.label}
					</button>
				))}
				<div className="ml-auto" />
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				{filtered.map((ev) => (
					<EventCard
						key={ev.id}
						ev={ev}
						ticketStats={ticketStats[ev.id]}
						router={router}
						onOpen={() => router.push(`/events/${ev.id}`)}
						onDelete={() => handleDelete(ev.id)}
					/>
				))}
				{!filtered.length && (
					<div className="col-span-full rounded-2xl bg-surface border border-stroke p-8 text-center text-text-muted">
						No events here yet.
					</div>
				)}
			</div>

			<EventOrganizerOnboardingModal
				isOpen={showEventOrganizerModal}
				onClose={() => setShowEventOrganizerModal(false)}
				onComplete={handleEventOrganizerComplete}
			/>
		</div>
	);
}

function EventCard({
	ev,
	ticketStats,
	router,
	onOpen,
	onDelete,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ev: any;
	ticketStats?: TicketStats;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	router: any;
	onOpen: () => void;
	onDelete: () => void;
}) {
	const startedLabel = (() => {
		try {
			const d = ev.startAt?.toDate ? ev.startAt.toDate() : new Date(ev.startAt);
			const now = new Date();
			const diffMs = d.getTime() - now.getTime();
			const isFuture = diffMs > 0;
			const absDiff = Math.abs(diffMs);

			const hours = Math.floor(absDiff / 36e5);
			const days = Math.floor(absDiff / (36e5 * 24));

			if (isFuture) {
				if (days > 0) return `Starts in ${days}d`;
				return `Starts in ${hours}h`;
			} else {
				if (days > 0) return `Started ${days}d ago`;
				return `Started ${hours}h ago`;
			}
		} catch {
			return "";
		}
	})();

	const isDraft = ev.status === "draft";

	return (
		<div
			onClick={onOpen}
			className="group relative flex flex-row h-48 w-full bg-surface border border-stroke rounded-2xl overflow-hidden hover:border-cta/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
		>
			{/* Left: Image with padding */}
			<div className="p-3 pr-0 h-full w-48 flex-shrink-0">
				<div className="relative w-full h-full rounded-xl overflow-hidden bg-bg">
					<OptimizedImage
						src={ev.coverImageURL}
						alt={ev.title || "Event"}
						fill
						sizeContext="card"
						objectFit="cover"
						className="transition-transform duration-500 group-hover:scale-105"
					/>
				</div>
			</div>

			{/* Right: Content */}
			<div className="flex-1 p-4 flex flex-col justify-between min-w-0">
				{/* Top: Header */}
				<div>
					<div className="flex items-start justify-between">
						{/* Badges */}
						<div className="flex items-center gap-2 mb-1.5">
							{isDraft ? (
								<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stroke/50 text-text-muted">
									Draft
								</span>
							) : (
								<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cta/10 text-cta">
									Published
								</span>
							)}
							{/* Optional Venue Type Badge */}
							{ev.venue?.city && (
								<span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-orange/5 text-brand-orange">
									Physical
								</span>
							)}
						</div>

						{/* Top Actions: Copy (mock) & Delete */}
						<div className="flex items-center gap-1 -mt-1 -mr-1">
							{/* Mock copy button if desired, else just delete */}
							{/* <button 
                                onClick={(e) => { e.stopPropagation(); alert('Copied!'); }}
                                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg transition-colors"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button> */}

							<button
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								className="p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
								title="Delete Event"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</div>

					<h3
						className="text-base leading-tight truncate pr-8 text-text"
						title={ev.title}
					>
						{ev.title || "Untitled Event"}
					</h3>
					<p className="text-xs text-text-muted mt-1 font-normal">
						{startedLabel}
					</p>
				</div>

				<div className="flex items-end justify-between mt-auto pt-2">
					{/* Ticket Stats */}
					<div className="flex flex-col gap-0.5">
						<div className="text-text-muted mb-1 flex items-center gap-1">
							<Ticket className="w-3.5 h-3.5" />
							{ticketStats?.totalTickets ?? 0}
						</div>
						<div className="text-sm text-text-muted">Tickets sold</div>
						{/* <div className="flex items-center gap-1.5 text-xs text-text-muted">
							<Ticket className="w-3.5 h-3.5" />
							<span className="font-medium text-text">
								{ticketStats?.totalTickets ?? 0}
							</span>
							<span>sold</span>
						</div> */}
					</div>

					{/* Actions: Scan Button */}
					<div className="flex items-center gap-2 z-10">
						<button
							title="Scan Tickets"
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/scan?eventId=${ev.id}`);
							}}
							className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 bg-accent text-bg rounded-lg text-xs font-bold hover:bg-accent/90 transition-transform active:scale-95 shadow-sm"
						>
							<QrCode className="w-3.5 h-3.5" />
							Scan
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
