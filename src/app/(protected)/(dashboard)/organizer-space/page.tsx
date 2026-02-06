"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { getAuth } from "firebase/auth";
import {
	doc,
	getDoc,
	collection,
	query,
	where,
	orderBy,
	getDocs,
	Timestamp,
	limit,
	documentId,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { EventOrganizerModel } from "@/lib/models/eventOrganizer";
import { EventModel } from "@/lib/models/event";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/OptimizedImage";
import EventOrganizerOnboardingModal from "@/components/marketing/EventOrganizerOnboardingModal";
import Link from "next/link";
import {
	MapPin,
	Calendar,
	Globe,
	Instagram,
	Twitter,
	Link as LinkIcon,
	Edit,
	ExternalLink,
	ArrowRight,
	Ticket,
	TrendingUp,
	Users,
	Clock,
} from "lucide-react";

// Removed MOCK_EVENTS_SEED

export default function EventOrganizerProfilePage() {
	const router = useRouter();
	const { roleDetection, loading: contextLoading } = useDashboardContext();
	const [organizerData, setOrganizerData] =
		useState<EventOrganizerModel | null>(null);
	const [loading, setLoading] = useState(true);
	const [showOnboarding, setShowOnboarding] = useState(false);

	// Real Data State
	const [stats, setStats] = useState<{
		upcomingEvents: number;
		ticketsSold: number;
		revenue: number;
		avgAttendance: number;
		lifetimeAttendees: number;
		eventsHosted: number;
	} | null>(null);
	const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

	const isDev = process.env.NODE_ENV === "development";

	useEffect(() => {
		async function fetchDashboardData() {
			const auth = getAuth();
			if (!auth.currentUser || contextLoading) return;

			// If context says no profile, stop loading and show empty state
			if (roleDetection && !roleDetection.hasEventOrganizerProfile) {
				setLoading(false);
				return;
			}

			try {
				// 1. Fetch Organizer Profile
				const orgRef = doc(db, "eventOrganizers", auth.currentUser.uid);
				const orgSnap = await getDoc(orgRef);

				if (!orgSnap.exists()) {
					setLoading(false);
					return;
				}

				setOrganizerData(orgSnap.data() as EventOrganizerModel);

				// 2. Fetch Events (Created by user)
				const eventsRef = collection(db, "events");
				const eventsQuery = query(
					eventsRef,
					where("createdBy", "==", auth.currentUser.uid),
					orderBy("startAt", "desc"), // Recent first
				);
				const eventsSnap = await getDocs(eventsQuery);

				const allEvents = eventsSnap.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as EventModel[];

				// Filter Upcoming for Display
				const now = new Date();
				const upcoming = allEvents
					.filter((e) => {
						const start =
							e.startAt instanceof Timestamp
								? e.startAt.toDate()
								: new Date(e.startAt);
						return start > now;
					})
					.sort((a, b) => {
						// Sort upcoming by soonest first
						const dateA =
							a.startAt instanceof Timestamp
								? a.startAt.toDate().getTime()
								: new Date(a.startAt).getTime();
						const dateB =
							b.startAt instanceof Timestamp
								? b.startAt.toDate().getTime()
								: new Date(b.startAt).getTime();
						return dateA - dateB;
					})
					.slice(0, 6); // Just take top 6 for preview

				setUpcomingEvents(
					upcoming.map((e) => ({
						...e,
						startAt:
							e.startAt instanceof Timestamp
								? e.startAt.toDate()
								: new Date(e.startAt),
					})),
				);

				// 3. Calculate Stats
				// Upcoming count
				const upcomingCount = allEvents.filter((e) => {
					const start =
						e.startAt instanceof Timestamp
							? e.startAt.toDate()
							: new Date(e.startAt);
					return start > now;
				}).length;

				// Events Hosted (Total Published)
				const eventsHostedCount = allEvents.filter(
					(e) => e.status === "published",
				).length;

				// For Revenue and Tickets, we need Orders/Tickets
				const eventIds = allEvents.map((e) => e.id);

				// 30d Stats (Top 10 events for now)
				const recentEventIds = eventIds.slice(0, 10);

				let revenue30d = 0;
				let ticketsSold30d = 0;
				let lifetimeAttendees = 0;

				// Fetch Lifetime Attendees across ALL events (chunked)
				if (eventIds.length > 0) {
					// Chunk event IDs into 30 (Firestore limit)
					const chunkSize = 30;
					const chunks = [];
					for (let i = 0; i < eventIds.length; i += chunkSize) {
						chunks.push(eventIds.slice(i, i + chunkSize));
					}

					// Fetch Attendees
					// Note: attendeeTickets are what we use for "Lifetime Attendees"
					const attendeePromises = chunks.map((chunk) => {
						const q = query(
							collection(db, "attendeeTickets"),
							where("eventId", "in", chunk),
							// where("status", "in", ["active", "used"]), // Optional: if we care about status
						);
						return getDocs(q);
					});

					const attendeeSnaps = await Promise.all(attendeePromises);
					attendeeSnaps.forEach((snap) => {
						// Filter out cancelled/refunded if needed, or query it
						// Assuming all docs in this collection count unless status is cancelled
						// Let's filter in memory to be safe if we didn't add status filter to query
						snap.docs.forEach((doc) => {
							const data = doc.data();
							if (data.status === "active" || data.status === "used") {
								lifetimeAttendees++;
							}
						});
					});
				}

				// 30d Revenue/Vol
				if (recentEventIds.length > 0) {
					// Date 30 days ago
					const date30DaysAgo = new Date();
					date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

					const ordersRef = collection(db, "orders");
					const ordersQuery = query(
						ordersRef,
						where("eventId", "in", recentEventIds),
						where("status", "==", "paid"),
					);
					const ordersSnap = await getDocs(ordersQuery);

					ordersSnap.docs.forEach((doc) => {
						const data = doc.data();
						const createdAt =
							data.createdAt instanceof Timestamp
								? data.createdAt.toDate()
								: new Date(data.createdAt);

						// 30d filter
						if (createdAt > date30DaysAgo) {
							revenue30d += data.amount?.totalMinor || 0;

							const ticketItems = (data.lineItems || []).filter(
								(l: any) => l._type === "ticket",
							);
							const qty = ticketItems.reduce(
								(acc: number, item: any) => acc + (item.qty || 0),
								0,
							);
							ticketsSold30d += qty;
						}
					});
				}

				setStats({
					upcomingEvents: upcomingCount,
					ticketsSold: ticketsSold30d,
					revenue: revenue30d,
					avgAttendance: 0,
					lifetimeAttendees,
					eventsHosted: eventsHostedCount,
				});
			} catch (e) {
				console.error("Failed to fetch dashboard data", e);
			} finally {
				setLoading(false);
			}
		}

		fetchDashboardData();
	}, [contextLoading, roleDetection]);

	if (contextLoading || loading) {
		return (
			<div className="h-[50vh] grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	// EMPTY STATE: No Organizer Profile
	if (!organizerData) {
		return (
			<div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
				<div className="w-20 h-20 bg-surface border border-stroke rounded-3xl flex items-center justify-center mb-6 shadow-sm transform -rotate-3">
					<Ticket className="w-8 h-8 text-accent" />
				</div>
				<h1 className="text-3xl font-heading font-bold mb-3">
					Organizer Space
				</h1>
				<p className="text-text-muted mb-8 text-lg">
					This is your command center for managing experiences. Create your
					organizer profile to start dropping events.
				</p>
				<Button
					text="Create Organizer Profile"
					size="lg"
					onClick={() => setShowOnboarding(true)}
					className="w-full sm:w-auto"
				/>
				<EventOrganizerOnboardingModal
					isOpen={showOnboarding}
					onClose={() => setShowOnboarding(false)}
					onComplete={() => window.location.reload()}
				/>
			</div>
		);
	}

	// Calculate display data
	const joinDate =
		organizerData.activeSince ||
		(organizerData.createdAt as any)?.toDate?.()?.getFullYear().toString() ||
		"2024";
	const isPro = organizerData.subscriptionTier === "pro";

	return (
		<div className="p-4 md:p-6 lg:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
			{/* 1. HEADER section */}
			<section className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
				<div className="flex items-center gap-5">
					{/* Logo */}
					<div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stroke bg-surface shadow-sm shrink-0">
						{organizerData.logoUrl ? (
							<OptimizedImage
								src={organizerData.logoUrl}
								fill
								alt={organizerData.organizerName}
								className="object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-bg-subtle text-text-muted font-bold text-2xl">
								{organizerData.organizerName.substring(0, 2).toUpperCase()}
							</div>
						)}
					</div>

					{/* Identity */}
					<div className="space-y-1 min-w-0 flex-1">
						<div className="flex items-center gap-3">
							<h1 className="text-2xl md:text-3xl font-bold font-heading truncate">
								{organizerData.organizerName}
							</h1>
							{isPro && <Badge variant="primary">PRO</Badge>}
						</div>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
							<span className="flex items-center gap-1">
								<span className="text-accent">@</span>
								{organizerData.username}
							</span>
							{organizerData.eventCategory && (
								<Badge
									variant="secondary"
									className="px-2 py-0.5 text-[10px] uppercase tracking-wider"
								>
									{organizerData.eventCategory}
								</Badge>
							)}
							{organizerData.baseCity && (
								<span className="flex items-center gap-1">
									<MapPin className="w-3.5 h-3.5" />
									{organizerData.baseCity}
								</span>
							)}
							<span className="flex items-center gap-1">
								<Clock className="w-3.5 h-3.5" />
								Est. {joinDate}
							</span>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-3 w-full md:w-auto">
					{isPro ? (
						<div className="flex gap-2">
							<Button
								variant="outline"
								className="flex-1 md:flex-none justify-center gap-2"
								onClick={() =>
									window.open(
										`https://${organizerData.slug}.labeld.app`,
										"_blank",
									)
								}
							>
								<Globe className="w-4 h-4" />
								<span className="hidden sm:inline">Visit Site</span>
							</Button>
						</div>
					) : // Public page button hidden for free users until public profile view is ready
					null}
					<Button
						variant="secondary"
						className="flex-1 md:flex-none justify-center gap-2"
						onClick={() => router.push("/organizer-space/edit")}
					>
						<Edit className="w-4 h-4" />
						Edit Profile
					</Button>
				</div>
			</section>

			{/* 2. SNAPSHOT stats */}
			<section>
				{/* Header with Dev Seed */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-text">Overview</h2>
				</div>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					<StatCard
						label="Upcoming Events"
						value={stats?.upcomingEvents ?? "—"}
						icon={<Calendar className="w-4 h-4" />}
					/>
					<StatCard
						label="Tickets Sold (30d)"
						value={stats?.ticketsSold?.toLocaleString() ?? "—"}
						icon={<Ticket className="w-4 h-4" />}
					/>
					<StatCard
						label="Revenue (30d)"
						value={
							stats?.revenue
								? `₦${(stats.revenue / 100).toLocaleString()}`
								: "—"
						}
						icon={<TrendingUp className="w-4 h-4" />}
					/>
					<StatCard
						label="Avg. Attendance"
						value={stats?.avgAttendance ? `${stats.avgAttendance}%` : "—"}
						icon={<Users className="w-4 h-4" />}
					/>
				</div>
			</section>

			{/* 3. EVENTS preview */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-text">Upcoming Events</h2>
					<Link
						href="/events"
						className="text-sm text-text-muted hover:text-text flex items-center gap-1 transition-colors"
					>
						View all <ArrowRight className="w-3.5 h-3.5" />
					</Link>
				</div>

				{upcomingEvents.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{upcomingEvents.map((event) => (
							<div
								key={event.id}
								className="group border border-stroke bg-surface rounded-xl overflow-hidden hover:border-cta/50 transition-colors cursor-pointer"
							>
								<div className="h-40 bg-bg-subtle relative">
									<OptimizedImage
										src={event.coverImageURL}
										fill
										alt={event.title}
										className="object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div className="absolute top-3 right-3">
										<Badge
											variant={
												event.status === "published" ? "success" : "secondary"
											}
										>
											{event.status === "published" ? "Live" : "Draft"}
										</Badge>
									</div>
								</div>
								<div className="p-4">
									<h3 className="font-semibold text-lg line-clamp-1 mb-1">
										{event.title}
									</h3>
									<p className="text-sm text-text-muted mb-4">
										{event.startAt.toLocaleDateString("en-US", {
											weekday: "short",
											month: "short",
											day: "numeric",
											hour: "numeric",
											minute: "2-digit",
										})}
									</p>
									<div className="flex gap-2">
										<Button
											variant="secondary"
											className="w-full justify-center text-xs h-8"
											text="Manage"
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-xl border border-dashed border-stroke p-12 flex flex-col items-center justify-center text-center bg-bg-subtle/30">
						<div className="w-12 h-12 rounded-full bg-surface border border-stroke flex items-center justify-center mb-4 text-text-muted">
							<Calendar className="w-5 h-5" />
						</div>
						<h3 className="font-medium text-text mb-1">No upcoming events</h3>
						<p className="text-sm text-text-muted mb-4 max-w-xs">
							You haven't scheduled any future events yet. Create one to start
							selling.
						</p>
						<Button
							variant="primary"
							text="Create Event"
							onClick={() => console.log("Nav to create")}
						/>
					</div>
				)}
			</section>

			{/* 4. REACH & LINKS */}
			<section className="pt-6 border-t border-stroke">
				<h2 className="text-sm font-semibold text-text uppercase tracking-wider mb-6">
					Reach & Connection
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Stats */}
					<div className="flex gap-8">
						<div>
							<div className="text-2xl font-bold font-heading">
								{/* Placeholder lifetime stats */}
								{stats
									? (stats.lifetimeAttendees?.toLocaleString() ?? "—")
									: "—"}
							</div>
							<div className="text-xs text-text-muted uppercase tracking-wide mt-1">
								Lifetime Attendees
							</div>
						</div>
						<div>
							<div className="text-2xl font-bold font-heading">
								{/* Placeholder lifetime stats */}
								{stats ? (stats.eventsHosted?.toLocaleString() ?? "—") : "—"}
							</div>
							<div className="text-xs text-text-muted uppercase tracking-wide mt-1">
								Events Hosted
							</div>
						</div>
					</div>

					{/* Socials */}
					<div className="flex flex-col gap-3">
						<SocialLink
							icon={<Instagram className="w-4 h-4" />}
							label={organizerData.instagram || "Add Instagram"}
							href={
								organizerData.instagram
									? `https://instagram.com/${organizerData.instagram}`
									: undefined
							}
							active={!!organizerData.instagram}
						/>
						<SocialLink
							icon={<Twitter className="w-4 h-4" />}
							label={organizerData.twitter || "Add Twitter"}
							href={
								organizerData.twitter
									? `https://twitter.com/${organizerData.twitter}`
									: undefined
							}
							active={!!organizerData.twitter}
						/>
						<SocialLink
							icon={<LinkIcon className="w-4 h-4" />}
							label={organizerData.website || "Add Website"}
							href={organizerData.website}
							active={!!organizerData.website}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}

// Sub-components for cleaner file

function StatCard({
	label,
	value,
	icon,
}: {
	label: string;
	value: string | number;
	icon: React.ReactNode;
}) {
	return (
		<div className="bg-surface border border-stroke rounded-xl p-5 flex flex-col justify-between h-28 hover:border-stroke-strong transition-colors min-w-0">
			<div className="flex items-center justify-between text-text-muted mb-2">
				<span className="text-xs font-medium uppercase tracking-wider truncate mr-2">
					{label}
				</span>
				<span className="shrink-0">{icon}</span>
			</div>
			<div className="text-xl sm:text-2xl font-bold font-heading text-text truncate">
				{value}
			</div>
		</div>
	);
}

function SocialLink({
	icon,
	label,
	href,
	active,
}: {
	icon: React.ReactNode;
	label: string;
	href?: string;
	active: boolean;
}) {
	if (!href && active) return null; // Shouldn't happen based on logic above, but safety

	const commonClasses = `flex items-center gap-3 text-sm ${
		active
			? "text-text hover:text-accent"
			: "text-text-muted opacity-50 cursor-not-allowed"
	}`;

	const content = (
		<>
			<div className="w-8 h-8 rounded-full bg-bg-subtle flex items-center justify-center shrink-0">
				{icon}
			</div>
			<span className="truncate">{label}</span>
			{href && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
		</>
	);

	if (href) {
		return (
			<Link
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={commonClasses}
			>
				{content}
			</Link>
		);
	}

	return <div className={commonClasses}>{content}</div>;
}
