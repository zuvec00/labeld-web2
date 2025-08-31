/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Stepper from "@/components/ticketing/Stepper";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { listTicketTypes } from "@/lib/firebase/queries/ticketTypes";
import { listMerchForEvent } from "@/lib/firebase/queries/merch";
// If you don’t have this yet, stub it similarly to others:
import type { TicketTypeDoc } from "@/lib/models/ticketType";
import type { MerchItemDoc } from "@/lib/models/merch";
import { listMomentsForEvent } from "@/lib/firebase/queries/moment";
import { fetchEventById, publishEvent } from "@/lib/firebase/queries/event";

const STEPS = [
	{ key: "details", label: "Details" },
	// { key: "theme", label: "Theme" },
	{ key: "tickets", label: "Tickets" },
	{ key: "merch", label: "Merch", optional: true },
	{ key: "moments", label: "Moments", optional: true },
	{ key: "review", label: "Review" },
];

type EventDoc = {
	id: string;
	title: string;
	slug?: string;
	description?: string;
	coverImageURL?: string;
	startAt?: string | Date;
	endAt?: string | Date;
	timezone?: string;
	venue?: {
		name?: string;
		address?: string;
		city?: string;
		state?: string;
		country?: string;
	};
	visibility?: "public" | "unlisted";
	status?: "draft" | "published";
	capacityMode?: "limited" | "unlimited";
	capacityTotal?: number | null;
};

type MomentDoc = {
	id: string;
	type: "image" | "video" | "text";
	thumbURL?: string;
	mediaURL?: string;
	text?: string;
};

export default function ReviewPage() {
	const router = useRouter();
	const { eventId } = useParams<{ eventId: string }>();
	const eventIdString = eventId as string;

	const [loading, setLoading] = useState(true);
	const [publishing, setPublishing] = useState(false);

	const [event, setEvent] = useState<EventDoc | null>(null);
	const [tickets, setTickets] = useState<TicketTypeDoc[]>([]);
	const [merch, setMerch] = useState<MerchItemDoc[]>([]);
	const [moments, setMoments] = useState<MomentDoc[]>([]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const [ev, tix, merchItems, momentsList] = await Promise.all([
					fetchEventById(eventIdString),
					listTicketTypes(eventIdString),
					listMerchForEvent(eventIdString),
					listMomentsForEvent(eventIdString),
				]);
				if (!mounted) return;
				setEvent(ev);
				setTickets(tix);
				setMerch(merchItems);
				setMoments(momentsList);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [eventIdString]);

	const hasActiveTickets = useMemo(
		() => tickets.some((t) => t.isActive),
		[tickets]
	);

	const hasCover = !!event?.coverImageURL;
	const hasDesc = !!(
		event?.description && event.description.trim().length >= 50
	);
	const hasWhen = !!(event?.startAt && event?.endAt);
	const hasWhere =
		!!event?.venue?.name && !!event?.venue?.address && !!event?.venue?.country;

	const checklist = [
		{ ok: hasActiveTickets, label: "At least one active ticket" },
		{ ok: hasCover, label: "Cover image added" },
		{ ok: hasDesc, label: "Description ≥ 50 characters" },
		{ ok: hasWhen, label: "Start & end time set" },
		{ ok: hasWhere, label: "Venue name, address & country set" },
	];

	const canPublish = checklist.every((c) => c.ok);

	async function onPublish() {
		if (!event) return;
		if (!canPublish) return;
		const confirmPublish = confirm("Publish this event now?");
		if (!confirmPublish) return;

		setPublishing(true);
		try {
			await publishEvent(event.id);
			// After publishing, route to a dashboard page or public URL preview
			const publicPath = event.slug
				? `/events/${event.slug}`
				: `/events/${event.id}`;
			router.push(publicPath);
		} finally {
			setPublishing(false);
		}
	}

	if (loading || !event) {
		return (
			<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-4xl mx-auto">
				<Stepper steps={STEPS} activeKey="review" />
				<div className="min-h-dvh grid place-items-center">
					<Spinner size="lg" />
				</div>
			</div>
		);
	}

	const publicUrl = event.slug
		? `/events/${event.slug}`
		: `/events/${event.id}`;

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-4xl mx-auto">
			<Stepper steps={STEPS} activeKey="review" />

			{/* Header */}
			<div className="mt-6 flex items-center justify-between">
				<div>
					<h1 className="font-heading font-semibold text-2xl">Final Check</h1>
					<p className="text-text-muted mt-1">
						Review everything before going live. You can still edit after
						publishing.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						text="Preview"
						onClick={() => router.push(publicUrl)}
					/>
					<Button
						variant={canPublish ? "primary" : "disabled"}
						disabled={!canPublish || publishing}
						text={publishing ? "Publishing…" : "Publish Event"}
						onClick={onPublish}
					/>
				</div>
			</div>

			{/* Grid */}
			<div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Event Summary */}
				<SectionCard
					title="Event Details"
					actionText="Edit"
					onAction={() => router.push(`/events/${eventIdString}/details`)}
				>
					<div className="flex gap-4">
						{event.coverImageURL ? (
							<img
								src={event.coverImageURL}
								className="w-28 h-28 object-cover rounded-xl border border-stroke"
								alt=""
							/>
						) : (
							<div className="w-28 h-28 rounded-xl bg-bg border border-stroke" />
						)}
						<div className="flex-1">
							<div className="font-medium">
								{event.title || "Untitled Event"}
							</div>
							<div className="text-sm text-text-muted mt-1 break-all">
								URL: {publicUrl}
							</div>
							<div className="text-sm text-text-muted mt-2">
								{formatDateTimeRange(
									event.startAt,
									event.endAt,
									event.timezone
								)}
							</div>
							<div className="text-sm text-text-muted mt-1">
								{formatVenue(event.venue)}
							</div>
						</div>
					</div>
					{event.description ? (
						<p className="text-sm text-text-muted mt-4 line-clamp-3">
							{event.description}
						</p>
					) : null}
				</SectionCard>

				{/* Checklist */}
				<SectionCard title="Checklist">
					<ul className="space-y-2">
						{checklist.map((c) => (
							<li key={c.label} className="flex items-center gap-2">
								<span
									className={[
										"inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
										c.ok
											? "bg-green-100 text-green-700"
											: "bg-red-100 text-red-700",
									].join(" ")}
								>
									{c.ok ? "✓" : "!"}
								</span>
								<span className={c.ok ? "text-text" : "text-alert"}>
									{c.label}
								</span>
							</li>
						))}
					</ul>
					{!canPublish && (
						<div className="text-xs text-text-muted mt-3">
							Fix the items above to enable publishing.
						</div>
					)}
				</SectionCard>

				{/* Tickets */}
				<SectionCard
					title={`Tickets (${tickets.length})`}
					actionText="Edit"
					onAction={() => router.push(`/events/${eventIdString}/tickets`)}
				>
					{tickets.length ? (
						<div className="space-y-3">
							{tickets.map((t) => (
								<SummaryRow
									key={t.id}
									primary={t.name}
									secondary={`${
										t.kind === "single"
											? "Single"
											: `Group x${t.groupSize || 2}`
									}`}
									meta={[
										t.price != null
											? `${t.currency ?? "NGN"} ${(
													t.price / 100
											  ).toLocaleString()}`
											: "Free",
										t.quantityTotal == null
											? "Unlimited"
											: `${t.quantityRemaining ?? 0}/${t.quantityTotal} left`,
										t.isActive ? "Active" : "Inactive",
									]}
								/>
							))}
						</div>
					) : (
						<EmptyLine text="No tickets created" />
					)}
				</SectionCard>

				{/* Merch */}
				<SectionCard
					title={`Merch (${merch.length})`}
					actionText="Edit"
					onAction={() => router.push(`/events/${eventIdString}/merch`)}
				>
					{merch.length ? (
						<div className="space-y-3">
							{merch.map((m) => (
								<div key={m.id} className="flex items-center gap-3">
									{m.images?.[0]?.url ? (
										<img
											src={m.images[0].url}
											className="w-12 h-12 object-cover rounded-lg border border-stroke"
											alt=""
										/>
									) : (
										<div className="w-12 h-12 rounded-lg bg-bg border border-stroke" />
									)}
									<SummaryRow
										primary={m.name}
										secondary={`${m.currency} ${(
											m.priceMinor / 100
										).toLocaleString()}`}
										meta={[
											m.stockTotal == null
												? "Unlimited"
												: `${m.stockRemaining ?? 0}/${m.stockTotal} left`,
										]}
									/>
								</div>
							))}
						</div>
					) : (
						<EmptyLine text="No merch added" />
					)}
				</SectionCard>

				{/* Moments */}
				<SectionCard
					title={`Moments (${moments.length})`}
					actionText="Edit"
					onAction={() => router.push(`/events/${eventIdString}/moments`)}
				>
					{moments.length ? (
						<div className="grid grid-cols-3 gap-2">
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
						</div>
					) : (
						<EmptyLine text="No moments yet" />
					)}
				</SectionCard>
			</div>

			{/* Footer */}
			<div className="flex justify-between pt-8 mt-10 border-t border-stroke">
				<Button
					variant="outline"
					text="Back"
					onClick={() => router.push(`/events/${eventIdString}/moments`)}
				/>
				<div className="flex gap-2">
					<Button
						variant="outline"
						text="Preview"
						onClick={() => router.push(publicUrl)}
					/>
					<Button
						variant={canPublish ? "primary" : "disabled"}
						disabled={!canPublish || publishing}
						text={publishing ? "Publishing…" : "Publish Event"}
						onClick={onPublish}
					/>
				</div>
			</div>
		</div>
	);
}

/* ---------- Small UI bits ---------- */

function SectionCard({
	title,
	actionText,
	onAction,
	children,
}: {
	title: string;
	actionText?: string;
	onAction?: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl bg-surface border border-stroke p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-heading font-semibold">{title}</h3>
				{actionText && onAction ? (
					<Button variant="outline" text={actionText} onClick={onAction} />
				) : null}
			</div>
			{children}
		</div>
	);
}

function SummaryRow({
	primary,
	secondary,
	meta,
}: {
	primary: string;
	secondary?: string;
	meta?: string[];
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div>
				<div className="font-medium">{primary}</div>
				{secondary && (
					<div className="text-sm text-text-muted">{secondary}</div>
				)}
			</div>
			{!!meta?.length && (
				<div className="text-xs text-text-muted flex flex-wrap gap-3">
					{meta.map((m, i) => (
						<span key={i}>{m}</span>
					))}
				</div>
			)}
		</div>
	);
}

function EmptyLine({ text }: { text: string }) {
	return <div className="text-sm text-text-muted">{text}</div>;
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

function formatVenue(v?: EventDoc["venue"]) {
	if (!v) return "Venue not set";
	const bits = [v.name, v.address, v.city, v.state, v.country].filter(Boolean);
	return bits.length ? bits.join(", ") : "Venue not set";
}
