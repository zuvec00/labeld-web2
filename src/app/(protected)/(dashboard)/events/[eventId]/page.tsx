/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
	BarChart3,
	Calendar,
	Settings,
	Ticket as TicketIcon,
	Package as PackageIcon,
	QrCode,
	Info,
	ShoppingCart,
	Banknote,
	Users,
} from "lucide-react";
import { countTicketTypes, fetchEventById } from "@/lib/firebase/queries/event";
import { listTicketTypes } from "@/lib/firebase/queries/ticketTypes";
import { listMerchForEvent } from "@/lib/firebase/queries/merch";
import { listMomentsForEvent } from "@/lib/firebase/queries/moment";
import type { TicketTypeDoc } from "@/lib/models/ticketType";
import type { MerchItemDoc } from "@/lib/models/merch";
import type { MomentDoc } from "@/lib/models/moment";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { OrganizersPanel } from "@/components/events/OrganizersPanel";
import { useAuth } from "@/lib/auth/AuthContext";
import EventDetailsTab from "@/components/events/dashboard/EventDetailsTab";
import EventTicketsTab from "@/components/events/dashboard/EventTicketsTab";
import EventOrdersTab from "@/components/events/dashboard/EventOrdersTab";
import EventSalesTab from "@/components/events/dashboard/EventSalesTab";
import { useEventOrders } from "@/hooks/useEventOrders";

// Decide where “Resume setup” should go based on data you have
function nextSetupPath(ev: any, ticketCount: number) {
	// If you later track theme progress, check it here first
	if (!ticketCount) return `/events/${ev.id}/tickets`;
	return `/events/${ev.id}/merch`;
}

type TabKey =
	| "overview"
	| "details"
	| "tickets"
	| "orders"
	| "sales"
	| "merch"
	| "moments"
	| "settings";

export default function EventDashboardPage() {
	const { eventId } = useParams<{ eventId: string }>();
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [ev, setEv] = useState<any | null>(null);
	const [ticketCount, setTicketCount] = useState(0);
	const [tickets, setTickets] = useState<TicketTypeDoc[]>([]);
	const [merch, setMerch] = useState<MerchItemDoc[]>([]);
	const [moments, setMoments] = useState<MomentDoc[]>([]);
	const [tab, setTab] = useState<TabKey>("overview");
	const [myRoles, setMyRoles] = useState<string[] | undefined>(undefined);

	// Fetch orders for stats calculation
	const { orders: eventOrders } = useEventOrders(eventId);

	// Calculate tickets sold and revenue from paid orders
	const { ticketsSold, revenue, currency } = useMemo(() => {
		let sold = 0;
		let rev = 0;
		let cur = "NGN";

		eventOrders.forEach((order) => {
			if (order.status === "paid") {
				cur = order.amount.currency || "NGN";
				rev += order.amount.itemsSubtotalMinor || 0;
				order.lineItems.forEach((item) => {
					if (item._type === "ticket") {
						sold += item.qty || 1;
					}
				});
			}
		});

		return { ticketsSold: sold, revenue: rev / 100, currency: cur };
	}, [eventOrders]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const [eventDoc, tix, merchItems, momentsList] = await Promise.all([
					fetchEventById(eventId),
					listTicketTypes(eventId),
					listMerchForEvent(eventId),
					listMomentsForEvent(eventId),
				]);
				if (!mounted) return;
				setEv(eventDoc);
				setTickets(tix);
				setMerch(merchItems);
				setMoments(momentsList);
				if (eventDoc) {
					const n = await countTicketTypes(eventDoc.id);
					if (!mounted) return;
					setTicketCount(n);
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [eventId]);

	// Fetch current user's roles for this event
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const db = getFirestore();
				if (user?.uid && eventId) {
					const ref = doc(db, `events/${eventId}/organizers/${user.uid}`);
					const snapshot = await getDoc(ref);
					if (!mounted) return;
					setMyRoles(
						(snapshot.exists() ? snapshot.data()?.roles ?? [] : []) as string[]
					);
				} else {
					setMyRoles([]);
				}
			} catch (err) {
				console.error("Failed to fetch user roles:", err);
				setMyRoles([]);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [user?.uid, eventId]);

	const resumeHref = useMemo(
		() => (ev ? nextSetupPath(ev, ticketCount) : "#"),
		[ev, ticketCount]
	);

	const hasActiveTickets = useMemo(
		() => tickets.some((t) => t.isActive),
		[tickets]
	);

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!ev) {
		return (
			<div className="min-h-dvh grid place-items-center p-6 text-center">
				<div>
					<p className="text-text-muted">Event not found.</p>
					<div className="mt-4">
						<Button
							text="Back to Events"
							variant="outline"
							onClick={() => router.push("/events")}
						/>
					</div>
				</div>
			</div>
		);
	}

	const nav = [
		{ key: "overview", label: "Overview", icon: BarChart3 },
		{ key: "details", label: "Details", icon: Info },
		{ key: "tickets", label: "Tickets", icon: TicketIcon },
		{ key: "orders", label: "Orders", icon: ShoppingCart },
		{ key: "sales", label: "Sales", icon: Banknote },
		{ key: "merch", label: "Merch", icon: PackageIcon },
		{ key: "moments", label: "Moments", icon: Calendar },
		{ key: "settings", label: "Team", icon: Users },
	] as const;

	return (
		<div className="min-h-dvh bg-bg pb-12">
			{/* Clean Header */}
			<div className="border-b border-stroke bg-surface">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
					<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
						<div className="flex gap-4">
							{ev.coverImageURL ? (
								<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-stroke flex-shrink-0 relative">
									<OptimizedImage
										src={ev.coverImageURL}
										alt={ev.title}
										fill
										sizeContext="thumbnail"
										objectFit="cover"
									/>
								</div>
							) : (
								<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-bg border border-stroke flex-shrink-0" />
							)}
							<div>
								<div className="flex items-center gap-2 mb-1">
									<h1 className="font-heading font-bold text-xl sm:text-2xl text-text">
										{ev.title || "Untitled Event"}
									</h1>
									<span
										className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
											ev.status === "published"
												? "bg-green-500/10 text-green-500 border-green-500/20"
												: "bg-text-muted/10 text-text-muted border-stroke"
										}`}
									>
										{ev.status === "published" ? "Published" : "Draft"}
									</span>
								</div>
								<div className="text-sm text-text-muted flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
									<span>
										{formatDateTimeRange(ev.startAt, ev.endAt, ev.timezone)}
									</span>
									<span className="hidden sm:inline">•</span>
									<span>{formatVenue(ev.venue)}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 sm:self-center">
							{ev.status === "draft" && (
								<Button
									variant="outline"
									text="Resume setup"
									onClick={() => router.push(resumeHref)}
									className="text-sm"
								/>
							)}
							{(ev.status === "published" ||
								myRoles?.includes("scanner") ||
								myRoles?.includes("manager") ||
								myRoles?.includes("owner")) && (
								<Button
									variant="primary"
									text="Scan Tickets"
									leftIcon={<QrCode className="w-4 h-4" />}
									onClick={() => router.push(`/scan?eventId=${ev.id}`)}
									className="text-sm"
								/>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Tabs Navigation (Responsive) */}
			<div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-stroke overflow-x-auto scrollbar-hide">
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="flex items-center gap-6 sm:gap-8">
						{nav.map((item) => {
							const active = tab === item.key;
							return (
								<button
									key={item.key}
									onClick={() => setTab(item.key as TabKey)}
									className={[
										"relative py-4 text-md font-medium transition-colors whitespace-nowrap !font-sans",
										active ? "text-text" : "text-text-muted hover:text-text",
									].join(" ")}
								>
									{item.label}
									{active && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cta rounded-full" />
									)}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Tab Content */}
			<main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
				{tab === "overview" && (
					<div className="space-y-6">
						{/* Stats Grid */}
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="bg-surface border border-stroke rounded-xl p-5">
								<h3 className="text-text-muted text-sm font-medium">
									Tickets Sold
								</h3>
								<div className="mt-2 text-2xl font-bold font-heading">
									{ticketsSold}
								</div>
								<div className="mt-1 text-xs text-text-muted">
									{hasActiveTickets ? "Sales active" : "No active tickets"}
								</div>
							</div>
							<div className="bg-surface border border-stroke rounded-xl p-5">
								<h3 className="text-text-muted text-sm font-medium">Revenue</h3>
								<div className="mt-2 text-2xl font-bold font-heading">
									₦{revenue.toLocaleString()}
								</div>
								<div className="mt-1 text-xs text-text-muted">
									Excl. platform fees
								</div>
							</div>
							<div className="bg-surface border border-stroke rounded-xl p-5">
								<h3 className="text-text-muted text-sm font-medium">Merch</h3>
								<div className="mt-2 text-2xl font-bold font-heading">
									{merch.length}
								</div>
								<div className="mt-1 text-xs text-text-muted">Items listed</div>
							</div>
							<div className="bg-surface border border-stroke rounded-xl p-5">
								<h3 className="text-text-muted text-sm font-medium">Moments</h3>
								<div className="mt-2 text-2xl font-bold font-heading">
									{moments.length}
								</div>
								<div className="mt-1 text-xs text-text-muted">
									Shared moments
								</div>
							</div>
						</div>

						{/* Quick Links / Summary */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div className="lg:col-span-2 bg-surface border border-stroke rounded-xl p-6">
								<h3 className="font-heading font-semibold text-lg mb-4">
									Event Performance
								</h3>
								<div className="h-48 grid place-items-center text-text-muted text-sm border border-dashed border-stroke rounded-lg">
									Chart placeholder - Sales over time
								</div>
							</div>
							<div className="bg-surface border border-stroke rounded-xl p-6 flex flex-col gap-4">
								<h3 className="font-heading font-semibold text-lg">
									Quick Actions
								</h3>
								<Button
									variant="outline"
									text="Edit Event Details"
									onClick={() => setTab("details")}
									className="w-full justify-start"
									leftIcon={<Info className="w-4 h-4" />}
								/>
								<Button
									variant="outline"
									text="Manage Tickets"
									onClick={() => setTab("tickets")}
									className="w-full justify-start"
									leftIcon={<TicketIcon className="w-4 h-4" />}
								/>
								<Button
									variant="outline"
									text="View Public Page"
									onClick={() =>
										window.open(
											ev.slug
												? `https://events.labeld.app/${ev.slug}`
												: `/events/${ev.id}`,
											"_blank"
										)
									}
									className="w-full justify-start"
									leftIcon={<BarChart3 className="w-4 h-4" />}
								/>
							</div>
						</div>
					</div>
				)}

				{tab === "details" && <EventDetailsTab eventId={eventId} />}

				{tab === "tickets" && <EventTicketsTab eventId={eventId} />}

				{tab === "orders" && <EventOrdersTab eventId={eventId} />}

				{tab === "sales" && (
					<div className="py-12 text-center bg-surface border border-stroke rounded-xl">
						<Banknote className="mx-auto w-12 h-12 text-text-muted mb-3" />
						<h3 className="font-medium text-lg">Sales & Revenue</h3>
						<p className="text-text-muted mt-1">Sales analytics coming soon.</p>
					</div>
				)}

				{tab === "merch" && (
					<div className="bg-surface border border-stroke rounded-xl p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-heading font-semibold text-xl">
								Merchandise
							</h2>
							<Button
								variant="primary"
								text="Add merch"
								onClick={() => router.push(`/events/${ev.id}/merch`)}
							/>
						</div>
						{merch.length ? (
							<div className="grid gap-3">
								{merch.map((m) => (
									<div
										key={m.id}
										className="flex items-center gap-4 p-4 rounded-xl border border-stroke hover:border-cta/50 transition-colors"
									>
										{m.images?.[0]?.url ? (
											<div className="w-16 h-16 relative rounded-lg overflow-hidden border border-stroke flex-shrink-0">
												<OptimizedImage
													src={m.images[0].url}
													alt={m.name}
													fill
													sizeContext="thumbnail"
													objectFit="cover"
												/>
											</div>
										) : (
											<div className="w-16 h-16 rounded-lg bg-bg border border-stroke flex-shrink-0" />
										)}
										<div className="flex-1 min-w-0">
											<div className="font-medium">{m.name}</div>
											<div className="text-sm text-text-muted">
												{m.currency} {(m.priceMinor / 100).toLocaleString()} •{" "}
												{m.stockTotal == null
													? "Unlimited"
													: `${m.stockRemaining}/${m.stockTotal} left`}
											</div>
										</div>
										<Button
											variant="outline"
											text="Edit"
											onClick={() => router.push(`/events/${ev.id}/merch`)}
											className="text-sm"
										/>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<PackageIcon className="mx-auto w-10 h-10 text-text-muted mb-3" />
								<p className="text-text-muted">No merchandise added yet</p>
							</div>
						)}
					</div>
				)}

				{tab === "moments" && (
					<div className="bg-surface border border-stroke rounded-xl p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-heading font-semibold text-xl">Moments</h2>
							<Button
								variant="primary"
								text="Add moment"
								onClick={() => router.push(`/events/${ev.id}/moments`)}
							/>
						</div>
						{moments.length ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
								{moments.map((m) => (
									<div
										key={m.id}
										className="aspect-square rounded-xl overflow-hidden border border-stroke bg-bg relative"
									>
										{m.type === "image" && m.mediaURL && (
											<OptimizedImage
												src={m.mediaURL}
												alt="Moment"
												fill
												sizeContext="card"
												objectFit="cover"
											/>
										)}
										{m.type === "video" && (
											<div className="w-full h-full grid place-items-center text-text-muted">
												Video
											</div>
										)}
										{m.type === "text" && (
											<div className="p-4 text-sm line-clamp-4">{m.text}</div>
										)}
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<Calendar className="mx-auto w-10 h-10 text-text-muted mb-3" />
								<p className="text-text-muted">No moments shared yet</p>
							</div>
						)}
					</div>
				)}

				{tab === "settings" && (
					<div className="space-y-6">
						<OrganizersPanel
							eventId={ev.id}
							currentUserId={user?.uid}
							currentUserRoles={myRoles as any}
						/>
					</div>
				)}
			</main>
		</div>
	);
}

/* ---------- Helpers ---------- */

function formatDateTimeRange(
	start?: string | Date,
	end?: string | Date,
	tz?: string
) {
	if (!start) return "Date not set";
	try {
		const s = new Date(
			typeof start === "string" || start instanceof Date
				? start
				: (start as any).toDate()
		);
		const fmtDate: Intl.DateTimeFormatOptions = {
			weekday: "short",
			month: "short",
			day: "numeric",
			timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
		};
		const fmtTime: Intl.DateTimeFormatOptions = {
			hour: "numeric",
			minute: "2-digit",
			timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
		};

		const dateStr = new Intl.DateTimeFormat(undefined, fmtDate).format(s);
		const timeStr = new Intl.DateTimeFormat(undefined, fmtTime).format(s);

		return `${dateStr}, ${timeStr}`;
	} catch {
		return "Date not set";
	}
}

function formatVenue(v?: any) {
	if (!v) return "Venue to be announced";
	const bits = [v.name, v.city].filter(Boolean);
	return bits.length ? bits.join(", ") : "Venue to be announced";
}
