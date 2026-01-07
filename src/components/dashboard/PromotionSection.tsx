// components/dashboard/PromotionSection.tsx
"use client";

import React from "react";
import { Calendar, Ticket, ExternalLink, Clock } from "lucide-react";
import { EventDashboardData } from "@/hooks/useEventDashboard";
import { EventModel } from "@/lib/models/event";
import Link from "next/link";

interface PromotionSectionProps {
	data: EventDashboardData | null;
	loading?: boolean;
}

function formatEventDate(date: Date): string {
	return date.toLocaleDateString("en-NG", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

function formatEventTime(date: Date): string {
	return date.toLocaleTimeString("en-NG", {
		hour: "numeric",
		minute: "2-digit",
	});
}

function UpcomingEventCard({
	event,
	ticketStats,
}: {
	event: EventModel;
	ticketStats?: { totalTickets: number; checkedInTickets: number };
}) {
	const startAt =
		event.startAt instanceof Date ? event.startAt : new Date(event.startAt);
	const capacityPercent = event.capacityTotal
		? Math.round(((ticketStats?.totalTickets || 0) / event.capacityTotal) * 100)
		: null;

	return (
		<div className="rounded-xl bg-surface border border-stroke p-4 hover:border-purple-500/30 transition-all hover:shadow-lg group">
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<h4 className="text-sm font-medium text-text truncate group-hover:text-purple-500 transition-colors">
						{event.title}
					</h4>
					<div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
						<Calendar className="w-3 h-3" />
						<span>{formatEventDate(startAt)}</span>
						<span>•</span>
						<Clock className="w-3 h-3" />
						<span>{formatEventTime(startAt)}</span>
					</div>
				</div>
				<Link
					href={`/events/${event.id}`}
					className="p-2 rounded-lg hover:bg-bg transition-colors opacity-0 group-hover:opacity-100"
				>
					<ExternalLink className="w-4 h-4 text-text-muted" />
				</Link>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1.5">
						<Ticket className="w-4 h-4 text-purple-500" />
						<span className="text-sm font-medium text-text">
							{ticketStats?.totalTickets || 0}
						</span>
						<span className="text-xs text-text-muted">sold</span>
					</div>
				</div>

				{capacityPercent !== null && (
					<div className="flex items-center gap-2">
						<div className="w-16 h-1.5 bg-bg rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full ${
									capacityPercent >= 80
										? "bg-green-500"
										: capacityPercent >= 50
										? "bg-blue-500"
										: "bg-orange-500"
								}`}
								style={{ width: `${Math.min(capacityPercent, 100)}%` }}
							/>
						</div>
						<span className="text-xs text-text-muted">{capacityPercent}%</span>
					</div>
				)}
			</div>
		</div>
	);
}

function RecentTicketPurchase({
	order,
}: {
	order: { id: string; amount: number; ticketCount: number; createdAt: Date };
}) {
	return (
		<div className="flex items-center justify-between p-3 rounded-lg bg-bg">
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
					<Ticket className="w-4 h-4 text-purple-500" />
				</div>
				<div>
					<p className="text-sm text-text">
						{order.ticketCount} ticket{order.ticketCount > 1 ? "s" : ""}{" "}
						purchased
					</p>
					<p className="text-xs text-text-muted">
						{order.createdAt.toLocaleTimeString("en-NG", {
							hour: "numeric",
							minute: "2-digit",
						})}
					</p>
				</div>
			</div>
			<span className="text-sm font-medium text-text">
				₦{(order.amount / 100).toLocaleString()}
			</span>
		</div>
	);
}

export default function PromotionSection({
	data,
	loading = false,
}: PromotionSectionProps) {
	if (loading || !data) {
		return (
			<div className="space-y-4">
				<div>
					<div className="h-6 w-40 bg-stroke rounded animate-pulse mb-2" />
					<div className="h-4 w-64 bg-stroke rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="space-y-4">
						<div className="h-5 w-32 bg-stroke rounded animate-pulse" />
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-24 rounded-xl bg-stroke animate-pulse"
								/>
							))}
						</div>
					</div>
					<div className="space-y-4">
						<div className="h-5 w-32 bg-stroke rounded animate-pulse" />
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-16 rounded-lg bg-stroke animate-pulse"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Get upcoming events
	const now = new Date();
	const upcomingEvents = data.events
		.filter((e) => {
			const startAt =
				e.startAt instanceof Date ? e.startAt : new Date(e.startAt);
			return startAt > now && e.status === "published";
		})
		.slice(0, 3);

	// Get recent orders with tickets
	const recentOrders = data.recentOrders
		.map((order) => ({
			id: order.id,
			amount: order.amount?.totalMinor || 0,
			ticketCount:
				order.lineItems
					?.filter((item: any) => item._type === "ticket")
					.reduce((sum: number, item: any) => sum + item.qty, 0) || 1,
			createdAt: order.createdAt?.toDate?.() || new Date(order.createdAt),
		}))
		.slice(0, 5);

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-heading font-semibold text-text">
					Promotion & Reach
				</h2>
				<p className="text-sm text-text-muted">
					Your events and recent activity.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Upcoming Events */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-text">Upcoming Events</h3>
						<Link
							href="/events"
							className="text-xs text-purple-500 hover:text-purple-400 transition-colors flex items-center gap-1"
						>
							View all
							<ExternalLink className="w-3 h-3" />
						</Link>
					</div>

					{upcomingEvents.length > 0 ? (
						<div className="space-y-3">
							{upcomingEvents.map((event) => (
								<UpcomingEventCard
									key={event.id}
									event={event}
									ticketStats={
										event.id ? data.ticketStatsByEvent[event.id] : undefined
									}
								/>
							))}
						</div>
					) : (
						<div className="p-8 rounded-xl border border-dashed border-stroke text-center">
							<Calendar className="w-8 h-8 text-text-muted mx-auto mb-2" />
							<p className="text-sm text-text-muted">No upcoming events</p>
							<Link
								href="/events"
								className="inline-block mt-2 text-xs text-purple-500 hover:text-purple-400"
							>
								Create an event →
							</Link>
						</div>
					)}
				</div>

				{/* Recent Ticket Purchases */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-text">Recent Purchases</h3>
						<Link
							href="/orders"
							className="text-xs text-purple-500 hover:text-purple-400 transition-colors flex items-center gap-1"
						>
							View all
							<ExternalLink className="w-3 h-3" />
						</Link>
					</div>

					{recentOrders.length > 0 ? (
						<div className="space-y-2">
							{recentOrders.map((order) => (
								<RecentTicketPurchase key={order.id} order={order} />
							))}
						</div>
					) : (
						<div className="p-8 rounded-xl border border-dashed border-stroke text-center">
							<Ticket className="w-8 h-8 text-text-muted mx-auto mb-2" />
							<p className="text-sm text-text-muted">No ticket purchases yet</p>
							<p className="text-xs text-text-muted mt-1">
								Purchases will appear here as they come in
							</p>
						</div>
					)}

					{/* Moments & Merch suggestions */}
					<div className="space-y-3">
						<div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-lg">✨</span>
								<span className="text-xs font-medium text-purple-500">
									Moments
								</span>
							</div>
							<p className="text-xs text-text-muted">
								Share Moments before events to build hype, and after events for
								social proof. They give attendees a taste of the experience.
							</p>
							<Link
								href="/events"
								className="inline-block mt-2 text-xs text-purple-500 hover:text-purple-400"
							>
								Create a Moment →
							</Link>
						</div>

						<div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
							<div className="flex items-center gap-2 mb-2">
								<span className="text-lg">👕</span>
								<span className="text-xs font-medium text-orange-500">
									Event Merch
								</span>
							</div>
							<p className="text-xs text-text-muted">
								Link exclusive merch to your events. Unique pieces increase
								sales and create lasting memories for attendees.
							</p>
							<Link
								href="/events"
								className="inline-block mt-2 text-xs text-orange-500 hover:text-orange-400"
							>
								Create Pieces →
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
