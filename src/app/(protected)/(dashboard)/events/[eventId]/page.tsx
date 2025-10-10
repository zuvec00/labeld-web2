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

// Decide where “Resume setup” should go based on data you have
function nextSetupPath(ev: any, ticketCount: number) {
	// If you later track theme progress, check it here first
	if (!ticketCount) return `/events/${ev.id}/tickets`;
	return `/events/${ev.id}/merch`;
}

type TabKey = "overview" | "tickets" | "merch" | "moments" | "settings";

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
		{ key: "tickets", label: "Tickets", icon: TicketIcon },
		{ key: "merch", label: "Merch", icon: PackageIcon },
		{ key: "moments", label: "Moments", icon: Calendar },
		{ key: "settings", label: "Settings", icon: Settings },
	] as const;

	return (
		<div className="min-h-dvh bg-bg">
			{/* Cover header */}
			<div className="relative">
				<div className="h-32 sm:h-40 lg:h-48 bg-stroke/20 relative">
					{ev.coverImageURL && (
						<OptimizedImage
							src={ev.coverImageURL}
							alt={ev.title}
							fill
							priority
							sizeContext="hero"
							objectFit="cover"
						/>
					)}
					<div className="absolute inset-0 bg-black/30 z-10" />
				</div>

				<div className="relative px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-6xl mx-auto">
					<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6 -mt-8 sm:-mt-16 relative z-10">
						<div className="flex flex-col gap-3 sm:gap-4">
							<div>
								<div className="flex items-center gap-2 sm:gap-3">
									<h1 className="font-heading font-semibold text-lg sm:text-xl lg:text-2xl">
										{ev.title || "Untitled Event"}
									</h1>
									<span className="text-xs px-2 py-0.5 rounded-full border border-stroke">
										{ev.status}
									</span>
								</div>
								<p className="text-text-muted text-sm sm:text-base mt-1">
									{new Date(
										ev.startAt?.toDate ? ev.startAt.toDate() : ev.startAt
									).toLocaleString()}
								</p>
								<p className="text-text-muted text-xs sm:text-sm">
									{ev.venue?.name
										? `${ev.venue.name}${
												ev.venue.city ? " • " + ev.venue.city : ""
										  }`
										: "Venue TBA"}
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
								{/* Scanner Button - Always visible for published events or if user has scanner role */}
								{(ev.status === "published" ||
									myRoles?.includes("scanner") ||
									myRoles?.includes("manager") ||
									myRoles?.includes("owner")) && (
									<Button
										variant="primary"
										text="Scan Tickets"
										onClick={() => router.push(`/scan?eventId=${ev.id}`)}
										className="flex items-center justify-center gap-2 text-sm sm:text-base"
									>
										<QrCode className="w-4 h-4" />
										Scan Tickets
									</Button>
								)}

								{/* Draft banner → Resume */}
								{ev.status === "draft" && (
									<div className="rounded-xl bg-bg border border-stroke p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
										<span className="text-xs sm:text-sm text-text">
											This event is a draft.
										</span>
										<Button
											variant="outline"
											text="Resume setup"
											onClick={() => router.push(resumeHref)}
											className="text-xs sm:text-sm"
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Navigation Tabs */}
			<div className="lg:hidden px-3 sm:px-4">
				<div className="bg-surface border border-stroke rounded-xl p-1 -mt-4 relative z-10">
					<div className="flex overflow-x-auto scrollbar-hide">
						{nav.map((item) => {
							const Icon = item.icon;
							const active = tab === item.key;
							return (
								<button
									key={item.key}
									onClick={() => setTab(item.key as TabKey)}
									className={[
										"flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
										active
											? "bg-cta text-white"
											: "text-text-muted hover:text-text hover:bg-stroke/20",
									].join(" ")}
								>
									<Icon className="w-4 h-4" />
									{item.label}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="px-3 sm:px-4 lg:px-6 max-w-6xl mx-auto flex gap-4 lg:gap-8 pb-8 sm:pb-12">
				{/* Desktop Left nav - Hidden on mobile */}
				<nav className="hidden lg:block w-60 flex-shrink-0 mt-6">
					<div className="bg-surface border border-stroke rounded-2xl p-3 sticky top-6">
						<div className="space-y-1">
							{nav.map((item) => {
								const Icon = item.icon;
								const active = tab === item.key;
								return (
									<button
										key={item.key}
										onClick={() => setTab(item.key as TabKey)}
										className={[
											"w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors",
											active
												? "bg-cta text-white"
												: "text-text-muted hover:text-text hover:bg-stroke/20",
										].join(" ")}
									>
										<Icon className="w-4 h-4" />
										{item.label}
									</button>
								);
							})}
						</div>
					</div>
				</nav>

				{/* Main */}
				<main className="flex-1 mt-3 sm:mt-6 space-y-4 sm:space-y-6">
					{tab === "overview" && (
						<div className="space-y-4 sm:space-y-6">
							{/* Event Summary */}
							<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
								<h3 className="font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4">
									Event Summary
								</h3>
								<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
									{ev.coverImageURL ? (
										<div className="w-20 h-20 sm:w-28 sm:h-28 relative rounded-lg sm:rounded-xl border border-stroke flex-shrink-0 overflow-hidden">
											<OptimizedImage
												src={ev.coverImageURL}
												alt={ev.title}
												fill
												sizeContext="thumbnail"
												objectFit="cover"
											/>
										</div>
									) : (
										<div className="w-20 h-20 sm:w-28 sm:h-28 rounded-lg sm:rounded-xl bg-bg border border-stroke flex-shrink-0" />
									)}
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm sm:text-base">
											{ev.title || "Untitled Event"}
										</div>
										<div className="text-xs sm:text-sm text-text-muted mt-1 break-all">
											URL:{" "}
											{ev.slug
												? `https://eventslabeldapp.vercel.app/${ev.id}-${ev.slug}`
												: `https://labeld.app/events/${ev.id}`}
										</div>
										<div className="text-xs sm:text-sm text-text-muted mt-2">
											{formatDateTimeRange(ev.startAt, ev.endAt, ev.timezone)}
										</div>
										<div className="text-xs sm:text-sm text-text-muted mt-1">
											{formatVenue(ev.venue)}
										</div>
									</div>
								</div>
								{ev.description ? (
									<p className="text-xs sm:text-sm text-text-muted mt-3 sm:mt-4 line-clamp-3">
										{ev.description}
									</p>
								) : null}
							</div>

							{/* Stats Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
								<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
									<h3 className="font-medium text-sm sm:text-base">Tickets</h3>
									<p className="text-xs sm:text-sm text-text-muted mt-1 sm:mt-2">
										{ticketCount} ticket type(s)
									</p>
									<div className="text-xs text-text-muted mt-1">
										{hasActiveTickets
											? "Active tickets available"
											: "No active tickets"}
									</div>
								</div>

								<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
									<h3 className="font-medium text-sm sm:text-base">Merch</h3>
									<p className="text-xs sm:text-sm text-text-muted mt-1 sm:mt-2">
										{merch.length} item(s)
									</p>
									<div className="text-xs text-text-muted mt-1">
										{merch.length > 0
											? "Merchandise available"
											: "No merch added"}
									</div>
								</div>

								<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
									<h3 className="font-medium text-sm sm:text-base">Moments</h3>
									<p className="text-xs sm:text-sm text-text-muted mt-1 sm:mt-2">
										{moments.length} moment(s)
									</p>
									<div className="text-xs text-text-muted mt-1">
										{moments.length > 0 ? "Content shared" : "No moments yet"}
									</div>
								</div>
							</div>

							{/* Quick Actions */}
							<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
								<h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">
									Quick Actions
								</h3>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
									<Button
										variant="outline"
										text="Edit details"
										onClick={() => router.push(`/events/${ev.id}/details`)}
										className="text-xs sm:text-sm"
									/>
									<Button
										variant="outline"
										text="Manage tickets"
										onClick={() => router.push(`/events/${ev.id}/tickets`)}
										className="text-xs sm:text-sm"
									/>
									<Button
										variant="outline"
										text="Manage merch"
										onClick={() => router.push(`/events/${ev.id}/merch`)}
										className="text-xs sm:text-sm"
									/>
									<Button
										variant="outline"
										text="Add moments"
										onClick={() => router.push(`/events/${ev.id}/moments`)}
										className="text-xs sm:text-sm"
									/>
								</div>

								{/* Scanner Action - Prominent for published events */}
								{(ev.status === "published" ||
									myRoles?.includes("scanner") ||
									myRoles?.includes("manager") ||
									myRoles?.includes("owner")) && (
									<div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stroke">
										<Button
											variant="primary"
											text="Scan Event Tickets"
											onClick={() => router.push(`/scan?eventId=${ev.id}`)}
											className="flex items-center gap-2 w-full justify-center text-sm sm:text-base"
										>
											<QrCode className="w-4 h-4" />
											Scan Event Tickets
										</Button>
									</div>
								)}
							</div>

							{/* Event Status */}
							<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
								<h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">
									Event Status
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
									<div>
										<div className="text-xs sm:text-sm font-medium">Status</div>
										<div className="text-xs sm:text-sm text-text-muted mt-1">
											{ev.status === "draft" ? "Draft" : "Published"}
										</div>
									</div>
									<div>
										<div className="text-xs sm:text-sm font-medium">
											Visibility
										</div>
										<div className="text-xs sm:text-sm text-text-muted mt-1">
											{ev.visibility === "public" ? "Public" : "Unlisted"}
										</div>
									</div>
									<div>
										<div className="text-xs sm:text-sm font-medium">
											Timezone
										</div>
										<div className="text-xs sm:text-sm text-text-muted mt-1">
											{ev.timezone || "Not set"}
										</div>
									</div>
									<div>
										<div className="text-xs sm:text-sm font-medium">
											Capacity
										</div>
										<div className="text-xs sm:text-sm text-text-muted mt-1">
											{ev.capacityMode === "unlimited"
												? "Unlimited"
												: `${ev.capacityTotal || 0} people`}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{tab === "tickets" && (
						<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 mb-4">
								<h2 className="font-heading font-semibold text-lg sm:text-xl">
									Tickets
								</h2>
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
									{/* Scanner Button - Show if event is published or user has scanner permissions */}
									{(ev.status === "published" ||
										myRoles?.includes("scanner") ||
										myRoles?.includes("manager") ||
										myRoles?.includes("owner")) && (
										<Button
											variant="outline"
											text="Scan Tickets"
											onClick={() => router.push(`/scan?eventId=${ev.id}`)}
											className="flex items-center justify-center gap-2 text-sm"
										>
											<QrCode className="w-4 h-4" />
											Scan Tickets
										</Button>
									)}
									<Button
										variant="primary"
										text="Create ticket"
										onClick={() => router.push(`/events/${ev.id}/tickets`)}
										className="text-sm"
									/>
								</div>
							</div>
							{tickets.length ? (
								<div className="space-y-3">
									{tickets.map((t) => (
										<div
											key={t.id}
											className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-stroke"
										>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm sm:text-base">
													{t.name}
												</div>
												{t.description && (
													<div className="text-xs sm:text-sm text-text-muted mt-1 line-clamp-2">
														{t.description}
													</div>
												)}
												<div className="text-xs text-text-muted mt-2 flex flex-wrap gap-2 sm:gap-3">
													<span>
														{t.kind === "single"
															? "Single"
															: `Group x${t.groupSize}`}
													</span>
													<span>
														{t.price != null
															? `${t.currency ?? "NGN"} ${(
																	t.price / 100
															  ).toLocaleString()}`
															: "Free"}
													</span>
													<span>
														{t.quantityTotal == null
															? "Unlimited"
															: `${t.quantityRemaining ?? 0}/${
																	t.quantityTotal
															  } left`}
													</span>
													<span
														className={
															t.isActive ? "text-green-600" : "text-red-600"
														}
													>
														{t.isActive ? "Active" : "Inactive"}
													</span>
												</div>
											</div>
											<div className="flex gap-2">
												<Button
													variant="outline"
													text="Edit"
													onClick={() =>
														router.push(`/events/${ev.id}/tickets/${t.id}/edit`)
													}
													className="text-xs sm:text-sm"
												/>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-6 sm:py-8">
									<TicketIcon className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-text-muted mb-3" />
									<p className="text-text-muted text-sm sm:text-base">
										No tickets created yet
									</p>
									<Button
										className="mt-3"
										variant="primary"
										text="Create your first ticket"
										onClick={() => router.push(`/events/${ev.id}/tickets`)}
									/>
								</div>
							)}
						</div>
					)}

					{tab === "merch" && (
						<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 mb-4">
								<h2 className="font-heading font-semibold text-lg sm:text-xl">
									Merchandise
								</h2>
								<Button
									variant="primary"
									text="Add merch"
									onClick={() => router.push(`/events/${ev.id}/merch`)}
									className="text-sm"
								/>
							</div>
							{merch.length ? (
								<div className="space-y-3">
									{merch.map((m) => (
										<div
											key={m.id}
											className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-stroke"
										>
											{m.images?.[0]?.url ? (
												<div className="w-12 h-12 sm:w-16 sm:h-16 relative rounded-lg border border-stroke flex-shrink-0 overflow-hidden">
													<OptimizedImage
														src={m.images[0].url}
														alt={m.name}
														fill
														sizeContext="thumbnail"
														objectFit="cover"
													/>
												</div>
											) : (
												<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-bg border border-stroke flex-shrink-0" />
											)}
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm sm:text-base">
													{m.name}
												</div>
												<div className="text-xs sm:text-sm text-text-muted mt-1">
													{m.currency} {(m.priceMinor / 100).toLocaleString()}
												</div>
												<div className="text-xs text-text-muted mt-1">
													{m.stockTotal == null
														? "Unlimited"
														: `${m.stockRemaining ?? 0}/${m.stockTotal} left`}
												</div>
												{m.sizeOptions?.length && (
													<div className="text-xs text-text-muted mt-1">
														Sizes: {m.sizeOptions.join(", ")}
													</div>
												)}
											</div>
											<div className="flex gap-2">
												<Button
													variant="outline"
													text="Edit"
													className="text-xs sm:text-sm"
												/>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-6 sm:py-8">
									<PackageIcon className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-text-muted mb-3" />
									<p className="text-text-muted text-sm sm:text-base">
										No merchandise added yet
									</p>
									<Button
										className="mt-3"
										variant="primary"
										text="Add your first item"
										onClick={() => router.push(`/events/${ev.id}/merch`)}
									/>
								</div>
							)}
						</div>
					)}

					{tab === "moments" && (
						<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 mb-4">
								<h2 className="font-heading font-semibold text-lg sm:text-xl">
									Moments
								</h2>
								<Button
									variant="primary"
									text="Add moment"
									onClick={() => router.push(`/events/${ev.id}/moments`)}
									className="text-sm"
								/>
							</div>
							{moments.length ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
									{moments.slice(0, 6).map((m) => (
										<div
											key={m.id}
											className="aspect-square rounded-lg overflow-hidden border border-stroke bg-bg"
										>
											{m.type === "image" && m.mediaURL && (
												<img
													src={m.mediaURL}
													className="w-full h-full object-cover"
													alt=""
												/>
											)}
											{m.type === "video" && (
												<div className="w-full h-full grid place-items-center text-xs text-text-muted">
													Video
												</div>
											)}
											{m.type === "text" && (
												<div className="p-2 text-xs line-clamp-3">{m.text}</div>
											)}
										</div>
									))}
									{moments.length > 6 && (
										<div className="aspect-square rounded-lg border border-stroke bg-bg grid place-items-center text-xs text-text-muted">
											+{moments.length - 6} more
										</div>
									)}
								</div>
							) : (
								<div className="text-center py-6 sm:py-8">
									<Calendar className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-text-muted mb-3" />
									<p className="text-text-muted text-sm sm:text-base">
										No moments shared yet
									</p>
									<Button
										className="mt-3"
										variant="primary"
										text="Share your first moment"
										onClick={() => router.push(`/events/${ev.id}/moments`)}
									/>
								</div>
							)}
						</div>
					)}

					{tab === "settings" && (
						<div className="space-y-4 sm:space-y-6">
							<div className="bg-surface border border-stroke rounded-xl sm:rounded-2xl p-4 sm:p-6">
								<h2 className="font-heading font-semibold text-lg sm:text-xl mb-2">
									Settings
								</h2>
								<p className="text-text-muted text-sm sm:text-base">
									Publish / cancel, organizer roles, etc.
								</p>
							</div>

							<OrganizersPanel
								eventId={ev.id}
								currentUserId={user?.uid}
								currentUserRoles={myRoles as any}
							/>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}

/* ---------- Helpers ---------- */

function formatDateTimeRange(
	start?: string | Date,
	end?: string | Date,
	tz?: string
) {
	if (!start || !end) return "Date & time not set";
	try {
		const s = new Date(start);
		const e = new Date(end);
		const fmt: Intl.DateTimeFormatOptions = {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
		};
		return `${new Intl.DateTimeFormat(undefined, fmt).format(
			s
		)} → ${new Intl.DateTimeFormat(undefined, fmt).format(e)} (${
			tz || "local"
		})`;
	} catch {
		return "Date & time not set";
	}
}

function formatVenue(v?: any) {
	if (!v) return "Venue not set";
	const bits = [v.name, v.address, v.city, v.state, v.country].filter(Boolean);
	return bits.length ? bits.join(", ") : "Venue not set";
}
