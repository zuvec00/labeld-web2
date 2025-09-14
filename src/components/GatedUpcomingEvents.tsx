// components/GatedUpcomingEvents.tsx (Server Component)
import React from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import UpcomingEvents from "./dashboard/UpcomingEvents";
import { Lock, Calendar, Ticket } from "lucide-react";

interface GatedUpcomingEventsProps {
	events: Array<{
		id: string;
		title: string;
		startAt: Date;
		ticketsSold: number;
		gmv: number;
		capacity?: number;
	}>;
	loading?: boolean;
	className?: string;
}

export default function GatedUpcomingEvents({
	events,
	loading = false,
	className = "",
}: GatedUpcomingEventsProps) {
	const eventsEnabled = isFeatureEnabled("events");

	if (loading) {
		return (
			<div
				className={`rounded-lg bg-surface border border-stroke p-4 ${className}`}
			>
				<div className="animate-pulse">
					<div className="h-4 bg-stroke rounded w-32 mb-4"></div>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="animate-pulse flex items-center justify-between p-3 border border-stroke rounded"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-stroke rounded"></div>
									<div className="space-y-1">
										<div className="h-3 bg-stroke rounded w-24"></div>
										<div className="h-2 bg-stroke rounded w-16"></div>
									</div>
								</div>
								<div className="text-right space-y-1">
									<div className="h-3 bg-stroke rounded w-12"></div>
									<div className="h-2 bg-stroke rounded w-8"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (eventsEnabled) {
		// Show real data when events are enabled
		return (
			<UpcomingEvents events={events} loading={loading} className={className} />
		);
	}

	// Show locked state when events are disabled
	return (
		<div
			className={`rounded-lg bg-surface border border-stroke p-4 opacity-70 cursor-not-allowed relative ${className}`}
			title="Unlocking later this season"
		>
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-medium text-text-muted">Events at a Glance</h3>
				<div className="flex items-center gap-2">
					<Calendar className="w-4 h-4 text-text-muted opacity-50" />
					<Lock className="w-4 h-4 text-text-muted opacity-70" />
				</div>
			</div>

			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="flex items-center justify-between p-3 bg-background/50 border border-stroke/50 rounded"
					>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-background/50 border border-stroke/50 rounded flex items-center justify-center">
								<Calendar className="w-4 h-4 text-text-muted opacity-50" />
							</div>
							<div className="space-y-1">
								<div className="text-sm font-medium text-text-muted">—</div>
								<div className="text-xs text-text-muted">—</div>
							</div>
						</div>
						<div className="text-right space-y-1">
							<div className="text-sm font-medium text-text-muted">—</div>
							<div className="text-xs text-text-muted">—</div>
						</div>
					</div>
				))}
			</div>

			{/* Empty state message */}
			<div className="mt-4 pt-3 border-t border-stroke/50 text-center">
				<div className="text-sm text-text-muted mb-2">
					Event analytics coming soon
				</div>
				<div className="text-xs text-text-muted">
					Track ticket sales, revenue, and performance
				</div>
			</div>

			{/* Dropping soon indicator */}
			<div className="mt-4 pt-3 border-t border-stroke/50">
				<div className="flex items-center justify-center gap-2">
					<div className="w-2 h-2 bg-edit rounded-full animate-pulse"></div>
					<span className="text-xs text-edit">Drops with Events</span>
				</div>
			</div>
		</div>
	);
}
